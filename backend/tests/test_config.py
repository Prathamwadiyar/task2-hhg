from app.config import Settings, get_settings


def test_settings_default_values():
    """Verify settings instantiation and default configuration parameters."""
    settings = get_settings()
    assert settings.PROJECT_NAME == "Voice-Enabled RAG Backend"
    assert settings.QDRANT_COLLECTION == "msmarco_chunks"
    assert settings.TOP_K == 5
    assert settings.RERANK_TOP_K == 20
    assert isinstance(settings.REQUEST_TIMEOUT, int)


def test_settings_custom_override():
    """Verify Settings supports field overrides."""
    settings = Settings(TOP_K=10, LOG_LEVEL="DEBUG")
    assert settings.TOP_K == 10
    assert settings.LOG_LEVEL == "DEBUG"
