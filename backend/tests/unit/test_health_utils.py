import pytest
import requests
from sqlalchemy import create_engine

from app.middleware import CorsMiddleware
from app.utils import CheckNetwork
from app.utils import TestDatabase

pytestmark = pytest.mark.unit


def test_check_internet_connection_verdadero(monkeypatch):
    class Respuesta:
        status_code = 200

    monkeypatch.setattr(
        CheckNetwork.requests, "get", lambda *args, **kwargs: Respuesta()
    )

    assert CheckNetwork.check_internet_connection() is True


def test_check_internet_connection_falso(monkeypatch):
    def falla(*args, **kwargs):
        raise requests.RequestException("sin red")

    monkeypatch.setattr(CheckNetwork.requests, "get", falla)

    assert CheckNetwork.check_internet_connection() is False


def test_db_test_ok(monkeypatch):
    monkeypatch.setattr(TestDatabase, "engine", create_engine("sqlite://"))

    assert TestDatabase.db_test() == {"Base de datos": "OK"}


def test_db_test_reporta_error(monkeypatch):
    class MotorRoto:
        def connect(self):
            raise RuntimeError("sin conexion")

    monkeypatch.setattr(TestDatabase, "engine", MotorRoto())

    resultado = TestDatabase.db_test()

    assert resultado["Base de datos"] == "ERROR"
    assert "sin conexion" in resultado["detail"]


def test_allowed_origins_combina_url_frontend_y_cors_origins(monkeypatch):
    monkeypatch.setattr(
        CorsMiddleware.config, "URL_FRONTEND", "https://lubix.example.com/"
    )
    monkeypatch.setattr(
        CorsMiddleware.config,
        "CORS_ORIGINS",
        "https://admin.example.com, https://lubix.example.com",
    )

    origins = CorsMiddleware.allowed_origins()

    assert "https://lubix.example.com" in origins
    assert "https://admin.example.com" in origins
    assert origins.count("https://lubix.example.com") == 1
