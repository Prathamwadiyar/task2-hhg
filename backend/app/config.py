import os
from functools import lru_cache
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized typed configuration system for Voice-Enabled RAG Application."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # API Metadata
    PROJECT_NAME: str = "Voice-Enabled RAG Backend"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"

    # Sarvam Speech-to-Text
    SARVAM_API_KEY: Optional[str] = Field(default="", description="API key for Sarvam STT service")

    # Qdrant Vector Database
    QDRANT_URL: str = Field(default="http://localhost:6333", description="Qdrant service URL")
    QDRANT_API_KEY: Optional[str] = Field(default="", description="Qdrant authentication key")
    QDRANT_COLLECTION: str = Field(default="msmarco_chunks", description="Qdrant vector collection name")

    # Embedding & LLM
    EMBEDDING_MODEL: str = Field(
        default="intfloat/multilingual-e5-small",
        description="Multilingual embedding model name",
    )
    LLM_API_KEY: Optional[str] = Field(default="", description="LLM provider API key")
    GEMINI_API_KEY: Optional[str] = Field(default="", description="Google Gemini API key")
    OPENAI_API_KEY: Optional[str] = Field(default="", description="OpenAI API key")
    LLM_MODEL: str = Field(default="gemini-1.5-flash", description="LLM generator model name")

    # CORS & Security
    FRONTEND_ORIGIN: str = Field(default="http://localhost:3000", description="Frontend allowed origin")

    # System & Telemetry Controls
    LOG_LEVEL: str = Field(default="INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR)")
    REQUEST_TIMEOUT: int = Field(default=30, description="Global request timeout in seconds")

    # Search & Retrieval Parameters
    TOP_K: int = Field(default=5, description="Final number of retrieved context chunks")
    RERANK_TOP_K: int = Field(default=20, description="Initial candidates for reranking")


@lru_cache()
def get_settings() -> Settings:
    """Retrieve cached settings instance."""
    return Settings()
