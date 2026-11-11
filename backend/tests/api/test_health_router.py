import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestHealthRouter:
    """Tests for /health endpoints."""

    def test_database_health_ok(self, api_client, api_db_engine):
        """GET /health/database -> 200 with OK status."""
        from app.utils.TestDatabase import db_test
        from app.database.Connection import engine as real_engine

        with patch("app.utils.TestDatabase.engine", api_db_engine):
            response = api_client.get("/health/database")
            assert response.status_code == 200
            data = response.json()
            assert "Base de datos" in data
            assert data["Base de datos"] == "OK"

    def test_database_health_error(self, api_client):
        """GET /health/database -> 200 with ERROR when connection fails."""
        from app.database.Connection import engine

        with patch.object(engine, "connect") as mock_connect:
            mock_connect.side_effect = Exception("Connection refused")
            response = api_client.get("/health/database")
            assert response.status_code == 200
            data = response.json()
            assert data["Base de datos"] == "ERROR"
            assert "detail" in data
            assert "Connection refused" in data["detail"]

    def test_internet_health_ok(self, api_client):
        """GET /health/internet -> 200 with success message (mocked)."""
        with patch("app.routers.HealthRouter.check_internet_connection", return_value=True):
            response = api_client.get("/health/internet")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "exitosa" in data["message"].lower()

    def test_internet_health_fail(self, api_client):
        """GET /health/internet -> 200 with failure message (mocked)."""
        with patch("app.routers.HealthRouter.check_internet_connection", return_value=False):
            response = api_client.get("/health/internet")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "no se pudo" in data["message"].lower()