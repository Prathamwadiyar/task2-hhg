import hashlib
from typing import Any, Dict, List, Optional
from app.config import Settings, get_settings
from app.core.logging import logger
from app.database.qdrant import QdrantManager, get_qdrant_manager
from app.rag.embedder import MultilingualEmbedder, get_embedder
from app.schemas.responses import SourceChunk


class DenseRetriever:
    """Retriever for Qdrant vector similarity search with score thresholding and deduplication."""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        embedder: Optional[MultilingualEmbedder] = None,
        qdrant_manager: Optional[QdrantManager] = None,
        collection_name: str = "msmarco_chunks",
    ):
        self.settings = settings or get_settings()
        self.embedder = embedder or get_embedder(self.settings)
        self.qdrant = qdrant_manager or get_qdrant_manager(self.settings)
        self.collection_name = collection_name

    def retrieve_chunks(
        self,
        query: str,
        top_k: int = 5,
        filter_lang: Optional[str] = None,
        min_score_threshold: float = 0.3,
    ) -> List[SourceChunk]:
        """Retrieve top-K relevant passages from Qdrant vector index for a given query string."""
        if not query or not query.strip():
            return []

        logger.info(f"Retrieving top_{top_k} chunks for query: '{query[:60]}...'")

        # 1. Embed query vector with 'query: ' prefixing
        query_vector = self.embedder.embed_query(query)

        # 2. Query Qdrant vector database
        raw_results = self.qdrant.search_vectors(
            collection_name=self.collection_name,
            query_vector=query_vector,
            top_k=top_k * 2,  # Fetch extra candidate window for deduplication
            filter_lang=filter_lang,
        )

        # 3. Deduplicate and filter results
        sources: List[SourceChunk] = []
        seen_text_hashes = set()

        for res in raw_results:
            score = res.get("similarity_score", 0.0)
            if score < min_score_threshold:
                continue

            text = res.get("text", "").strip()
            if not text:
                continue

            # Deduplicate based on text hash
            text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
            if text_hash in seen_text_hashes:
                continue
            seen_text_hashes.add(text_hash)

            source_meta = res.get("source_metadata", {}) or {}
            chunk_id = res.get("chunk_id", "UNKNOWN_CHUNK")
            doc_id = res.get("document_id", res.get("passage_id", "UNKNOWN_DOC"))

            sources.append(
                SourceChunk(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    score=score,
                    text=text,
                    metadata={
                        "language": res.get("language", "unknown"),
                        "passage_id": res.get("passage_id"),
                        "query_id": source_meta.get("query_id"),
                        "query_type": source_meta.get("query_type"),
                        "is_selected": source_meta.get("is_selected", False),
                    },
                )
            )

            if len(sources) >= top_k:
                break

        logger.info(f"Retrieved {len(sources)} deduplicated chunks for query.")
        return sources


_retriever_instance: Optional[DenseRetriever] = None


def get_retriever(settings: Optional[Settings] = None) -> DenseRetriever:
    """Get singleton DenseRetriever instance."""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = DenseRetriever(settings)
    return _retriever_instance
