"""Cobertura de los diagnósticos y errores del servicio de almacenamiento."""

import io
from types import SimpleNamespace

from minio.error import S3Error

from app.Config import config
from app.services import NasService as nas


class FakeStorageClient:
    def __init__(self, exists=True, error=None):
        self.exists = exists
        self.error = error
        self.put_calls = []
        self.removed = []
        self.created = []

    def put_object(self, *args, **kwargs):
        if self.error:
            raise self.error
        self.put_calls.append((args, kwargs))

    def bucket_exists(self, bucket):
        if self.error:
            raise self.error
        return self.exists

    def presigned_get_object(self, *args, **kwargs):
        if self.error:
            raise self.error
        return "https://signed.example/object"

    def remove_object(self, *args, **kwargs):
        if self.error:
            raise self.error
        self.removed.append(args)

    def make_bucket(self, bucket):
        if self.error:
            raise self.error
        self.created.append(bucket)


def _s3_error(code="NoSuchBucket", message="The specified bucket does not exist"):
    return S3Error(None, code, message, "resource", "request-id", "host-id")


def _upload():
    return SimpleNamespace(
        filename="foto.png",
        file=io.BytesIO(b"contenido"),
        content_type="image/png",
    )


def _sin_credenciales(monkeypatch):
    monkeypatch.setattr(config, "MINIO_ROOT_USER", None)
    monkeypatch.setattr(config, "MINIO_ROOT_PASSWORD", None)
    monkeypatch.setattr(config, "ENVIRONMENT", "development")


def test_upload_file_sin_credenciales_devuelve_configuracion(monkeypatch):
    _sin_credenciales(monkeypatch)
    servicio = nas.NasService(FakeStorageClient(), "uploads")

    resultado = servicio.upload_file(_upload(), "avatars/")

    assert resultado["success"] is False
    assert resultado["code"] == "StorageNotConfigured"
    assert "MINIO_ROOT_USER" in resultado["message"]
    assert "hint" in resultado


def test_upload_stream_sin_credenciales_devuelve_configuracion(monkeypatch):
    _sin_credenciales(monkeypatch)
    servicio = nas.NasService(FakeStorageClient(), "uploads")

    resultado = servicio.upload_stream(_upload())

    assert resultado["code"] == "StorageNotConfigured"


def test_upload_file_expone_codigo_y_pista_de_s3():
    servicio = nas.NasService(FakeStorageClient(error=_s3_error()), "uploads")

    resultado = servicio.upload_file(_upload(), "avatars/")

    assert resultado["success"] is False
    assert resultado["code"] == "NoSuchBucket"
    assert resultado["hint"] == "MINIO_BUCKET debe ser el nombre del bucket, no el ID."


def test_upload_stream_expone_error_inesperado():
    servicio = nas.NasService(
        FakeStorageClient(error=RuntimeError("socket cerrado")), "uploads"
    )

    resultado = servicio.upload_stream(_upload())

    assert resultado["success"] is False
    assert resultado["code"] == "RuntimeError"
    assert resultado["message"] == "socket cerrado"


def test_presigned_y_delete_ok():
    cliente = FakeStorageClient()
    servicio = nas.NasService(cliente, "uploads")

    assert servicio.get_presigned_url("avatars/a.png") == {
        "success": True,
        "url": "https://signed.example/object",
    }
    assert servicio.delete_file("avatars/a.png") == {"success": True}
    assert cliente.removed == [("uploads", "avatars/a.png")]


def test_presigned_y_delete_informan_error_s3():
    servicio = nas.NasService(FakeStorageClient(error=_s3_error("AccessDenied")), "uploads")

    assert servicio.get_presigned_url("avatars/a.png")["success"] is False
    assert servicio.delete_file("avatars/a.png")["success"] is False


def test_storage_status_sin_configuracion(monkeypatch):
    _sin_credenciales(monkeypatch)

    estado = nas.storage_status()

    assert estado["configured"] is False
    assert estado["error_code"] == "StorageNotConfigured"
    assert estado["reachable"] is False


def test_storage_status_bucket_existente(monkeypatch):
    monkeypatch.setattr(nas, "client", FakeStorageClient(exists=True))

    estado = nas.storage_status()

    assert estado["configured"] is True
    assert estado["reachable"] is True
    assert estado["bucket_exists"] is True
    assert estado["error_code"] is None


def test_storage_status_bucket_inexistente(monkeypatch):
    monkeypatch.setattr(nas, "client", FakeStorageClient(exists=False))

    estado = nas.storage_status()

    assert estado["reachable"] is True
    assert estado["bucket_exists"] is False
    assert estado["error_code"] == "NoSuchBucket"
    assert estado["hint"] == "MINIO_BUCKET debe ser el nombre del bucket, no el ID."


