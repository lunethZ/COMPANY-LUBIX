"""PQRS contra PostgreSQL real."""
import uuid

import pytest

from app.models.ModelPQRS import PQRS

pytestmark = pytest.mark.integration

PAYLOAD = {
    "type": "queja",
    "subject": "Asunto de prueba",
    "description": "Descripción detallada de la solicitud",
}


def test_crear_pqrs_la_guarda_en_postgres(client, db_session, test_user, auth_headers):
    response = client.post("/pqrs", json=PAYLOAD, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "PQRS enviada correctamente"

    stored = db_session.get(PQRS, uuid.UUID(body["id"]))
    assert stored is not None
    assert stored.user_id == test_user.id
    assert stored.user_role == "user"
    assert stored.status == "pending"
    assert stored.type == PAYLOAD["type"]
    assert stored.subject == PAYLOAD["subject"]
    assert stored.description == PAYLOAD["description"]


def test_pqrs_tipo_invalido_no_escribe_en_postgres(
    client, db_session, test_user, auth_headers
):
    payload = {**PAYLOAD, "type": "no-existe"}

    response = client.post("/pqrs", json=payload, headers=auth_headers)

    assert response.status_code == 400
    assert response.json() == {"detail": "Tipo de PQRS no válido"}
    assert db_session.query(PQRS).count() == 0


def test_pqrs_asunto_de_150_caracteres_se_guarda(
    client, db_session, test_user, auth_headers
):
    payload = {**PAYLOAD, "subject": "a" * 150}

    response = client.post("/pqrs", json=payload, headers=auth_headers)

    assert response.status_code == 200
    stored = db_session.get(PQRS, uuid.UUID(response.json()["id"]))
    assert stored is not None
    assert len(stored.subject) == 150


def test_pqrs_asunto_de_151_caracteres_devuelve_422(
    client, db_session, test_user, auth_headers
):
    payload = {**PAYLOAD, "subject": "a" * 151}

    response = client.post("/pqrs", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "subject"
    assert db_session.query(PQRS).count() == 0


def test_empresa_tambien_puede_crear_pqrs(client, db_session, empresa, headers_empresa):
    user, _ = empresa

    response = client.post("/pqrs", json=PAYLOAD, headers=headers_empresa)

    assert response.status_code == 200
    stored = db_session.get(PQRS, uuid.UUID(response.json()["id"]))
    assert stored is not None
    assert stored.user_id == user.id
    assert stored.user_role == "company"
