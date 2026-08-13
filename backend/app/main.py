import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, query, voice
from app.config import get_settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    unhandled_exception_handler,
)
from app.core.logging import generate_request_id, logger
from app.core.timing import StageTimer

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Voice-Enabled Multilingual RAG Backend API (HH Goa 2026 Task 2)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
origins = [settings.FRONTEND_ORIGIN]
if "http://localhost:3000" not in origins:
    origins.append("http://localhost:3000")
if "http://127.0.0.1:3000" not in origins:
    origins.append("http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """Middleware for assigning Request IDs, initializing StageTimer, and logging request flow."""
    request_id = request.headers.get("X-Request-ID") or generate_request_id()
    request.state.request_id = request_id
    
    timer = StageTimer()
    request.state.timer = timer

    start_time = time.perf_counter()
    logger.info(
        f"Incoming {request.method} request to {request.url.path}",
        extra={"request_id": request_id},
    )

    try:
        response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-MS"] = str(elapsed_ms)
        
        logger.info(
            f"Completed {request.method} {request.url.path} with status {response.status_code} in {elapsed_ms}ms",
            extra={"request_id": request_id, "latency_data": timer.get_metrics_dict()},
        )
        return response
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            f"Failed {request.method} {request.url.path} after {elapsed_ms}ms: {exc}",
            extra={"request_id": request_id},
        )
        raise exc


# Register Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Include Routers
app.include_router(health.router)
app.include_router(query.router)
app.include_router(voice.router)


@app.get("/")
async def root():
    """Root redirect / welcome endpoint."""
    return {
        "message": "Welcome to Voice-Enabled RAG Backend API",
        "health_check": "/health",
        "documentation": "/docs",
    }
