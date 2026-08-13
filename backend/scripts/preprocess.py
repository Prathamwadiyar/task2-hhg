#!/usr/bin/env python3
"""Streaming Preprocessing & Cleaning Pipeline for AI4Bharat MSMARCO-XI Dataset.

Cleans text, preserves metadata, processes in batches, computes dataset statistics,
and outputs clean JSONL files under data/processed/.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple, Union

try:
    import numpy as np
    import pandas as pd
    import pyarrow.parquet as pq
except ImportError as e:
    print(f"Error missing dependency: {e}. Please ensure pandas, numpy, and pyarrow are installed.")
    sys.exit(1)


# Whitespace cleaning regex pattern
WHITESPACE_REGEX = re.compile(r"\s+")


def clean_text(text: Optional[str]) -> str:
    """Normalize whitespace, strip control characters, and clean text string."""
    if not text or not isinstance(text, str):
        return ""
    # Strip null characters and control characters except standard newlines
    cleaned = text.replace("\0", "").strip()
    # Normalize consecutive whitespace/newlines to single space
    cleaned = WHITESPACE_REGEX.sub(" ", cleaned)
    return cleaned


def coerce_to_list(obj: Any) -> List[Any]:
    """Safely convert numpy array, pandas series, string list representation, or list to python list."""
    if obj is None:
        return []
    if isinstance(obj, (list, tuple)):
        return list(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, str):
        # Handle string representation of list like "['a', 'b']" or "[0 0 1 0]"
        obj_str = obj.strip()
        if obj_str.startswith("[") and obj_str.endswith("]"):
            # Try space-separated numbers like "[0 0 0 0 0 1 0 0 0 0]"
            inner = obj_str[1:-1].strip()
            if not inner:
                return []
            parts = inner.split()
            if all(p.isdigit() for p in parts):
                return [int(p) for p in parts]
            # Try splitting by comma
            parts = inner.split(",")
            return [p.strip().strip("'\"") for p in parts if p.strip()]
        return [obj]
    return [obj]


def process_record(row: Dict[str, Any], record_idx: int) -> Optional[Dict[str, Any]]:
    """Clean a raw MSMARCO-XI dataset record and extract normalized metadata."""
    query_id = str(row.get("query_id") or f"Q{record_idx}").strip()
    query_indic = clean_text(str(row.get("query") or ""))
    query_en = clean_text(str(row.get("Eng_Query") or ""))
    
    # Must have at least query or English query
    if not query_indic and not query_en:
        return None

    answer_indic = clean_text(str(row.get("Answer") or ""))
    answer_en = clean_text(str(row.get("Eng_Answer") or ""))

    source_lang = str(row.get("source_lang") or "en").strip().lower()
    target_lang = str(row.get("target_lang") or "indic").strip().lower()
    query_type = str(row.get("query_type") or "general").strip()

    record_id = f"MSMARCO-{target_lang.upper()}-{query_id}"

    # Extract passages nested structure
    raw_passages = row.get("passages")
    passages_list = []

    if isinstance(raw_passages, dict):
        # Look for translated or English passage lists without numpy truthiness ambiguity
        indic_val = raw_passages.get("Translated_passages")
        if indic_val is None or (isinstance(indic_val, (list, np.ndarray)) and len(indic_val) == 0):
            indic_val = raw_passages.get("passage_text")
            
        indic_passages = coerce_to_list(indic_val)
        en_passages = coerce_to_list(raw_passages.get("English_passages"))
        selected_flags = coerce_to_list(raw_passages.get("is_selected"))
        urls = coerce_to_list(raw_passages.get("url"))

        max_len = max(len(indic_passages), len(en_passages), len(selected_flags), 1)

        for p_idx in range(max_len):
            p_indic = clean_text(str(indic_passages[p_idx])) if p_idx < len(indic_passages) else ""
            p_en = clean_text(str(en_passages[p_idx])) if p_idx < len(en_passages) else ""
            
            # Skip empty passage pairs
            if not p_indic and not p_en:
                continue

            is_sel = bool(selected_flags[p_idx]) if p_idx < len(selected_flags) else False
            p_url = str(urls[p_idx]).strip() if p_idx < len(urls) else ""

            passage_obj = {
                "passage_id": f"{record_id}_P{p_idx}",
                "passage_index": p_idx,
                "passage_text_indic": p_indic or p_en,
                "passage_text_en": p_en or p_indic,
                "is_selected": is_sel,
                "url": p_url,
            }
            passages_list.append(passage_obj)

    # If no valid passages extracted, reject record
    if not passages_list:
        return None

    return {
        "record_id": record_id,
        "query_id": query_id,
        "query_type": query_type,
        "source_lang": source_lang,
        "target_lang": target_lang,
        "query_text_indic": query_indic or query_en,
        "query_text_en": query_en or query_indic,
        "answer_text_indic": answer_indic or answer_en,
        "answer_text_en": answer_en or answer_indic,
        "num_passages": len(passages_list),
        "passages": passages_list,
    }


class DatasetStats:
    """Collector for dataset preprocessing statistics."""

    def __init__(self):
        self.total_raw_records = 0
        self.processed_records = 0
        self.removed_records = 0
        self.total_passages = 0
        self.selected_passages = 0
        self.query_lengths = []
        self.answer_lengths = []
        self.passage_lengths = []
        self.languages = {}

    def update(self, record: Optional[Dict[str, Any]]):
        self.total_raw_records += 1
        if not record:
            self.removed_records += 1
            return

        self.processed_records += 1
        lang = record.get("target_lang", "unknown")
        self.languages[lang] = self.languages.get(lang, 0) + 1

        self.query_lengths.append(len(record.get("query_text_indic", "")))
        if record.get("answer_text_indic"):
            self.answer_lengths.append(len(record["answer_text_indic"]))

        for p in record.get("passages", []):
            self.total_passages += 1
            if p.get("is_selected"):
                self.selected_passages += 1
            self.passage_lengths.append(len(p.get("passage_text_indic", "")))

    def summary(self) -> Dict[str, Any]:
        def calc_stat(arr: List[int]) -> Dict[str, Any]:
            if not arr:
                return {"min": 0, "max": 0, "avg": 0.0}
            return {
                "min": min(arr),
                "max": max(arr),
                "avg": round(sum(arr) / len(arr), 2),
            }

        return {
            "total_raw_records": self.total_raw_records,
            "processed_records": self.processed_records,
            "removed_records": self.removed_records,
            "total_passages": self.total_passages,
            "selected_passages": self.selected_passages,
            "languages_breakdown": self.languages,
            "query_char_lengths": calc_stat(self.query_lengths),
            "answer_char_lengths": calc_stat(self.answer_lengths),
            "passage_char_lengths": calc_stat(self.passage_lengths),
        }


def stream_parquet_file(file_path: Path, batch_size: int = 500) -> Generator[Dict[str, Any], None, None]:
    """Stream records batch-by-batch from local parquet file using PyArrow."""
    parquet_file = pq.ParquetFile(str(file_path))
    for batch in parquet_file.iter_batches(batch_size=batch_size):
        df_batch = batch.to_pandas()
        for row_dict in df_batch.to_dict(orient="records"):
            yield row_dict


def preprocess_dataset(
    input_paths: List[Path],
    output_path: Path,
    limit: Optional[int] = None,
    batch_size: int = 500,
) -> DatasetStats:
    """Preprocess raw dataset files and stream clean JSONL to output_path."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    stats = DatasetStats()
    samples_to_print = []

    print(f"Streaming and preprocessing data to: {output_path}")

    with open(output_path, "w", encoding="utf-8") as out_f:
        record_counter = 0

        for input_path in input_paths:
            print(f"Processing input file: {input_path}")
            for raw_row in stream_parquet_file(input_path, batch_size=batch_size):
                record_counter += 1
                cleaned_record = process_record(raw_row, record_counter)
                stats.update(cleaned_record)

                if cleaned_record:
                    out_f.write(json.dumps(cleaned_record, ensure_ascii=False) + "\n")
                    if len(samples_to_print) < 2:
                        samples_to_print.append(cleaned_record)

                if limit and stats.processed_records >= limit:
                    print(f"Reached processing limit of {limit} records.")
                    break

            if limit and stats.processed_records >= limit:
                break

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETED - SUMMARY STATISTICS")
    print("=" * 60)
    summary = stats.summary()
    print(json.dumps(summary, indent=2))

    if samples_to_print:
        print("\n" + "=" * 60)
        print("REPRESENTATIVE PROCESSED SAMPLE RECORD PREVIEW")
        print("=" * 60)
        print(json.dumps(samples_to_print[0], indent=2, ensure_ascii=True))

    return stats


