import pytest
from app.analytics.latency import LatencyAggregator, calculate_percentile
from app.analytics.metrics import RetrievalEvaluator
from app.schemas.responses import LatencyMetrics


def test_calculate_percentile():
    """Verify percentile calculation logic."""
    values = [10.0, 20.0, 30.0, 40.0, 50.0]
    p50 = calculate_percentile(values, 50.0)
    p100 = calculate_percentile(values, 100.0)
    
    assert p50 == 30.0
    assert p100 == 50.0


def test_latency_aggregator_percentiles():
    """Verify LatencyAggregator stage summaries and Core RAG vs E2E Voice breakdown."""
    agg = LatencyAggregator()
    m1 = LatencyMetrics(stt_ms=10.0, embedding_ms=5.0, retrieval_ms=15.0, generation_ms=20.0, total_ms=50.0)
    m2 = LatencyMetrics(stt_ms=12.0, embedding_ms=6.0, retrieval_ms=18.0, generation_ms=22.0, total_ms=58.0)
    
    agg.record(m1)
    agg.record(m2)

    report = agg.get_full_report()
    assert report["count"] == 2
    assert "core_rag" in report
    assert "e2e_voice" in report
    assert report["core_rag"]["p50"] > 0.0
    assert report["e2e_voice"]["p50"] > report["core_rag"]["p50"]


def test_retrieval_evaluator_metrics():
    """Verify Recall@K, Precision@K, and MRR metrics computation."""
    eval_cases = [
        {
            "retrieved_ids": ["DOC_1", "DOC_2", "DOC_3"],
            "ground_truth_ids": {"DOC_1"},
        },
        {
            "retrieved_ids": ["DOC_4", "DOC_1", "DOC_5"],
            "ground_truth_ids": {"DOC_1"},
        },
    ]

    res = RetrievalEvaluator.evaluate_batch(eval_cases, k_values=[5, 10])
    assert res["count"] == 2
    assert res["recall@5"] == 1.0  # DOC_1 retrieved in top-5 for both
    assert res["mrr"] == round((1.0 + 0.5) / 2, 4)  # 1.0 + 0.5 = 1.5 / 2 = 0.75
