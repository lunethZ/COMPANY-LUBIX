"""Envío de correo por la API HTTPS de Resend.

En Render free el puerto SMTP 587 está bloqueado, por lo que producción usa
Resend cuando `RESEND_API_KEY` está definida; sin ella se conserva SMTP.
"""
import logging
from unittest.mock import MagicMock

import httpx
import pytest

from app.Config import config
from app.services.email import EmailService

pytestmark = pytest.mark.unit

TO_EMAIL = "destino@lubix.com"
SUBJECT = "Verifica tu cuenta"
HTML_BODY = "<p>Tu código es <b>123456</b></p>"


@pytest.fixture()
def resend_enabled(monkeypatch):
    monkeypatch.setattr(config, "RESEND_API_KEY", "re_test_key", raising=False)
    monkeypatch.setattr(
        config, "RESEND_FROM_EMAIL", "LUBIX <onboarding@resend.dev>", raising=False
    )


@pytest.fixture()
def smtp_forbidden(monkeypatch):
    smtp = MagicMock(side_effect=AssertionError("no debe abrir SMTP con Resend activo"))
    monkeypatch.setattr(EmailService.smtplib, "SMTP", smtp)
    return smtp


def test_resend_envia_por_https_sin_tocar_smtp(resend_enabled, smtp_forbidden, monkeypatch):
    response = MagicMock(status_code=200, text='{"id": "email_123"}')
    post = MagicMock(return_value=response)
    monkeypatch.setattr(EmailService.httpx, "post", post)

    assert EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY) is True

    post.assert_called_once_with(
        "https://api.resend.com/emails",
        headers={
            "Authorization": "Bearer re_test_key",
            "Content-Type": "application/json",
        },
        json={
            "from": "LUBIX <onboarding@resend.dev>",
            "to": [TO_EMAIL],
            "subject": SUBJECT,
            "html": HTML_BODY,
        },
        timeout=EmailService.RESEND_TIMEOUT_SECONDS,
    )
    smtp_forbidden.assert_not_called()


@pytest.mark.parametrize("status", [403, 500])
def test_resend_error_http_se_registra_sin_lanzar_excepcion(
    resend_enabled, smtp_forbidden, monkeypatch, caplog, status
):
    response = MagicMock(status_code=status, text='{"message": "dominio no verificado"}')
    monkeypatch.setattr(EmailService.httpx, "post", MagicMock(return_value=response))

    with caplog.at_level(logging.ERROR, logger="app.services.email.EmailService"):
        result = EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY)

    assert result is False
    assert str(status) in caplog.text
    smtp_forbidden.assert_not_called()


def test_resend_error_de_red_devuelve_false(resend_enabled, smtp_forbidden, monkeypatch):
    def _timeout(*args, **kwargs):
        raise httpx.ConnectTimeout("sin respuesta de api.resend.com")

    monkeypatch.setattr(EmailService.httpx, "post", _timeout)

    assert EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY) is False
    smtp_forbidden.assert_not_called()


def test_sin_api_key_usa_smtp_de_respaldo(monkeypatch):
    monkeypatch.setattr(config, "RESEND_API_KEY", "", raising=False)
    monkeypatch.setattr(config, "RESEND_FROM_EMAIL", "LUBIX <onboarding@resend.dev>", raising=False)
    post = MagicMock()
    monkeypatch.setattr(EmailService.httpx, "post", post)
    smtp_cls = MagicMock()
    monkeypatch.setattr(EmailService.smtplib, "SMTP", smtp_cls)

    assert EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY) is True

    post.assert_not_called()
    smtp_cls.assert_called_once_with(
        "smtp.gmail.com", 587, timeout=EmailService.SMTP_TIMEOUT_SECONDS
    )
