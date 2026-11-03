"""Tests del sirviente de archivos (/files).

La ruta es pública (la middleware la deja pasar). MinIO está doblado en
`conftest.py`; aquí se controla además `get_object` para simular el caso
"archivo existe" y "archivo no existe".
"""

import pytest


class _Stream:
    """Respuesta mínima compatible con la que espera `FileRouter`."""

    def __init__(self, data: bytes):
        self._data = data

    def read(self) -> bytes:
        return self._data

    def close(self):
        pass

    def release_conn(self):
        pass


@pytest.fixture()
def minio_con_archivo(monkeypatch):
    """`get_object` devuelve un archivo de prueba."""

    def fake_get_object(self, bucket, object_name, *args, **kwargs):
        if object_name == "no-existe.png":
            raise RuntimeError("NoSuchKey")
        return _Stream(b"contenido-binario")

    monkeypatch.setattr("minio.Minio.get_object", fake_get_object)


@pytest.fixture()
def minio_sin_archivos(monkeypatch):
    """Ni `get_object` ni `download_stream` encuentran nada."""

    def fake_get_object(self, bucket, object_name, *args, **kwargs):
        raise RuntimeError("NoSuchKey")

    monkeypatch.setattr("minio.Minio.get_object", fake_get_object)


def test_get_file_devuelve_200_y_su_forma(client, minio_con_archivo):
    response = client.get("/files/imagen.png")

    assert response.status_code == 200
    assert response.content == b"contenido-binario"
    assert response.headers["content-type"].startswith("image/png")
    assert 'filename="imagen.png"' in response.headers["content-disposition"]
    assert response.headers["cache-control"] == "public, max-age=86400"


def test_get_file_es_publico_sin_token(client, minio_con_archivo):
    """No se exige Authorization para leer archivos."""
    response = client.get("/files/subcarpeta/archivo.jpg")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/jpeg")


def test_get_file_tipo_desconocido_usa_octet_stream(client, minio_con_archivo):
    response = client.get("/files/dato.sin-extension")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"


def test_get_file_inexistente_devuelve_404(client, minio_sin_archivos):
    response = client.get("/files/no-existe.png")

    assert response.status_code == 404
    assert response.json() == {"detail": "Archivo no encontrado"}


def test_get_file_con_get_object_roto_tambien_devuelve_404(client, minio_con_archivo, monkeypatch):
    """Si el primer intento falla, se intenta `download_stream`; si ese
    también falla, se responde 404."""
    monkeypatch.setattr(
        "app.services.NasService.NasService.download_stream",
        lambda self, name: (_ for _ in ()).throw(RuntimeError("sin red")),
    )
    monkeypatch.setattr(
        "minio.Minio.get_object",
        lambda self, bucket, name, *a, **k: (_ for _ in ()).throw(RuntimeError("fallo")),
    )

    response = client.get("/files/roto.png")

    assert response.status_code == 404
    assert response.json() == {"detail": "Archivo no encontrado"}
