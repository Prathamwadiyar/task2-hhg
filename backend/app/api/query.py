from fastapi import APIRouter, Request
from app.rag.pipeline import get_rag_pipeline
from app.schemas.requests import QueryRequest
from app.schemas.responses import RAGResponse

router = APIRouter(prefix="/api", tags=["RAG Query"])


@router.post("/query", response_model=RAGResponse)
async def handle_text_query(request: QueryRequest, http_request: Request) -> RAGResponse:
    """Execute text-based RAG query pipeline and return grounded answer with sources and telemetry."""
    request_id = getattr(http_request.state, "request_id", "REQ-UNKNOWN")
    pipeline = get_rag_pipeline()
    return pipeline.run_query(request=request, request_id=request_id)
