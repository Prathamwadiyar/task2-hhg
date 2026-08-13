import json
import logging
import sys
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def generate_request_id() -> str:
    """Generate a unique formatted request ID: REQ-YYYYMMDD-HHMMSS-<uuid_short>."""
    now = datetime.now(timezone.utc)
    timestamp_str = now.strftime("%Y%m%d-%H%M%S")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"REQ-{timestamp_str}-{short_uuid}"


class StructuredJsonFormatter(logging.Formatter):
    """JSON formatter for structured logging with Request ID context and secret redaction."""

    SECRET_KEYS = {"api_key", "secret", "token", "password", "authorization", "llm_api_key", "sarvam_api_key", "qdrant_api_key"}

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include request_id if present
        request_id = getattr(record, "request_id", None)
        if request_id:
            log_obj["request_id"] = request_id

        # Include latency_ms if present
        latency = getattr(record, "latency_data", None)
        if latency:
            log_obj["latency_metrics"] = latency

        # Include extra payload data if passed
        extra_data = getattr(record, "extra_data", None)
        if isinstance(extra_data, dict):
            log_obj["data"] = self._redact_secrets(extra_data)

        # Include exception details if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)

    def _redact_secrets(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively redact sensitive key values."""
        clean_data = {}
        for k, v in data.items():
            if any(secret_kw in k.lower() for secret_kw in self.SECRET_KEYS):
                clean_data[k] = "[REDACTED]"
            elif isinstance(v, dict):
                clean_data[k] = self._redact_secrets(v)
            else:
                clean_data[k] = v
        return clean_data


def setup_logger(name: str = "voice_rag", level: str = "INFO") -> logging.Logger:
    """Configure and return a structured JSON logger."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Avoid duplicate handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)
        logger.propagate = False
        
    return logger


# Default logger instance
logger = setup_logger()
