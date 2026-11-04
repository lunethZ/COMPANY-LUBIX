import pytest
from unittest.mock import MagicMock

from fastapi.responses import StreamingResponse

from app.routers import FileRouter


pytestmark = pytest.mark.api


@pytest.fixture
def file_fake_client(monkeypatch):
    """Crea un MagicMock independiente y lo asigna a FileRouter.subir.client."""
    fake = MagicMock()
    monkeypatch.setattr(FileRouter.subir, "client", fake)
    return fake


class _RespuestaMinio:
    def __init__(self, contenido=b"contenido", fallar_al_cerrar=False):
        self._contenido = contenido
        self._fallar_al_cerrar = fallar_al_cerrar
        self.cerrada = False
        self.liberada = False

    def read(self):
        return self._contenido

    def close(self):
        if self._fallar_al_cerrar:
            raise RuntimeError("fallo al cerrar")
        self.cerrada = True

    def release_conn(self):
        if self._fallar_al_cerrar:
            raise RuntimeError("fallo al liberar")
        self.liberada = True


def _fallar_get_object(*args, **kwargs):
    raise RuntimeError("objeto no disponible")


class TestFileRouter:
    def test_get_file_exitoso_devuelve_stream_y_headers(
        self, api_client, file_fake_client
    ):
        respuesta = _RespuestaMinio(b"contenido de prueba")
        file_fake_client.get_object = lambda *a, **k: respuesta

        response = api_client.get("/files/documentos/nota.txt")

        assert response.status_code == 200
        assert response.content == b"contenido de prueba"
        assert response.headers["content-type"].startswith("text/plain")
        assert (
            response.headers["content-disposition"]
            == 'inline; filename="nota.txt"'
        )
        assert response.headers["cache-control"] == "public, max-age=86400"
        assert respuesta.cerrada is True
        assert respuesta.liberada is True

    def test_get_file_sin_extension_usa_octet_stream(self, api_client, file_fake_client):
        respuesta = _RespuestaMinio(b"binario")
        file_fake_client.get_object = lambda *a, **k: respuesta

        response = api_client.get("/files/archivo-sin-extension")

        assert response.status_code == 200
        assert response.content == b"binario"
        assert response.headers["content-type"] == "application/octet-stream"
        assert (
            response.headers["content-disposition"]
            == 'inline; filename="archivo-sin-extension"'
        )

    def test_get_file_si_falla_get_object_usa_download_stream(
        self, api_client, file_fake_client, monkeypatch
    ):
        file_fake_client.get_object = _fallar_get_object

        def _download_stream(file_path):
            return StreamingResponse(
                iter([b"desde fallback"]),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": (
                        f'attachment; filename="{file_path.split("/")[-1]}"'
                    )
                },
            )

        monkeypatch.setattr(FileRouter.subir, "download_stream", _download_stream)

        response = api_client.get("/files/carpeta/imagen.png")

        assert response.status_code == 200
        assert response.content == b"desde fallback"
        assert response.headers["content-type"] == "application/octet-stream"
        assert (
            response.headers["content-disposition"]
            == 'attachment; filename="imagen.png"'
        )

    def test_hallazgo_h3_si_fallan_ambos_devuelve_404(
        self, api_client, file_fake_client, monkeypatch
    ):
        file_fake_client.get_object = _fallar_get_object

        def _download_stream_falla(file_path):
            raise RuntimeError("fallback no disponible")

        monkeypatch.setattr(FileRouter.subir, "download_stream", _download_stream_falla)

        response = api_client.get("/files/no-existe.pdf")

        assert response.status_code == 404
        assert response.json()["detail"] == "Archivo no encontrado"

    def test_get_file_error_al_cerrar_no_cambia_la_respuesta(
        self, api_client, file_fake_client
    ):
        respuesta = _RespuestaMinio(b"contenido", fallar_al_cerrar=True)
        file_fake_client.get_object = lambda *a, **k: respuesta

        response = api_client.get("/files/cierre.jpg")

        assert response.status_code == 200
        assert response.content == b"contenido"
        assert response.headers["content-type"] == "image/jpeg"