from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.logging import logger


class AppException(Exception):
    """Base exception for all domain-specific application errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}


class InvalidInputError(AppException):
    """Raised when request payload or parameters fail domain validation."""

    def __init__(self, message: str = "Invalid input provided", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="INVALID_INPUT",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class InvalidAudioError(AppException):
    """Raised when audio payload is empty, corrupted, or unsupported."""

    def __init__(self, message: str = "Invalid audio payload provided", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="INVALID_AUDIO",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class STTFailureError(AppException):
    """Raised when Speech-to-Text conversion fails or times out."""

    def __init__(self, message: str = "Speech-to-text processing failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="STT_FAILURE",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
        )


class EmbeddingFailureError(AppException):
    """Raised when multilingual vector embedding generation fails."""

    def __init__(self, message: str = "Vector embedding generation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="EMBEDDING_FAILURE",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class VectorDBError(AppException):
    """Raised when Qdrant database queries or connections fail."""

    def __init__(self, message: str = "Vector database operational error", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VECTOR_DB_FAILURE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )


class RetrievalFailureError(AppException):
    """Raised when passage retrieval or hybrid reranking fails."""

    def __init__(self, message: str = "Passage retrieval processing failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="RETRIEVAL_FAILURE",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class GenerationFailureError(AppException):
    """Raised when LLM answer generation fails."""

    def __init__(self, message: str = "Answer generation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="GENERATION_FAILURE",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
        )


class RequestTimeoutError(AppException):
    """Raised when a pipeline stage exceeds maximum allowed execution time."""

    def __init__(self, message: str = "Request execution timed out", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="REQUEST_TIMEOUT",
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            details=details,
        )


class NotImplementedEndpointError(AppException):
    """Raised when accessing endpoint functionality scheduled for future development phases."""

    def __init__(self, message: str = "Endpoint functionality not implemented yet in Phase 1", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="NOT_IMPLEMENTED",
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            details=details,
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Global exception handler converting AppException instances to clean JSON responses."""
    request_id = getattr(request.state, "request_id", "REQ-UNKNOWN")
    
    logger.warning(
        f"Handled application exception: {exc.error_code} - {exc.message}",
        extra={"request_id": request_id, "extra_data": exc.details},
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "request_id": request_id,
                "details": exc.details,
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global catch-all exception handler preventing raw tracebacks from leaking."""
    request_id = getattr(request.state, "request_id", "REQ-UNKNOWN")
    
    logger.error(
        f"Unhandled server error: {str(exc)}",
        exc_info=exc,
        extra={"request_id": request_id},
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
                "request_id": request_id,
            }
        },
    )
