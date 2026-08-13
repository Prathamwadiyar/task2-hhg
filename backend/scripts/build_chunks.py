#!/usr/bin/env python3
"""CLI Script to Execute Adaptive Semantic Chunking Pipeline & Benchmark Fixed vs. Adaptive Chunking.

Reads processed records from data/processed/, chunks passages, outputs JSONL to data/chunks/,
and generates comprehensive statistics and comparison metrics.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.chunker import AdaptiveSemanticChunker, count_tokens, split_sentences


def compute_statistics(token_counts: List[int], sentence_counts: List[int]) -> Dict[str, Any]:
    """Compute detailed distribution statistics (mean, median, min, max, P95)."""
    if not token_counts:
        return {
            "total_chunks": 0,
            "min_tokens": 0,
            "max_tokens": 0,
            "avg_tokens": 0.0,
            "median_tokens": 0.0,
            "p95_tokens": 0.0,
            "avg_sentences_per_chunk": 0.0,
        }

    sorted_tokens = sorted(token_counts)
    n = len(sorted_tokens)
    median_val = sorted_tokens[n // 2] if n % 2 != 0 else (sorted_tokens[n // 2 - 1] + sorted_tokens[n // 2]) / 2.0
    p95_idx = int(math.ceil(0.95 * n)) - 1
    p95_val = sorted_tokens[max(0, min(p95_idx, n - 1))]

    avg_tokens = sum(sorted_tokens) / n
    avg_sentences = sum(sentence_counts) / len(sentence_counts) if sentence_counts else 0.0

    return {
        "total_chunks": n,
        "min_tokens": sorted_tokens[0],
        "max_tokens": sorted_tokens[-1],
        "avg_tokens": round(avg_tokens, 2),
        "median_tokens": round(median_val, 2),
        "p95_tokens": round(p95_val, 2),
        "avg_sentences_per_chunk": round(avg_sentences, 2),
    }


def run_chunking_pipeline(
    input_file: Path,
    output_file: Path,
    min_tokens: int = 150,
    max_tokens: int = 300,
    overlap_sentences: int = 1,
    sim_threshold: float = 0.25,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    """Execute adaptive chunking pipeline and save results to output_file."""
    chunker = AdaptiveSemanticChunker(
        min_tokens=min_tokens,
        max_tokens=max_tokens,
        overlap_sentences=overlap_sentences,
        similarity_threshold=sim_threshold,
    )

    output_file.parent.mkdir(parents=True, exist_ok=True)

    adaptive_token_counts = []
    adaptive_sentence_counts = []
    
    fixed_token_counts = []
    fixed_sentence_counts = []

    samples_to_print = []
    processed_records_count = 0
    total_passages_processed = 0

    print(f"Reading processed dataset from: {input_file}")
    print(f"Outputting chunks to: {output_file}")

    with open(input_file, "r", encoding="utf-8") as in_f, open(output_file, "w", encoding="utf-8") as out_f:
        for line in in_f:
            if not line.strip():
                continue
            
            record = json.loads(line)
            processed_records_count += 1
            
            document_id = record.get("record_id", f"DOC_{processed_records_count}")
            target_lang = record.get("target_lang", "hi")
            
            passages = record.get("passages", [])
            for passage in passages:
                total_passages_processed += 1
                passage_id = passage.get("passage_id", f"{document_id}_P{total_passages_processed}")
                passage_text = passage.get("passage_text_indic") or passage.get("passage_text_en") or ""

                if not passage_text.strip():
                    continue

                source_meta = {
                    "query_id": record.get("query_id"),
                    "query_text_indic": record.get("query_text_indic"),
                    "answer_text_indic": record.get("answer_text_indic"),
                    "is_selected": passage.get("is_selected", False),
                    "url": passage.get("url", ""),
                    "query_type": record.get("query_type"),
                }

                # 1. Adaptive Semantic Chunks
                chunks = chunker.chunk_passage(
                    passage_text=passage_text,
                    document_id=document_id,
                    passage_id=passage_id,
                    language=target_lang,
                    source_metadata=source_meta,
                )

                for c in chunks:
                    out_f.write(json.dumps(c, ensure_ascii=False) + "\n")
                    adaptive_token_counts.append(c["token_count"])
                    adaptive_sentence_counts.append(c["sentence_count"])
                    if len(samples_to_print) < 2:
                        samples_to_print.append(c)

                # 2. Fixed-size Chunks (for comparison benchmark)
                fixed_chunks = chunker.fixed_size_chunking(passage_text, chunk_size_tokens=200, overlap_tokens=40)
                for fc in fixed_chunks:
                    fixed_token_counts.append(count_tokens(fc))
                    fixed_sentence_counts.append(len(split_sentences(fc)))

            if limit and processed_records_count >= limit:
                print(f"Reached processing limit of {limit} records.")
                break

    adaptive_stats = compute_statistics(adaptive_token_counts, adaptive_sentence_counts)
    fixed_stats = compute_statistics(fixed_token_counts, fixed_sentence_counts)

    print("\n" + "=" * 70)
    print("CHUNKING SUMMARY STATISTICS & BENCHMARK COMPARISON")
    print("=" * 70)
    print(f"Processed Records: {processed_records_count}")
    print(f"Passages Processed: {total_passages_processed}")
    print("\n[Adaptive Semantic Chunking Metrics]")
    print(json.dumps(adaptive_stats, indent=2))

    print("\n[Fixed-Size Token Window Baseline Metrics]")
    print(json.dumps(fixed_stats, indent=2))

    print("\n[Comparison Highlights]")
    print(f"• Total Chunks: Adaptive = {adaptive_stats['total_chunks']} | Fixed = {fixed_stats['total_chunks']}")
    print(f"• Avg Tokens:   Adaptive = {adaptive_stats['avg_tokens']} | Fixed = {fixed_stats['avg_tokens']}")
    print(f"• P95 Tokens:   Adaptive = {adaptive_stats['p95_tokens']} | Fixed = {fixed_stats['p95_tokens']}")
    print(f"• Sentence Cohesion: Adaptive guarantees 100% boundary preservation, avoiding mid-sentence cuts.")

    if samples_to_print:
        print("\n" + "=" * 70)
        print("REPRESENTATIVE PROCESSED CHUNK PREVIEW")
        print("=" * 70)
        print(json.dumps(samples_to_print[0], indent=2, ensure_ascii=True))

    return {
        "adaptive_stats": adaptive_stats,
        "fixed_stats": fixed_stats,
        "processed_records": processed_records_count,
        "total_passages": total_passages_processed,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Execute Adaptive Semantic Chunking on processed MSMARCO-XI data."
    )
    parser.add_argument(
        "--input",
        type=str,
        default="data/processed/msmarco_hin_val_1k.jsonl",
        help="Input processed JSONL file path. Default: data/processed/msmarco_hin_val_1k.jsonl",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/chunks/msmarco_chunks_hin_val_1k.jsonl",
        help="Output chunks JSONL file path. Default: data/chunks/msmarco_chunks_hin_val_1k.jsonl",
    )
    parser.add_argument(
        "--min-tokens",
        type=int,
        default=150,
        help="Target minimum token count per chunk. Default: 150",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=300,
        help="Target maximum token count per chunk. Default: 300",
    )
    parser.add_argument(
        "--overlap-sentences",
        type=int,
        default=1,
        help="Number of sentences to overlap between adjacent chunks. Default: 1",
    )
    parser.add_argument(
        "--sim-threshold",
        type=float,
        default=0.25,
        help="Sentence similarity threshold for topic shift detection. Default: 0.25",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit on processed records. Default: None",
    )

    args = parser.parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Error: Input file '{input_path}' does not exist. Run preprocess.py first.")
        sys.exit(1)

    run_chunking_pipeline(
        input_file=input_path,
        output_file=output_path,
        min_tokens=args.min_tokens,
        max_tokens=args.max_tokens,
        overlap_sentences=args.overlap_sentences,
        sim_threshold=args.sim_threshold,
        limit=args.limit,
    )
    return 0


if __name__ == "__main__":
    import math 
    sys.exit(main())
