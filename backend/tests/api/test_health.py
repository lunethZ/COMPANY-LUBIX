import pytest

from app.routers import HealthRouter

pytestmark = pytest.mark.api


def test_health_liveness_responde_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_database_delega_en_db_test(client, monkeypatch):
    monkeypatch.setattr(
        HealthRouter, "db_test", lambda: {"Base de datos": "OK"}
    )

    response = client.get("/health/database")

    assert response.status_code == 200
    assert response.json() == {"Base de datos": "OK"}


@pytest.mark.parametrize(
    "conectado, mensaje",
    [
        (True, "Conexión a Internet exitosa"),
        (False, "No se pudo establecer conexión a Internet"),
    ],
)
def test_health_internet_refleja_el_estado(client, monkeypatch, conectado, mensaje):
    monkeypatch.setattr(
        HealthRouter, "check_internet_connection", lambda: conectado
    )

    response = client.get("/health/internet")

    assert response.status_code == 200
    assert response.json()["message"] == mensaje
