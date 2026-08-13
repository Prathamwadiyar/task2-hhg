import pytest
from app.database.qdrant import QdrantManager, generate_point_uuid


def test_generate_point_uuid():
    """Verify deterministic UUID generation for idempotency."""
    uuid1 = generate_point_uuid("MSMARCO_C1")
    uuid2 = generate_point_uuid("MSMARCO_C1")
    uuid3 = generate_point_uuid("MSMARCO_C2")
    
    assert uuid1 == uuid2  # Deterministic
    assert uuid1 != uuid3


def test_qdrant_manager_memory_operations():
    """Test QdrantManager collection creation, upserting, and vector search in memory mode."""
    qdrant = QdrantManager(in_memory=True)
    assert qdrant.is_connected() is True

    collection_name = "test_msmarco_chunks"
    success = qdrant.ensure_collection(collection_name, vector_size=384, recreate=True)
    assert success is True

    mock_chunks = [
        {
            "chunk_id": "CHUNK_101",
            "document_id": "DOC_1",
            "passage_id": "P_1",
            "language": "hi",
            "chunk_position": 0,
            "token_count": 25,
            "sentence_count": 2,
            "parent_id": "P_1",
            "text": "कॉरपोरेशन एक कंपनी या लोगों का समूह है।",
            "source_metadata": {"is_selected": True},
        },
        {
            "chunk_id": "CHUNK_102",
            "document_id": "DOC_2",
            "passage_id": "P_2",
            "language": "en",
            "chunk_position": 0,
            "token_count": 30,
            "sentence_count": 2,
            "parent_id": "P_2",
            "text": "A corporation is an entity authorized by law.",
            "source_metadata": {"is_selected": False},
        },
    ]

    mock_vectors = [
        [0.1] * 384,
        [0.9] * 384,
    ]

    upsert_success = qdrant.upsert_chunks(collection_name, mock_chunks, mock_vectors)
    assert upsert_success is True

    # Search with query vector close to vector 2
    query_vector = [0.85] * 384
    results = qdrant.search_vectors(collection_name, query_vector, top_k=2)

    assert len(results) == 2
    assert results[0]["chunk_id"] == "CHUNK_102"
    assert results[0]["language"] == "en"
    assert "similarity_score" in results[0]
