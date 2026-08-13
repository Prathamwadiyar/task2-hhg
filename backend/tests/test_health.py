import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns HTTP 200 with required JSON keys."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "voice-rag-backend"
    assert "version" in data
    assert "qdrant_connected" in data
    assert "environment" in data


def test_root_endpoint():
    """Verify GET / returns welcome JSON response."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "health_check" in data
    assert "documentation" in data
