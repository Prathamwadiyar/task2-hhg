import pytest
from pydantic import ValidationError
from app.schemas.requests import QueryRequest, VoiceQueryRequest
from app.schemas.responses import LatencyMetrics, SourceChunk


def test_query_request_validation():
    """Verify QueryRequest payload validation."""
    req = QueryRequest(query="What is PM Kisan?")
    assert req.query == "What is PM Kisan?"
    assert req.top_k == 5
    assert req.enable_hybrid is True

    # Empty query should fail
    with pytest.raises(ValidationError):
        QueryRequest(query="")


def test_latency_metrics_defaults():
    """Verify LatencyMetrics initializes with zero values."""
    metrics = LatencyMetrics()
    assert metrics.stt_ms == 0.0
    assert metrics.retrieval_ms == 0.0
    assert metrics.total_ms == 0.0


def test_source_chunk_schema():
    """Verify SourceChunk schema instantiation."""
    chunk = SourceChunk(
        chunk_id="chunk_101",
        doc_id="doc_42",
        score=0.92,
        text="Sample passage text.",
        metadata={"lang": "en"},
    )
    assert chunk.chunk_id == "chunk_101"
    assert chunk.score == 0.92
