import math
from typing import Any, Dict, List
from app.schemas.responses import LatencyMetrics


def calculate_percentile(values: List[float], percentile: float) -> float:
    """Calculate percentile value (0 to 100) from a list of floats using linear interpolation."""
    if not values:
        return 0.0
    sorted_v = sorted(values)
    n = len(sorted_v)
    if n == 1:
        return sorted_v[0]
    
    k = (n - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return round(sorted_v[int(k)], 2)
    d0 = sorted_v[int(f)] * (c - k)
    d1 = sorted_v[int(c)] * (k - f)
    return round(d0 + d1, 2)


class LatencyAggregator:
    """Utility for collecting and computing 9-stage latency metrics and percentiles (P50, P70, P100)."""

    def __init__(self):
        self._records: List[LatencyMetrics] = []

    def record(self, metrics: LatencyMetrics) -> None:
        """Record a LatencyMetrics instance."""
        self._records.append(metrics)

    def clear(self) -> None:
        """Clear recorded latency entries."""
        self._records.clear()

    def get_stage_summary(self, stage_name: str) -> Dict[str, float]:
        """Compute P50, P70, P100 (Max), Avg, Min, Max statistics for a named stage."""
        if not self._records:
            return {"count": 0, "p50": 0.0, "p70": 0.0, "p100": 0.0, "avg": 0.0, "min": 0.0, "max": 0.0}

        values = [getattr(r, stage_name, 0.0) for r in self._records]
        avg_val = sum(values) / len(values)

        return {
            "count": len(values),
            "p50": calculate_percentile(values, 50.0),
            "p70": calculate_percentile(values, 70.0),
            "p100": round(max(values), 2),
            "avg": round(avg_val, 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
        }

    def get_full_report(self) -> Dict[str, Any]:
        """Generate comprehensive latency report separating Core RAG and End-to-End Voice latency."""
        if not self._records:
            return {"count": 0, "stages": {}}

        stages = [
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

        stage_reports = {stage: self.get_stage_summary(stage) for stage in stages}

        # Calculate Core RAG Latency vs E2E Voice Latency
        core_rag_values = [
            r.embedding_ms + r.retrieval_ms + r.context_building_ms + r.generation_ms + r.guardrails_ms
            for r in self._records
        ]
        e2e_voice_values = [r.stt_ms + core for r, core in zip(self._records, core_rag_values)]

        core_rag_stats = {
            "p50": calculate_percentile(core_rag_values, 50.0),
            "p70": calculate_percentile(core_rag_values, 70.0),
            "p100": round(max(core_rag_values), 2) if core_rag_values else 0.0,
            "avg": round(sum(core_rag_values) / len(core_rag_values), 2) if core_rag_values else 0.0,
            "min": round(min(core_rag_values), 2) if core_rag_values else 0.0,
            "max": round(max(core_rag_values), 2) if core_rag_values else 0.0,
        }

        e2e_voice_stats = {
            "p50": calculate_percentile(e2e_voice_values, 50.0),
            "p70": calculate_percentile(e2e_voice_values, 70.0),
            "p100": round(max(e2e_voice_values), 2) if e2e_voice_values else 0.0,
            "avg": round(sum(e2e_voice_values) / len(e2e_voice_values), 2) if e2e_voice_values else 0.0,
            "min": round(min(e2e_voice_values), 2) if e2e_voice_values else 0.0,
            "max": round(max(e2e_voice_values), 2) if e2e_voice_values else 0.0,
        }

        return {
            "count": len(self._records),
            "stages": stage_reports,
            "core_rag": core_rag_stats,
            "e2e_voice": e2e_voice_stats,
        }