def find_raw_files(raw_dir: Path, language: str, split: str) -> List[Path]:
    """Find raw parquet files in raw_dir matching language and split filter."""
    if not raw_dir.exists():
        print(f"Error: Raw directory '{raw_dir}' does not exist. Run download_dataset.py first.")
        sys.exit(1)

    matching_files = []
    for root, _, files in os.walk(raw_dir):
        for f in files:
            if not f.endswith(".parquet"):
                continue
            path = Path(root) / f
            path_str = str(path).lower()
            
            # Apply split filter
            if split != "all" and split not in path_str:
                continue
                
            # Apply language filter
            if language != "all":
                # Check for filename prefixes like hinval, hintrain
                if not any(f.lower().startswith(prefix) for prefix in [language, f"{language}val", f"{language}train"]):
                    continue

            matching_files.append(path)

    return sorted(matching_files)


def main():
    parser = argparse.ArgumentParser(
        description="Stream, clean, and preprocess AI4Bharat MSMARCO-XI dataset records."
    )
    parser.add_argument(
        "--raw-dir",
        type=str,
        default="data/raw",
        help="Input raw directory containing parquet files. Default: data/raw",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/processed/msmarco_processed.jsonl",
        help="Output clean JSONL filepath. Default: data/processed/msmarco_processed.jsonl",
    )
    parser.add_argument(
        "--language",
        type=str,
        default="hin",
        help="Language filter (hin, ben, guj, tam, etc., or 'all'). Default: hin",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="validation",
        choices=["train", "validation", "all"],
        help="Split filter (validation, train, or all). Default: validation",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum records to process (for manageable testing subsets). Default: None (all)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Batch size for streaming parquet rows. Default: 500",
    )

    args = parser.parse_args()
    raw_dir = Path(args.raw_dir)
    output_path = Path(args.output)

    raw_files = find_raw_files(raw_dir, args.language, args.split)
    if not raw_files:
        print(f"No raw dataset files found matching language='{args.language}', split='{args.split}' in '{raw_dir}'.")
        print("Please run download_dataset.py first.")
        sys.exit(1)

    print(f"Found {len(raw_files)} raw dataset file(s): {[f.name for f in raw_files]}")
    preprocess_dataset(
        input_paths=raw_files,
        output_path=output_path,
        limit=args.limit,
        batch_size=args.batch_size,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
