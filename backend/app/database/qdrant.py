import uuid
from typing import Any, Dict, List, Optional
from app.config import Settings, get_settings
from app.core.logging import logger

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models as qmodels
    from qdrant_client.http.exceptions import UnexpectedResponse
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False


def generate_point_uuid(chunk_id: str) -> str:
    """Generate a deterministic UUID string from chunk_id for idempotent upserting."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id))


class QdrantManager:
    """Database abstraction for Qdrant vector collection management, indexing, and search."""

    def __init__(self, settings: Optional[Settings] = None, in_memory: bool = False, local_path: Optional[str] = None):
        self.settings = settings or get_settings()
        self.client: Optional[Any] = None

        if QDRANT_AVAILABLE:
            if in_memory:
                logger.info("Initializing QdrantClient in memory (:memory:)")
                self.client = QdrantClient(location=":memory:")
            elif local_path:
                logger.info(f"Initializing QdrantClient with local path storage: {local_path}")
                self.client = QdrantClient(path=local_path)
            else:
                try:
                    # Attempt connecting to standalone Qdrant HTTP server
                    self.client = QdrantClient(
                        url=self.settings.QDRANT_URL,
                        api_key=self.settings.QDRANT_API_KEY or None,
                        timeout=5.0,
                    )
                    # Verify connectivity
                    self.client.get_collections()
                except Exception as e:
                    logger.warning(f"Standalone Qdrant server at {self.settings.QDRANT_URL} unreachable ({e}). Falling back to local disk storage.")
                    try:
                        from pathlib import Path
                        qpath = Path("./qdrant_data")
                        if not (qpath / "collection").exists() and Path("../qdrant_data/collection").exists():
                            qpath = Path("../qdrant_data")
                        logger.info(f"Connecting to Qdrant disk storage at: {qpath.resolve()}")
                        self.client = QdrantClient(path=str(qpath))
                    except Exception as e2:
                        logger.warning(f"Local disk Qdrant fallback failed ({e2}). Using in-memory mode.")
                        self.client = QdrantClient(location=":memory:")
        else:
            logger.warning("qdrant-client package unavailable.")

    def is_connected(self) -> bool:
        """Check if Qdrant service is initialized and reachable."""
        if not self.client:
            return False
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False

    async def check_health(self) -> bool:
        """Async health check helper."""
        return self.is_connected()

    def ensure_collection(self, collection_name: str, vector_size: int = 384, recreate: bool = False) -> bool:
        """Create or verify existence of Qdrant collection with specified vector dimension."""
        if not self.client:
            return False

        try:
            collections = [c.name for c in self.client.get_collections().collections]
            exists = collection_name in collections

            if exists and recreate:
                logger.info(f"Recreating existing Qdrant collection '{collection_name}'...")
                self.client.delete_collection(collection_name)
                exists = False

            if not exists:
                logger.info(f"Creating Qdrant collection '{collection_name}' (vector_size={vector_size}, distance=Cosine)...")
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=vector_size,
                        distance=qmodels.Distance.COSINE,
                    ),
                )
            return True
        except Exception as e:
            logger.error(f"Failed to ensure Qdrant collection '{collection_name}': {e}")
            return False

    def upsert_chunks(
        self,
        collection_name: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
        batch_size: int = 100,
    ) -> bool:
        """Upsert chunk payloads and vectors idempotently into Qdrant collection."""
        if not self.client or not chunks or not embeddings:
            return False

        if len(chunks) != len(embeddings):
            raise ValueError(f"Mismatch between chunks count ({len(chunks)}) and embeddings count ({len(embeddings)}).")

        self.ensure_collection(collection_name, vector_size=len(embeddings[0]))

        total_points = len(chunks)
        for i in range(0, total_points, batch_size):
            batch_chunks = chunks[i : i + batch_size]
            batch_embeddings = embeddings[i : i + batch_size]

            points = []
            for chunk, vector in zip(batch_chunks, batch_embeddings):
                point_id = generate_point_uuid(chunk["chunk_id"])
                payload = {
                    "chunk_id": chunk.get("chunk_id"),
                    "document_id": chunk.get("document_id"),
                    "passage_id": chunk.get("passage_id"),
                    "language": chunk.get("language"),
                    "chunk_position": chunk.get("chunk_position"),
                    "token_count": chunk.get("token_count"),
                    "sentence_count": chunk.get("sentence_count"),
                    "parent_id": chunk.get("parent_id"),
                    "text": chunk.get("text"),
                    "source_metadata": chunk.get("source_metadata", {}),
                }

                points.append(
                    qmodels.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload,
                    )
                )

            self.client.upsert(collection_name=collection_name, points=points)

        logger.info(f"Successfully upserted {total_points} vectors into Qdrant collection '{collection_name}'.")
        return True

    def search_vectors(
        self,
        collection_name: str,
        query_vector: List[float],
        top_k: int = 5,
        filter_lang: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search top-K vector matches in Qdrant collection."""
        if not self.client:
            return []

        query_filter = None
        if filter_lang:
            query_filter = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="language",
                        match=qmodels.MatchValue(value=filter_lang),
                    )
                ]
            )

        try:
            # qdrant-client >= 1.10 uses query_points
            if hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=collection_name,
                    query=query_vector,
                    limit=top_k,
                    query_filter=query_filter,
                )
                results = response.points if hasattr(response, "points") else response
            elif hasattr(self.client, "search"):
                results = self.client.search(
                    collection_name=collection_name,
                    query_vector=query_vector,
                    limit=top_k,
                    query_filter=query_filter,
                )
            else:
                results = []

            formatted_results = []
            for hit in results:
                payload = getattr(hit, "payload", {}) or {}
                score = getattr(hit, "score", 0.0)
                formatted_results.append(
                    {
                        "similarity_score": round(float(score), 4),
                        "chunk_id": payload.get("chunk_id"),
                        "document_id": payload.get("document_id"),
                        "passage_id": payload.get("passage_id"),
                        "language": payload.get("language"),
                        "text": payload.get("text"),
                        "source_metadata": payload.get("source_metadata", {}),
                    }
                )
            return formatted_results
        except Exception as e:
            logger.error(f"Failed to search Qdrant collection '{collection_name}': {e}")
            return []


_qdrant_manager_instance: Optional[QdrantManager] = None


def get_qdrant_manager(settings: Optional[Settings] = None) -> QdrantManager:
    """Get singleton QdrantManager instance."""
    global _qdrant_manager_instance
    if _qdrant_manager_instance is None:
        _qdrant_manager_instance = QdrantManager(settings)
    return _qdrant_manager_instance
