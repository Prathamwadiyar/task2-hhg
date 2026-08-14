import base64
from typing import Optional
from fastapi import APIRouter, File, Form, Request, UploadFile
from app.core.exceptions import InvalidAudioError
from app.rag.pipeline import get_rag_pipeline
from app.schemas.responses import RAGResponse

router = APIRouter(prefix="/api/voice", tags=["Voice Query"])


@router.post("/query", response_model=RAGResponse)
async def handle_voice_query(
    http_request: Request,
    file: Optional[UploadFile] = File(None),
    audio_base64: Optional[str] = Form(None),
    language_code: str = Form("en-IN"),
    top_k: int = Form(5),
) -> RAGResponse:
    """Execute voice-based RAG query pipeline via Sarvam STT and return transcript, grounded answer, sources, and telemetry."""
    request_id = getattr(http_request.state, "request_id", "REQ-VOICE-UNKNOWN")
    pipeline = get_rag_pipeline()

    audio_bytes: Optional[bytes] = None

    if file:
        audio_bytes = await file.read()
    elif audio_base64:
        try:
            # Handle data URL prefix if present (e.g. data:audio/wav;base64,...)
            if "," in audio_base64:
                audio_base64 = audio_base64.split(",")[1]
            audio_bytes = base64.b64decode(audio_base64)
        except Exception:
            raise InvalidAudioError(message="Invalid base64 audio encoding.")

    if not audio_bytes or len(audio_bytes) == 0:
        raise InvalidAudioError(message="No audio file or base64 audio payload provided.")

    filename = file.filename if file and file.filename else "input_audio.webm"

    return await pipeline.run_voice_query(
        audio_bytes=audio_bytes,
        language_code=language_code,
        top_k=top_k,
        filename=filename,
        request_id=request_id,
    )
