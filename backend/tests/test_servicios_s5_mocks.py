"""P1-S5: dobles con pytest-mock sobre EmailService y NasService."""
import smtplib
import uuid

import pytest

pytestmark = pytest.mark.unit

UUID_FIJO = uuid.UUID("12345678-1234-5678-1234-567812345678")


# ---------- EmailService ----------

def test_send_email_envia_con_argumentos_exactos(mocker):
    from app.services.email.EmailService import (
        GMAIL_PASSWORD,
        GMAIL_USERNAME,
        send_email,
    )

    smtp_cls = mocker.patch("app.services.email.EmailService.smtplib.SMTP")
    servidor = smtp_cls.return_value

    resultado = send_email("ana@lubix.com", "Asunto S5", "<p>Hola</p>")

    assert resultado is True
    smtp_cls.assert_called_once_with("smtp.gmail.com", 587)
    servidor.starttls.assert_called_once_with()
    servidor.login.assert_called_once_with(GMAIL_USERNAME, GMAIL_PASSWORD)
    servidor.send_message.assert_called_once()

    mensaje = servidor.send_message.call_args.args[0]
    assert mensaje["From"] == GMAIL_USERNAME
    assert mensaje["To"] == "ana@lubix.com"
    assert mensaje["Subject"] == "Asunto S5"
    assert "<p>Hola</p>" in mensaje.get_payload()[0].get_payload()

    servidor.quit.assert_called_once_with()


def test_send_email_no_continua_si_no_hay_conexion(mocker):
    from app.services.email.EmailService import send_email

    smtp_cls = mocker.patch(
        "app.services.email.EmailService.smtplib.SMTP",
        side_effect=smtplib.SMTPException("sin red"),
    )

    assert send_email("ana@lubix.com", "Asunto", "<p>x</p>") is False
    smtp_cls.assert_called_once_with("smtp.gmail.com", 587)
    smtp_cls.return_value.starttls.assert_not_called()


def test_send_email_no_envia_si_login_falla(mocker):
    from app.services.email.EmailService import send_email

    smtp_cls = mocker.patch("app.services.email.EmailService.smtplib.SMTP")
    servidor = smtp_cls.return_value
    servidor.login.side_effect = smtplib.SMTPAuthenticationError(535, b"credenciales")

    assert send_email("ana@lubix.com", "Asunto", "<p>x</p>") is False
    servidor.send_message.assert_not_called()
    servidor.quit.assert_not_called()


# ---------- NasService ----------

def _archivo(mocker, nombre="factura.pdf", tipo="application/pdf", contenido=b"%PDF-1.4"):
    archivo = mocker.MagicMock()
    archivo.filename = nombre
    archivo.content_type = tipo
    archivo.file = contenido
    return archivo


def test_upload_stream_llama_put_object_con_argumentos_exactos(mocker):
    from app.services.NasService import NasService

    mocker.patch("app.services.NasService.uuid.uuid4", return_value=UUID_FIJO)
    cliente = mocker.MagicMock()

    resultado = NasService(cliente, "uploads").upload_stream(_archivo(mocker))

    assert resultado == {
        "success": True,
        "object_name": f"{UUID_FIJO}.pdf",
        "path": f"uploads/{UUID_FIJO}.pdf",
    }
    cliente.put_object.assert_called_once_with(
        "uploads",
        f"{UUID_FIJO}.pdf",
        b"%PDF-1.4",
        length=-1,
        part_size=10 * 1024 * 1024,
        content_type="application/pdf",
    )


def test_upload_file_respeta_la_ruta_destino(mocker):
    from app.services.NasService import NasService

    mocker.patch("app.services.NasService.uuid.uuid4", return_value=UUID_FIJO)
    cliente = mocker.MagicMock()

    resultado = NasService(cliente, "uploads").upload_file(
        _archivo(mocker, "logo.png", "image/png", b"png"), "products/"
    )

    assert resultado["path"] == f"uploads/products/{UUID_FIJO}.png"
    cliente.put_object.assert_called_once_with(
        "uploads",
        f"products/{UUID_FIJO}.png",
        b"png",
        length=-1,
        part_size=10 * 1024 * 1024,
        content_type="image/png",
    )


def test_upload_stream_sin_archivo_no_toca_el_nas(mocker):
    from app.services.NasService import NasService

    cliente = mocker.MagicMock()

    assert NasService(cliente, "uploads").upload_stream(None) is None
    cliente.put_object.assert_not_called()


def test_upload_stream_con_error_del_nas_no_reintenta(mocker):
    from app.services.NasService import NasService

    cliente = mocker.MagicMock()
    cliente.put_object.side_effect = RuntimeError("nas caído")

    resultado = NasService(cliente, "uploads").upload_stream(_archivo(mocker))

    assert resultado["success"] is False
    assert "nas caído" in resultado["message"]
    cliente.put_object.assert_called_once()


def test_get_presigned_url_pasa_bucket_y_expiracion(mocker):
    from app.services.NasService import NasService

    cliente = mocker.MagicMock()
    cliente.presigned_get_object.return_value = "https://minio.local/uploads/a.png"

    resultado = NasService(cliente, "uploads").get_presigned_url(
        "users/1/a.png", expires=7200
    )

    assert resultado == {
        "success": True,
        "url": "https://minio.local/uploads/a.png",
    }
    cliente.presigned_get_object.assert_called_once_with(
        "uploads", "users/1/a.png", expires=7200
    )
    cliente.remove_object.assert_not_called()


def test_delete_file_no_sube_ni_firma_urls(mocker):
    from app.services.NasService import NasService

    cliente = mocker.MagicMock()

    assert NasService(cliente, "uploads").delete_file("users/1/a.png") == {
        "success": True
    }
    cliente.remove_object.assert_called_once_with("uploads", "users/1/a.png")
    cliente.put_object.assert_not_called()
    cliente.presigned_get_object.assert_not_called()