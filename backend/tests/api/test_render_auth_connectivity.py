"""Regresiones de conectividad frontend↔API en Render.

Cubre el incidente de producción: el frontend se quedaba cargando porque el
login (cuenta sin verificar) y la recuperación de contraseña enviaban el correo
de forma síncrona por SMTP sin timeout.
"""
from unittest.mock import MagicMock

import pytest
from fastapi import BackgroundTasks, FastAPI
from fastapi.testclient import TestClient

from app.Config import config
from app.middleware.CorsMiddleware import allowed_origins, setup_cors
from app.schemas.SchemaAuthUser import forgotPassword, userLogin
from app.services.authentication.AuthService import (
    forgot_password_service,
    login_user_service,
)

pytestmark = pytest.mark.api

FRONTEND_ORIGIN = "https://lubix-frontend.onrender.com"


def _client_with_cors() -> TestClient:
    app = FastAPI()
    setup_cors(app)

    @app.post("/auth/login-user")
    def login():
        return {"ok": True}

    return TestClient(app)


def test_preflight_permite_frontend_de_render(monkeypatch):
    monkeypatch.setattr(config, "URL_FRONTEND", FRONTEND_ORIGIN, raising=False)
    monkeypatch.setattr(config, "CORS_ORIGINS", "", raising=False)

    response = _client_with_cors().options(
        "/auth/login-user",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN
    assert response.headers["access-control-allow-credentials"] == "true"
    assert "POST" in response.headers["access-control-allow-methods"]


def test_cors_acepta_origenes_adicionales_separados_por_coma(monkeypatch):
    monkeypatch.setattr(config, "URL_FRONTEND", "https://otro-frontend.example", raising=False)
    monkeypatch.setattr(
        config,
        "CORS_ORIGINS",
        f"https://a.example, {FRONTEND_ORIGIN}",
        raising=False,
    )

    origins = allowed_origins()

    assert FRONTEND_ORIGIN in origins
    assert "https://a.example" in origins
    assert "https://otro-frontend.example" in origins


def test_forgot_password_encola_el_correo_sin_enviarlo_en_la_peticion(seed, monkeypatch):
    seed.user(email="recupera@lubix.com")
    sender = MagicMock(return_value=True)
    monkeypatch.setattr(
        "app.services.email.SaveAndGenerateCode.EmailForgotPassword", sender
    )

    tasks = BackgroundTasks()
    with seed.session() as database:
        result = forgot_password_service(
            forgotPassword(email="recupera@lubix.com"),
            database,
            background_tasks=tasks,
        )

    assert sender.call_count == 0
    assert len(tasks.tasks) == 1
    assert tasks.tasks[0].func is sender
    assert "código" in result["message"].lower()


def test_forgot_password_responde_200_aunque_falle_el_envio(client, seed, monkeypatch):
    seed.user(email="fallo@lubix.com")
    monkeypatch.setattr(
        "app.services.email.SaveAndGenerateCode.EmailForgotPassword",
        lambda *args, **kwargs: False,
    )

    response = client.post(
        "/auth/forgot-password-user", json={"email": "fallo@lubix.com"}
    )

    assert response.status_code == 200


def test_login_sin_verificar_encola_verificacion_sin_bloquear(seed, monkeypatch):
    seed.user(email="pendiente@lubix.com", verified=False)
    sender = MagicMock(return_value=True)
    monkeypatch.setattr("app.services.email.SaveAndGenerateCode.EmailVerify", sender)

    tasks = BackgroundTasks()
    with seed.session() as database:
        result = login_user_service(
            userLogin(email="pendiente@lubix.com", password="Secreta1!"),
            database,
            background_tasks=tasks,
        )

    assert "access_token" not in result
    assert "no ha sido verificado" in result["message"]
    assert sender.call_count == 0
    assert len(tasks.tasks) == 1


def test_send_email_limita_el_socket_smtp_con_timeout(monkeypatch):
    from app.services.email import EmailService as email_service

    smtp = MagicMock()
    monkeypatch.setattr(email_service.smtplib, "SMTP", smtp)

    assert email_service.send_email("destino@lubix.com", "Asunto", "<p>hola</p>") is True
    smtp.assert_called_once_with(
        "smtp.gmail.com", 587, timeout=email_service.SMTP_TIMEOUT_SECONDS
    )
