#!/usr/bin/env python3
"""Configurable Downloader for AI4Bharat MSMARCO-XI Dataset.

Downloads targeted language subsets and splits from Hugging Face:
AI4Bharat/MSMARCO-XI
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List, Tuple

try:
    from huggingface_hub import hf_hub_download
except ImportError:
    print("Error: huggingface-hub is not installed. Please run: pip install huggingface-hub")
    sys.exit(1)


# Language code mapping to HF filename prefixes
LANG_MAP = {
    "asm": ("asmtrain.parquet", "asmval.parquet", "Assamese"),
    "ben": ("bentrain.parquet", "benval.parquet", "Bengali"),
    "guj": ("gujtrain.parquet", "gujval.parquet", "Gujarati"),
    "hin": ("hintrain.parquet", "hinval.parquet", "Hindi"),
    "kan": ("kantrain.parquet", "kanval.parquet", "Kannada"),
    "mal": ("maltrain.parquet", "malval.parquet", "Malayalam"),
    "mar": ("martrain.parquet", "marval.parquet", "Marathi"),
    "nep": ("neptrain.parquet", "nepval.parquet", "Nepali"),
    "ori": ("oritrain.parquet", "orival.parquet", "Odia"),
    "pan": ("pantrain.parquet", "panval.parquet", "Punjabi"),
    "san": ("santrain.parquet", "sanval.parquet", "Sanskrit"),
    "tam": ("tamtrain.parquet", "tamval.parquet", "Tamil"),
    "tel": ("kantrain.parquet", "telval.parquet", "Telugu"),  # telval exists in val split
    "urd": ("urdtrain.parquet", "urdval.parquet", "Urdu"),
}

REPO_ID = "AI4Bharat/MSMARCO-XI"


def download_file(filename: str, split: str, output_dir: Path) -> Path:
    """Download a single parquet file from Hugging Face dataset repo."""
    hf_path = f"{split}/{filename}"
    split_dir = output_dir / split
    split_dir.mkdir(parents=True, exist_ok=True)

    print(f"Downloading {hf_path} from {REPO_ID}...")
    try:
        downloaded_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=hf_path,
            repo_type="dataset",
            local_dir=str(output_dir),
        )
        print(f"Successfully saved to: {downloaded_path}")
        return Path(downloaded_path)
    except Exception as e:
        print(f"Failed to download {hf_path}: {e}")
        raise e


def get_target_files(lang_arg: str, split_arg: str) -> List[Tuple[str, str, str]]:
    """Determine list of (filename, split, lang_code) tuples to download."""
    langs = list(LANG_MAP.keys()) if lang_arg.lower() == "all" else [lang_arg.lower()]
    splits = ["train", "validation"] if split_arg.lower() == "all" else [split_arg.lower()]

    targets = []
    for lang in langs:
        if lang not in LANG_MAP:
            print(f"Warning: Unknown language code '{lang}'. Supported: {list(LANG_MAP.keys())}")
            continue

        train_file, val_file, _ = LANG_MAP[lang]
        if "train" in splits:
            targets.append((train_file, "train", lang))
        if "validation" in splits:
            targets.append((val_file, "validation", lang))

    return targets


def main():
    parser = argparse.ArgumentParser(
        description="Download AI4Bharat/MSMARCO-XI dataset subsets from Hugging Face."
    )
    parser.add_argument(
        "--language",
        type=str,
        default="hin",
        help=f"Language code ({', '.join(LANG_MAP.keys())}, or 'all'). Default: hin",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="validation",
        choices=["train", "validation", "all"],
        help="Dataset split to download (train, validation, or all). Default: validation",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/raw",
        help="Directory to store raw downloaded parquet files. Default: data/raw",
    )

    args = parser.parse_args()
    output_dir = Path(args.output_dir)

    targets = get_target_files(args.language, args.split)
    if not targets:
        print("No valid target files identified for download.")
        sys.exit(1)

    print(f"Starting download for {len(targets)} dataset file(s)...")
    downloaded_files = []

    for filename, split, lang in targets:
        try:
            local_path = download_file(filename, split, output_dir)
            downloaded_files.append(local_path)
        except Exception as e:
            print(f"Skipping {filename} due to download error: {e}")

    print(f"\nDownload summary: {len(downloaded_files)} / {len(targets)} files ready in '{output_dir}'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
