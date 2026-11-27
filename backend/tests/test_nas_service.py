"""Tests for NasService - no network connections."""
from unittest.mock import MagicMock

import pytest


def test_upload_stream_happy_path():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.bucket_exists = MagicMock(return_value=False)
    mock_client.make_bucket = MagicMock()
    mock_client.put_object = MagicMock(return_value=None)

    mock_file = MagicMock()
    mock_file.filename = "test.txt"
    mock_file.content_type = "text/plain"
    mock_file.file = b"test content"

    ns = NasService(mock_client, "uploads")

    result = ns.upload_stream(mock_file)

    assert result["success"] is True
    mock_client.put_object.assert_called_once()


def test_upload_stream_no_file():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    ns = NasService(mock_client, "uploads")

    result = ns.upload_stream(None)

    assert result is None


def test_upload_file_happy_path():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.bucket_exists = MagicMock(return_value=False)
    mock_client.make_bucket = MagicMock()
    mock_client.put_object = MagicMock(return_value=None)

    mock_file = MagicMock()
    mock_file.filename = "report.pdf"
    mock_file.content_type = "application/pdf"
    mock_file.file = b"pdf content"

    ns = NasService(mock_client, "uploads")

    result = ns.upload_file(mock_file, PATH="users/123/")

    assert result["success"] is True


def test_download_stream_happy_path():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.read.return_value = b"downloaded data"
    mock_client.get_object = MagicMock(return_value=mock_response)

    ns = NasService(mock_client, "uploads")

    result = ns.download_stream("some/key.txt")

    assert result is not None


def test_get_presigned_url_happy_path():
    from app.services.NasService import NasService

    mock_client = MagicMock()

    ns = NasService(mock_client, "uploads")

    result = ns.get_presigned_url("test.key", expires=7200)

    assert result["success"] is True


def test_delete_file_happy_path():
    from app.services.NasService import NasService

    mock_client = MagicMock()

    ns = NasService(mock_client, "uploads")

    result = ns.delete_file("some/key.txt")

    assert result["success"] is True


# Tests using module-level subir instance
def test_subir_upload_stream_happy_path():
    from app.services.NasService import subir

    original_client = subir.client
    mock_client = MagicMock()
    mock_client.bucket_exists = MagicMock(return_value=False)
    mock_client.make_bucket = MagicMock()
    mock_client.put_object = MagicMock(return_value=None)

    subir.client = mock_client

    mock_file = MagicMock()
    mock_file.filename = "test.txt"
    mock_file.content_type = "text/plain"
    mock_file.file = b"test content"

    result = subir.upload_stream(mock_file)

    assert result["success"] is True
    mock_client.put_object.assert_called_once()

    # Restore
    subir.client = original_client


def test_subir_download_stream_happy_path():
    from app.services.NasService import subir

    original_client = subir.client
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.read.return_value = b"downloaded data"
    mock_client.get_object = MagicMock(return_value=mock_response)
    mock_client.presigned_get_object = MagicMock()
    mock_client.remove_object = MagicMock(return_value=None)

    subir.client = mock_client

    result = subir.download_stream("some/key.txt")

    assert result is not None

    # Restore
    subir.client = original_client


def test_subir_get_presigned_url_happy_path():
    from app.services.NasService import subir

    original_client = subir.client
    mock_client = MagicMock()
    expected_url = "https://minio.example.com/presigned/test.key"
    mock_client.presigned_get_object = MagicMock(return_value=expected_url)
    mock_client.bucket_exists = MagicMock(return_value=False)
    mock_client.make_bucket = MagicMock()
    mock_client.remove_object = MagicMock(return_value=None)

    subir.client = mock_client

    result = subir.get_presigned_url("test.key", expires=7200)

    assert result["success"] is True
    assert result["url"] == expected_url

    # Restore
    subir.client = original_client


def test_subir_delete_file_happy_path():
    from app.services.NasService import subir

    original_client = subir.client
    mock_client = MagicMock()
    mock_client.remove_object = MagicMock(return_value=None)
    mock_client.bucket_exists = MagicMock(return_value=False)
    mock_client.make_bucket = MagicMock()

    subir.client = mock_client

    result = subir.delete_file("some/key.txt")

    assert result["success"] is True

    # Restore
    subir.client = original_client


