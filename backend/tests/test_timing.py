import time
from app.core.timing import StageTimer


def test_stage_timer_measurement():
    """Verify StageTimer context manager measures elapsed stage duration."""
    timer = StageTimer()
    with timer.measure("embedding"):
        time.sleep(0.01)  # Sleep ~10ms

    metrics = timer.get_metrics_dict()
    assert "embedding_ms" in metrics
    assert metrics["embedding_ms"] >= 8.0  # Precision allowance
    assert "total_ms" in metrics
    assert metrics["total_ms"] >= metrics["embedding_ms"]


def test_stage_timer_serialization_keys():
    """Verify StageTimer returns all expected stage keys."""
    timer = StageTimer()
    metrics = timer.get_metrics_dict()

    expected_keys = [
        "stt_ms",
        "query_processing_ms",
        "embedding_ms",
        "retrieval_ms",
        "reranking_ms",
        "context_building_ms",
        "generation_ms",
        "guardrails_ms",
        "total_ms",
    ]
    for key in expected_keys:
        assert key in metrics
