"""
FastAPI smoke tests. These require no external services and exercise the
legacy monolith's built-in endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_returns_valid_payload(client):
    # Redis is optional; in local/dev without Redis the endpoint returns 503
    # degraded rather than 200. We just verify the payload shape.
    response = client.get("/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert data.get("status") in ("healthy", "degraded", "unhealthy")


def test_api_games_returns_list(client):
    # Without ODDS_API_KEY the endpoint may return an empty list; we only
    # assert it returns a valid games-shaped array.
    response = client.get("/api/games?sport=nba")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert "id" in first
        assert "homeTeam" in first
        assert "awayTeam" in first


def test_api_calibration_returns_shape(client):
    response = client.get("/api/calibration")
    assert response.status_code == 200
    data = response.json()
    assert "generated_at" in data
    assert "by_grade" in data
    assert "by_sport" in data
