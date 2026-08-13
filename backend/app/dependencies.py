from typing import Generator
from fastapi import Request
from app.config import Settings, get_settings
from app.core.timing import StageTimer
from app.database.qdrant import QdrantManager, get_qdrant_manager


def get_current_settings() -> Settings:
    """FastAPI dependency provider for application settings."""
    return get_settings()


def get_qdrant() -> QdrantManager:
    """FastAPI dependency provider for Qdrant database manager."""
    return get_qdrant_manager()


def get_request_timer(request: Request) -> StageTimer:
    """FastAPI dependency provider for retrieving active request's StageTimer."""
    timer = getattr(request.state, "timer", None)
    if not timer:
        timer = StageTimer()
    return timer
