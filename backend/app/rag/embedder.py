from typing import List, Optional
from app.config import Settings, get_settings
from app.core.logging import logger

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class MultilingualEmbedder:
    """Multilingual Embedder wrapping intfloat/multilingual-e5-small with E5 prefixing rules."""

    DEFAULT_MODEL_NAME = "intfloat/multilingual-e5-small"
    PASSAGE_PREFIX = "passage: "
    QUERY_PREFIX = "query: "

    def __init__(self, settings: Optional[Settings] = None, model_name: Optional[str] = None):
        self.settings = settings or get_settings()
        self.model_name = model_name or getattr(self.settings, "EMBEDDING_MODEL", self.DEFAULT_MODEL_NAME)
        self.model: Optional[Any] = None

        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                logger.info(f"Loading SentenceTransformer model: {self.model_name}")
                self.model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.error(f"Failed to load embedding model '{self.model_name}': {e}")
                self.model = None
        else:
            logger.warning("sentence-transformers package unavailable. Embedder operating in mock mode.")

    def get_embedding_dimension(self) -> int:
        """Return embedding vector dimension (384 for multilingual-e5-small)."""
        if self.model:
            return self.model.get_sentence_embedding_dimension()
        return 384

    def embed_passages(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Embed passage texts for vector indexing with 'passage: ' prefixing."""
        if not texts:
            return []

        if not self.model:
            # Fallback mock embedding generator if package/model fails
            return [[0.0] * 384 for _ in texts]

        # Apply E5 passage prefix to each text
        prefixed_texts = [f"{self.PASSAGE_PREFIX}{text.strip()}" for text in texts]

        embeddings = self.model.encode(
            prefixed_texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )

        return embeddings.tolist()

    def embed_query(self, query_text: str) -> List[float]:
        """Embed a single user query for search retrieval with 'query: ' prefixing."""
        if not query_text or not query_text.strip():
            return [0.0] * self.get_embedding_dimension()

        if not self.model:
            return [0.0] * 384

        prefixed_query = f"{self.QUERY_PREFIX}{query_text.strip()}"

        embedding = self.model.encode(
            prefixed_query,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )

        return embedding.tolist()


_embedder_instance: Optional[MultilingualEmbedder] = None


def get_embedder(settings: Optional[Settings] = None) -> MultilingualEmbedder:
    """Singleton getter for MultilingualEmbedder."""
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = MultilingualEmbedder(settings)
    return _embedder_instance
