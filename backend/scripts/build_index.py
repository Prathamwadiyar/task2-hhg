#!/usr/bin/env python3
"""CLI Script to Execute Multilingual Embedding & Qdrant Indexing Pipeline & Perform Search Verification.

Reads adaptive chunks from data/chunks/, generates multilingual-e5-small embeddings in batches,
upserts into Qdrant collection 'msmarco_chunks', and runs Top-5 search verification test.
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings
from app.database.qdrant import get_qdrant_manager
from app.rag.embedder import get_embedder


def run_indexing_pipeline(
    chunks_file: Path,
    collection_name: str = "msmarco_chunks",
    batch_size: int = 32,
    recreate_collection: bool = False,
    run_search_test: bool = True,
) -> Dict[str, Any]:
    """Read chunks, embed with multilingual-e5-small, and upsert to Qdrant vector database."""
    settings = get_settings()
    embedder = get_embedder(settings)
    qdrant = get_qdrant_manager(settings)

    print(f"Embedding Model: {embedder.model_name}")
    print(f"Vector Dimension: {embedder.get_embedding_dimension()}")
    print(f"Target Qdrant Collection: {collection_name}")
    print(f"Input Chunks File: {chunks_file}")

    # Ensure collection exists
    qdrant.ensure_collection(
        collection_name=collection_name,
        vector_size=embedder.get_embedding_dimension(),
        recreate=recreate_collection,
    )

    chunks_batch: List[Dict[str, Any]] = []
    total_chunks_indexed = 0
    start_time = time.perf_counter()

    with open(chunks_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue

            chunk = json.loads(line)
            chunks_batch.append(chunk)

            if len(chunks_batch) >= batch_size:
                texts = [c["text"] for c in chunks_batch]
                embeddings = embedder.embed_passages(texts, batch_size=batch_size)
                qdrant.upsert_chunks(collection_name, chunks_batch, embeddings)

                total_chunks_indexed += len(chunks_batch)
                print(f"Indexed {total_chunks_indexed} chunks...")
                chunks_batch = []

        # Flush remaining batch
        if chunks_batch:
            texts = [c["text"] for c in chunks_batch]
            embeddings = embedder.embed_passages(texts, batch_size=len(chunks_batch))
            qdrant.upsert_chunks(collection_name, chunks_batch, embeddings)
            total_chunks_indexed += len(chunks_batch)
            chunks_batch = []

    elapsed_sec = round(time.perf_counter() - start_time, 2)
    print(f"\nSuccessfully indexed {total_chunks_indexed} chunks into '{collection_name}' in {elapsed_sec}s.")

    # Execute Search Verification Test if enabled
    if run_search_test:
        print("\n" + "=" * 70)
        print("MULTILINGUAL VECTOR SEARCH VERIFICATION TEST")
        print("=" * 70)

        test_queries = [
            ("English Query", "What is a corporation?"),
            ("Hindi Query", "कॉरपोरेशन क्या है?"),
        ]

        for label, q_text in test_queries:
            print(f"\n--- {label}: {json.dumps(q_text, ensure_ascii=True)} ---")
            q_vector = embedder.embed_query(q_text)
            results = qdrant.search_vectors(collection_name, q_vector, top_k=5)

            if not results:
                print("No matching results returned.")
                continue

            for idx, res in enumerate(results, 1):
                snippet = res.get("text", "")[:120].replace("\n", " ")
                clean_snippet = json.dumps(snippet, ensure_ascii=True)
                print(
                    f"[{idx}] Score: {res['similarity_score']} | Chunk ID: {res['chunk_id']} | Lang: {res['language']}\n"
                    f"    Preview: {clean_snippet}...\n"
                )

    return {
        "collection_name": collection_name,
        "total_chunks_indexed": total_chunks_indexed,
        "embedding_dimension": embedder.get_embedding_dimension(),
        "elapsed_seconds": elapsed_sec,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Index text chunks into Qdrant vector database using multilingual-e5-small embeddings."
    )
    parser.add_argument(
        "--chunks-file",
        type=str,
        default="data/chunks/msmarco_chunks_hin_val_1k.jsonl",
        help="Input chunks JSONL file path. Default: data/chunks/msmarco_chunks_hin_val_1k.jsonl",
    )
    parser.add_argument(
        "--collection",
        type=str,
        default="msmarco_chunks",
        help="Qdrant collection name. Default: msmarco_chunks",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size for embedding generation. Default: 32",
    )
    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Recreate Qdrant collection if it exists.",
    )
    parser.add_argument(
        "--no-search-test",
        action="store_true",
        help="Skip running the post-indexing search verification test.",
    )

    args = parser.parse_args()
    chunks_path = Path(args.chunks_file)

    if not chunks_path.exists():
        print(f"Error: Chunks file '{chunks_path}' does not exist. Run build_chunks.py first.")
        sys.exit(1)

    run_indexing_pipeline(
        chunks_file=chunks_path,
        collection_name=args.collection,
        batch_size=args.batch_size,
        recreate_collection=args.recreate,
        run_search_test=not args.no_search_test,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