def test_storage_status_error_de_conexion(monkeypatch):
    monkeypatch.setattr(
        nas, "client", FakeStorageClient(error=ConnectionError("endpoint inalcanzable"))
    )

    estado = nas.storage_status()

    assert estado["reachable"] is False
    assert estado["error_code"] == "ConnectionError"
    assert estado["error_message"] == "endpoint inalcanzable"


def test_upload_error_detail_omite_mensaje_repetido():
    detalle = nas.upload_error_detail(
        {"success": False, "code": "AccessDenied", "message": "AccessDenied"},
        "Error al subir la imagen",
    )

    assert detalle == "Error al subir la imagen: AccessDenied"


def test_upload_error_detail_sin_resultado_devuelve_el_default():
    assert nas.upload_error_detail(None, "Error al subir") == "Error al subir"


def test_config_issues_detecta_endpoint_local_en_produccion(monkeypatch):
    monkeypatch.setattr(config, "MINIO_ROOT_USER", "key")
    monkeypatch.setattr(config, "MINIO_ROOT_PASSWORD", "secret")
    monkeypatch.setattr(config, "ENVIRONMENT", "production")
    monkeypatch.setattr(config, "MINIO_ENDPOINT", "localhost:9000")
    monkeypatch.setattr(config, "MINIO_REGION", None)

    issues = nas._config_issues()

    assert any("MinIO local" in issue for issue in issues)


def test_config_issues_exige_region_en_b2(monkeypatch):
    monkeypatch.setattr(config, "MINIO_ROOT_USER", "key")
    monkeypatch.setattr(config, "MINIO_ROOT_PASSWORD", "secret")
    monkeypatch.setattr(config, "ENVIRONMENT", "production")
    monkeypatch.setattr(config, "MINIO_ENDPOINT", "s3.us-east-005.backblazeb2.com")
    monkeypatch.setattr(config, "MINIO_REGION", None)

    issues = nas._config_issues()

    assert any("MINIO_REGION" in issue for issue in issues)


def test_ensure_bucket_no_intenta_crear_si_esta_desactivado(monkeypatch):
    monkeypatch.setattr(config, "MINIO_AUTO_CREATE_BUCKET", False)
    cliente = FakeStorageClient(exists=False)
    monkeypatch.setattr(nas, "client", cliente)

    nas._ensure_bucket()

    assert cliente.created == []


def test_ensure_bucket_crea_el_bucket_si_no_existe(monkeypatch):
    monkeypatch.setattr(config, "MINIO_AUTO_CREATE_BUCKET", True)
    cliente = FakeStorageClient(exists=False)
    monkeypatch.setattr(nas, "client", cliente)

    nas._ensure_bucket()

    assert cliente.created == [nas.bucket]


def test_ensure_bucket_tolera_error_de_conexion(monkeypatch):
    monkeypatch.setattr(config, "MINIO_AUTO_CREATE_BUCKET", True)
    cliente = FakeStorageClient(error=ConnectionError("sin red"))
    monkeypatch.setattr(nas, "client", cliente)

    nas._ensure_bucket()


def test_upload_file_y_upload_stream_exitosos():
    cliente = FakeStorageClient()
    servicio = nas.NasService(cliente, "uploads")

    archivo = servicio.upload_file(_upload(), "avatars/")
    stream = servicio.upload_stream(_upload())

    assert archivo["success"] is True
    assert archivo["path"].startswith("uploads/avatars/")
    assert stream["success"] is True
    assert stream["path"].startswith("uploads/")
    assert len(cliente.put_calls) == 2


def test_upload_stream_expone_error_de_s3():
    servicio = nas.NasService(FakeStorageClient(error=_s3_error("AccessDenied")), "uploads")

    resultado = servicio.upload_stream(_upload())

    assert resultado["success"] is False
    assert resultado["code"] == "AccessDenied"


def test_upload_file_expone_error_inesperado():
    servicio = nas.NasService(
        FakeStorageClient(error=RuntimeError("socket cerrado")), "uploads"
    )

    resultado = servicio.upload_file(_upload(), "avatars/")

    assert resultado["code"] == "RuntimeError"


def test_upload_file_sin_archivo_devuelve_none():
    servicio = nas.NasService(FakeStorageClient(), "uploads")

    assert servicio.upload_file(None, "avatars/") is None
    assert servicio.upload_stream(None) is None
