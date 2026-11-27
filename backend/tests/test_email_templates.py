"""Pruebas de las plantillas HTML de correo con send_email simulado."""
from unittest.mock import MagicMock


def _simular_envio(monkeypatch, modulo):
    fake = MagicMock(return_value=True)
    monkeypatch.setattr(modulo, "send_email", fake)
    return fake


def test_email_verify_incluye_el_codigo(monkeypatch):
    from app.services.email.template import EmailVerify as modulo

    fake = _simular_envio(monkeypatch, modulo)

    assert modulo.EmailVerify("ana@lubix.test", "482913", "verificacion") is True

    to_email, subject, body = fake.call_args.args
    assert to_email == "ana@lubix.test"
    assert subject == "Verificación de correo"
    assert "482913" in body
    assert "10 minutos" in body


def test_email_forgot_password_incluye_el_codigo(monkeypatch):
    from app.services.email.template import EmailForgotPassword as modulo

    fake = _simular_envio(monkeypatch, modulo)

    assert modulo.EmailForgotPassword("ana@lubix.test", "991122", "recuperacion") is True

    to_email, subject, body = fake.call_args.args
    assert to_email == "ana@lubix.test"
    assert subject == "Recuperación de contraseña"
    assert "991122" in body


def test_email_register_company_incluye_datos_de_la_empresa(monkeypatch):
    from app.services.email.template import EmailRegisterCompany as modulo

    fake = _simular_envio(monkeypatch, modulo)

    resultado = modulo.EmailRegisterCompany("empresa@lubix.test", "Acme S.A.S.", "900123456")

    assert resultado is True
    to_email, subject, body = fake.call_args.args
    assert to_email == "empresa@lubix.test"
    assert subject == "Solicitud de registro de empresa recibida"
    assert "Acme S.A.S." in body
    assert "900123456" in body
