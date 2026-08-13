from fastapi import APIRouter, Depends
from app.config import Settings
from app.database.qdrant import QdrantManager
from app.dependencies import get_current_settings, get_qdrant
from app.schemas.responses import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health(
    settings: Settings = Depends(get_current_settings),
    qdrant: QdrantManager = Depends(get_qdrant),
) -> HealthResponse:
    """Health check endpoint indicating backend service status and database connectivity."""
    qdrant_connected = await qdrant.check_health()
    return HealthResponse(
        status="ok",
        service="voice-rag-backend",
        version=settings.VERSION,
        qdrant_connected=qdrant_connected,
        environment=settings.ENVIRONMENT,
    )