def test_ensure_bucket_falla_registra_warning(monkeypatch, caplog):
    import logging

    from app.services import NasService as nas

    monkeypatch.setattr(nas.config, "MINIO_AUTO_CREATE_BUCKET", True)
    fake_client = MagicMock()
    fake_client.bucket_exists = MagicMock(side_effect=RuntimeError("sin conexión"))
    monkeypatch.setattr(nas, "client", fake_client)

    with caplog.at_level(logging.WARNING):
        nas._ensure_bucket()

    assert "No se pudo verificar el bucket" in caplog.text


def _s3_error():
    from minio.error import S3Error

    return S3Error(
        MagicMock(),
        "NoSuchKey",
        "el objeto no existe",
        "recurso",
        "req",
        "host",
    )


def test_ensure_bucket_no_hace_nada_si_la_creacion_automatica_esta_apagada(monkeypatch):
    from app.services import NasService as nas

    monkeypatch.setattr(nas.config, "MINIO_AUTO_CREATE_BUCKET", False)
    fake_client = MagicMock()
    monkeypatch.setattr(nas, "client", fake_client)

    nas._ensure_bucket()

    fake_client.bucket_exists.assert_not_called()
    fake_client.make_bucket.assert_not_called()


def test_ensure_bucket_crea_el_bucket_cuando_no_existe(monkeypatch):
    from app.services import NasService as nas

    monkeypatch.setattr(nas.config, "MINIO_AUTO_CREATE_BUCKET", True)
    fake_client = MagicMock()
    fake_client.bucket_exists = MagicMock(return_value=False)
    monkeypatch.setattr(nas, "client", fake_client)

    nas._ensure_bucket()

    fake_client.make_bucket.assert_called_once_with(nas.bucket)


def _archivo(nombre="test.txt", tipo="text/plain"):
    mock_file = MagicMock()
    mock_file.filename = nombre
    mock_file.content_type = tipo
    mock_file.file = b"contenido"
    return mock_file


def test_upload_stream_s3_error_devuelve_falso():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.put_object = MagicMock(side_effect=_s3_error())
    ns = NasService(mock_client, "uploads")

    result = ns.upload_stream(_archivo())

    assert result["success"] is False
    assert "NoSuchKey" in result["message"]


def test_upload_file_sin_archivo_devuelve_none():
    from app.services.NasService import NasService

    ns = NasService(MagicMock(), "uploads")

    assert ns.upload_file(None, PATH="users/") is None


def test_upload_file_s3_error_devuelve_falso():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.put_object = MagicMock(side_effect=_s3_error())
    ns = NasService(mock_client, "uploads")

    result = ns.upload_file(_archivo("report.pdf", "application/pdf"), PATH="users/1/")

    assert result["success"] is False
    assert "NoSuchKey" in result["message"]


def test_upload_file_error_inesperado_devuelve_falso():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.put_object = MagicMock(side_effect=ConnectionError("red caída"))
    ns = NasService(mock_client, "uploads")

    result = ns.upload_file(_archivo(), PATH="users/")

    assert result["success"] is False
    assert "red caída" in result["message"]


def test_download_stream_s3_error_se_propaga():
    from minio.error import S3Error

    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.get_object = MagicMock(side_effect=_s3_error())
    ns = NasService(mock_client, "uploads")

    with pytest.raises(S3Error):
        ns.download_stream("no/existe.txt")


def test_download_stream_ignora_errores_al_cerrar_la_respuesta():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.read.return_value = b"datos"
    mock_response.close.side_effect = RuntimeError("conexión ya cerrada")
    mock_client.get_object = MagicMock(return_value=mock_response)
    ns = NasService(mock_client, "uploads")

    result = ns.download_stream("carpeta/archivo.txt")

    assert result is not None
    mock_response.close.assert_called_once()


def test_get_presigned_url_s3_error_devuelve_falso():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.presigned_get_object = MagicMock(side_effect=_s3_error())
    ns = NasService(mock_client, "uploads")

    result = ns.get_presigned_url("archivo.txt")

    assert result["success"] is False
    assert "NoSuchKey" in result["message"]


def test_delete_file_s3_error_devuelve_falso():
    from app.services.NasService import NasService

    mock_client = MagicMock()
    mock_client.remove_object = MagicMock(side_effect=_s3_error())
    ns = NasService(mock_client, "uploads")

    result = ns.delete_file("archivo.txt")

    assert result["success"] is False
    assert "NoSuchKey" in result["message"]
