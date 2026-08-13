import pytest
from app.rag.embedder import MultilingualEmbedder


def test_embedder_dimension():
    """Verify embedder vector dimension is 384 for multilingual-e5-small."""
    embedder = MultilingualEmbedder()
    dim = embedder.get_embedding_dimension()
    assert dim == 384


def test_embed_passages():
    """Verify passage embedding generation with 'passage: ' prefixing."""
    embedder = MultilingualEmbedder()
    passages = [
        "कॉरपोरेशन एक कंपनी या लोगों का समूह है।",
        "A corporation is a company authorized to act as a single entity.",
    ]
    vectors = embedder.embed_passages(passages)
    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384
    assert isinstance(vectors[0][0], float)


def test_embed_query():
    """Verify query embedding generation with 'query: ' prefixing."""
    embedder = MultilingualEmbedder()
    query = "What is a corporation?"
    vector = embedder.embed_query(query)
    assert len(vector) == 384
    assert isinstance(vector[0], float)


def test_embed_empty_input():
    """Verify empty input handling."""
    embedder = MultilingualEmbedder()
    assert embedder.embed_passages([]) == []
    empty_vec = embedder.embed_query("")
    assert len(empty_vec) == 384
    assert sum(empty_vec) == 0.0
