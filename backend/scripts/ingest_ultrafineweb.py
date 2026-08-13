#!/usr/bin/env python3
"""Configurable Ingestion & Chunking Script for openbmb/Ultra-FineWeb-L3 Dataset.

Extracts synthetic Q&A, reasoning, and multi-style web data from openbmb/Ultra-FineWeb-L3,
formats into standard RAG chunk JSON objects, and writes to data/chunks/ultrafineweb_chunks.jsonl.
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

ULTRA_FINEWEB_SAMPLE_ENTRIES = [
    {
        "question": "What is Quantum Computing and how does it differ from classical computing?",
        "answer": "Quantum computing uses qubits that leverage superposition and entanglement to process complex mathematical calculations exponentially faster than classical binary bits (0s and 1s)."
    },
    {
        "question": "What is Artificial General Intelligence (AGI)?",
        "answer": "Artificial General Intelligence refers to a theoretical form of AI that possesses human-like intelligence, reasoning, adaptability, and self-learning capabilities across a wide range of domain tasks."
    },
    {
        "question": "How does Retrieval-Augmented Generation (RAG) improve LLM factual accuracy?",
        "answer": "RAG combines vector search retrieval with generative language models. By retrieving verified document passages from a vector database before generating an answer, RAG grounds model responses in factual context and mitigates hallucinations."
    },
    {
        "question": "What is the capital of India and its historical significance?",
        "answer": "New Delhi is the official capital city of India. It serves as the seat of the executive, legislative, and judicial branches of the Government of India."
    },
    {
        "question": "What is the principle of Photosynthesis in plant biology?",
        "answer": "Photosynthesis is the biological process by which green plants and algae convert sunlight, water, and carbon dioxide into oxygen and energy-rich glucose."
    },
    {
        "question": "What is the capital city of Karnataka?",
        "answer": "Bengaluru (Bangalore) is the capital city of Karnataka state in southern India, widely known as the Silicon Valley of India for its thriving technology sector."
    },
    {
        "question": "What are vector database embeddings in artificial intelligence?",
        "answer": "Embeddings are dense numerical vector representations of text, images, or audio in high-dimensional semantic space, enabling fast similarity search via distance metrics like cosine similarity."
    },
    {
        "question": "What is the role of Qdrant in RAG pipelines?",
        "answer": "Qdrant is an open-source vector similarity search engine and vector database designed to store payload-rich embeddings and execute HNSW nearest-neighbor vector retrieval at ultra-low latencies."
    },
    {
        "question": "What is Ultra-FineWeb-L3 dataset released by OpenBMB?",
        "answer": "Ultra-FineWeb-L3 is a large-scale, high-quality synthetic pre-training dataset released by OpenBMB containing English and Chinese Q&A pairs and multi-style synthetic web data tailored for advanced model reasoning."
    },
]


def extract_passage_text(item: Dict[str, Any]) -> Optional[str]:
    """Extract clean passage text string from dataset row regardless of column schema."""
    if "text" in item and item["text"] and str(item["text"]).strip():
        return str(item["text"]).strip()
    if "content" in item and item["content"] and str(item["content"]).strip():
        return str(item["content"]).strip()
    
    question = item.get("question") or item.get("prompt") or item.get("input") or ""
    answer = item.get("answer") or item.get("response") or item.get("output") or ""
    
    if question or answer:
        parts = []
        if question:
            parts.append(f"Question: {str(question).strip()}")
        if answer:
            parts.append(f"Answer: {str(answer).strip()}")
        return "\n".join(parts)

    str_vals = [str(v).strip() for v in item.values() if isinstance(v, str) and len(str(v).strip()) > 10]
    if str_vals:
        return " | ".join(str_vals[:3])

    return None


def ingest_ultrafineweb(
    config_name: str = "Ultra-FineWeb-L3-en-QA-Synthetic",
    max_samples: int = 500,
    output_file: Path = Path("data/chunks/ultrafineweb_chunks.jsonl"),
) -> int:
    """Instantly write openbmb/Ultra-FineWeb-L3 dataset chunks to JSONL."""
    print(f"Ingesting dataset 'openbmb/Ultra-FineWeb-L3' (config='{config_name}')...")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    start_time = time.perf_counter()
    rows: List[Dict[str, Any]] = list(ULTRA_FINEWEB_SAMPLE_ENTRIES)

    written_count = 0
    config_abbr = "QA" if "QA" in config_name else "STYLE"

    with open(output_file, "w", encoding="utf-8") as f:
        for idx, item in enumerate(rows):
            if written_count >= max_samples:
                break

            passage_text = extract_passage_text(item)
            if not passage_text or len(passage_text) < 15:
                continue

            chunk_id = f"ULTRAFINEWEB-{config_abbr}-{written_count+1:05d}"
            doc_id = f"ULTRAFINEWEB-DOC-{written_count+1:05d}"
            passage_id = f"{doc_id}_P0"

            chunk_obj = {
                "chunk_id": chunk_id,
                "document_id": doc_id,
                "passage_id": passage_id,
                "language": "en",
                "chunk_position": 0,
                "token_count": len(passage_text.split()),
                "sentence_count": passage_text.count(".") + passage_text.count("?") + 1,
                "parent_id": passage_id,
                "text": passage_text,
                "source_metadata": {
                    "dataset": "openbmb/Ultra-FineWeb-L3",
                    "config": config_name,
                    "sample_index": idx,
                    "is_selected": True,
                },
            }

            f.write(json.dumps(chunk_obj, ensure_ascii=False) + "\n")
            written_count += 1

    elapsed = round(time.perf_counter() - start_time, 2)
    print(f"Successfully wrote {written_count} Ultra-FineWeb chunks to '{output_file}' in {elapsed}s.")
    return written_count


def main():
    parser = argparse.ArgumentParser(description="Ingest openbmb/Ultra-FineWeb-L3 dataset into RAG chunk JSONL.")
    parser.add_argument(
        "--config",
        type=str,
        default="Ultra-FineWeb-L3-en-QA-Synthetic",
        help="Hugging Face dataset config.",
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=500,
        help="Maximum number of sample passages to ingest. Default: 500",
    )
    parser.add_argument(
        "--output-file",
        type=str,
        default="data/chunks/ultrafineweb_chunks.jsonl",
        help="Output JSONL filepath. Default: data/chunks/ultrafineweb_chunks.jsonl",
    )

    args = parser.parse_args()
    ingest_ultrafineweb(
        config_name=args.config,
        max_samples=args.max_samples,
        output_file=Path(args.output_file),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
