import time
from contextlib import contextmanager
from typing import Dict, Generator, Optional


class StageTimer:
    """High-resolution multi-stage latency timer for RAG pipeline telemetry."""

    SUPPORTED_STAGES = (
        "stt",
        "query_processing",
        "embedding",
        "retrieval",
        "reranking",
        "context_building",
        "generation",
        "guardrails",
    )

    def __init__(self):
        self._start_time_ns: int = time.perf_counter_ns()
        self._stage_timings_ms: Dict[str, float] = {stage: 0.0 for stage in self.SUPPORTED_STAGES}
        self._active_stage: Optional[str] = None
        self._stage_start_ns: Optional[int] = None

    def start_stage(self, stage_name: str) -> None:
        """Explicitly start timing a specific named pipeline stage."""
        if self._active_stage:
            self.stop_stage()
        self._active_stage = stage_name
        self._stage_start_ns = time.perf_counter_ns()

    def stop_stage(self) -> float:
        """Stop timing the active pipeline stage and record duration in milliseconds."""
        if not self._active_stage or self._stage_start_ns is None:
            return 0.0

        elapsed_ns = time.perf_counter_ns() - self._stage_start_ns
        elapsed_ms = round(elapsed_ns / 1_000_000, 2)
        
        # Accumulate time in stage
        current = self._stage_timings_ms.get(self._active_stage, 0.0)
        self._stage_timings_ms[self._active_stage] = round(current + elapsed_ms, 2)

        self._active_stage = None
        self._stage_start_ns = None
        return elapsed_ms

    @contextmanager
    def measure(self, stage_name: str) -> Generator[None, None, None]:
        """Context manager utility for timing a block of code within a stage."""
        self.start_stage(stage_name)
        try:
            yield
        finally:
            self.stop_stage()

    def record_stage(self, stage_name: str, duration_ms: float) -> None:
        """Directly set or accumulate a pre-computed stage duration."""
        current = self._stage_timings_ms.get(stage_name, 0.0)
        self._stage_timings_ms[stage_name] = round(current + duration_ms, 2)

    def get_total_ms(self) -> float:
        """Calculate total elapsed wall-clock time since timer initialization in milliseconds."""
        elapsed_ns = time.perf_counter_ns() - self._start_time_ns
        return round(elapsed_ns / 1_000_000, 2)

    def get_metrics_dict(self) -> Dict[str, float]:
        """Return complete serializable latency metrics dictionary including total_ms."""
        if self._active_stage:
            self.stop_stage()

        result = {f"{stage}_ms": duration for stage, duration in self._stage_timings_ms.items()}
        result["total_ms"] = self.get_total_ms()
        return result
