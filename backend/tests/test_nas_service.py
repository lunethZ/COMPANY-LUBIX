"""Tests for NasService - no network connections."""
from unittest.mock import MagicMock


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