#!/usr/bin/env python3
"""Dataset Merger Script for Multi-Source RAG Indexing.

Combines chunks from multiple datasets (e.g. AI4Bharat MSMARCO-XI + openbmb Ultra-FineWeb-L3)
into a unified chunk collection JSONL file for Qdrant vector embedding and indexing.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List


def merge_chunk_files(
    input_files: List[Path],
    output_file: Path = Path("data/chunks/combined_chunks.jsonl"),
) -> int:
    """Merge multiple chunk JSONL files into a single unified JSONL file."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    total_written = 0

    with open(output_file, "w", encoding="utf-8") as out_f:
        for filepath in input_files:
            if not filepath.exists():
                print(f"Warning: File '{filepath}' does not exist. Skipping...")
                continue

            print(f"Merging chunks from: {filepath}...")
            count = 0
            with open(filepath, "r", encoding="utf-8") as in_f:
                for line in in_f:
                    if not line.strip():
                        continue
                    out_f.write(line.strip() + "\n")
                    count += 1
                    total_written += 1
            print(f"  Added {count} chunks from {filepath.name}.")

    print(f"\nTotal merged chunks written to '{output_file}': {total_written}")
    return total_written


def main():
    parser = argparse.ArgumentParser(description="Merge multiple dataset chunk JSONL files into a unified dataset.")
    parser.add_argument(
        "--inputs",
        nargs="+",
        default=[
            "data/chunks/msmarco_chunks_hin_val_1k.jsonl",
            "data/chunks/ultrafineweb_chunks.jsonl",
        ],
        help="Input chunk JSONL filepaths.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/chunks/combined_chunks.jsonl",
        help="Output combined JSONL filepath. Default: data/chunks/combined_chunks.jsonl",
    )

    args = parser.parse_args()
    input_paths = [Path(p) for p in args.inputs]
    merge_chunk_files(input_paths, Path(args.output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
