"""Normalización de las credenciales de almacenamiento leídas del entorno."""

from app.Config import _env_text


def test_env_text_limpia_saltos_de_linea_y_espacios(monkeypatch):
    monkeypatch.setenv("MINIO_ROOT_USER", "\ne34e1b7b2b09\n")
    monkeypatch.setenv("MINIO_ROOT_PASSWORD", " applicationKey ")

    assert _env_text("MINIO_ROOT_USER") == "e34e1b7b2b09"
    assert _env_text("MINIO_ROOT_PASSWORD") == "applicationKey"
