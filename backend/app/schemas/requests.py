from typing import Optional
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Schema for text-based RAG query requests."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's query text in Indic or English",
        examples=["What are the eligibility criteria for PM Kisan scheme?"],
    )
    language: Optional[str] = Field(
        default="en",
        description="ISO language code of the query (e.g. en, hi, ta, te)",
    )
    top_k: Optional[int] = Field(
        default=5,
        ge=1,
        le=50,
        description="Number of context passages to retrieve",
    )
    enable_hybrid: Optional[bool] = Field(
        default=True,
        description="Whether to perform hybrid search (dense vector + BM25)",
    )


class VoiceQueryRequest(BaseModel):
    """Schema for voice-based RAG query requests (base64 audio or parameters)."""

    audio_base64: Optional[str] = Field(
        default=None,
        description="Base64 encoded audio string (alternative to multipart file upload)",
    )
    audio_format: Optional[str] = Field(
        default="wav",
        description="Format of input audio (wav, mp3, m4a, flac, ogg)",
    )
    language_code: Optional[str] = Field(
        default="hi-IN",
        description="Sarvam STT Indic language code (e.g. hi-IN, ta-IN, te-IN, en-IN)",
    )
    top_k: Optional[int] = Field(
        default=5,
        ge=1,
        le=50,
        description="Number of context passages to retrieve",
    )
