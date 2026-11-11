"""Tests del router de salud: /health/database e /health/internet."""


def test_health_database_responde_200_y_expone_su_estado(client):
    response = client.get("/health/database")

    assert response.status_code == 200
    payload = response.json()
    # Forma del JSON: siempre informa del estado, con detalle si falla.
    assert "Base de datos" in payload
    assert payload["Base de datos"] in {"OK", "ERROR"}
    if payload["Base de datos"] == "ERROR":
        assert isinstance(payload.get("detail"), str)


def test_health_database_ok(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.HealthRouter.db_test", lambda: {"Base de datos": "OK"}
    )

    response = client.get("/health/database")

    assert response.status_code == 200
    assert response.json() == {"Base de datos": "OK"}


def test_health_internet_ok(client, internet_ok):
    response = client.get("/health/internet")

    assert response.status_code == 200
    assert response.json() == {"message": "Conexión a Internet exitosa"}


def test_health_internet_sin_conexion(client, internet_fail):
    response = client.get("/health/internet")

    assert response.status_code == 200
    assert response.json() == {"message": "No se pudo establecer conexión a Internet"}


def test_health_es_publico_no_requiere_token(client):
    """La middleware deja pasar /health sin Authorization."""
    assert client.get("/health/database").status_code == 200


def test_openapi_es_publico(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "openapi" in response.json()
