"""Registro de usuarios contra PostgreSQL real.

El rol "user" se crea en Arrange porque `register_user_service` lo busca por
nombre; sin ese dato el servicio responde 500 antes de guardar.
"""
import pytest

from app.models.ModelCode import Codes, typeCode
from app.models.ModelUser import Users

pytestmark = pytest.mark.integration

PAYLOAD = {
    "fullName": "Persona Nueva",
    "email": "nuevo-postgres@lubix.com",
    "password": "Secreta1!",
    "tell": "3009998877",
}


def test_registro_guarda_usuario_y_codigo_en_postgres(client, db_session, rol_user):
    response = client.post("/auth/register-user", json=PAYLOAD)

    assert response.status_code == 200
    assert "Usuario registrado correctamente" in response.json()["message"]

    user = db_session.query(Users).filter(Users.email == PAYLOAD["email"]).one()
    assert user.fullName == PAYLOAD["fullName"]
    assert user.verified is False
    assert user.hashed_password != PAYLOAD["password"]
    assert user.role_id == rol_user.id

    code = db_session.query(Codes).filter(Codes.user_id == user.id).one()
    assert code.type == typeCode.verifyEmail


def test_registro_correo_duplicado_devuelve_409(client, db_session, rol_user):
    existente = Users(
        fullName="Ya Existe",
        email=PAYLOAD["email"],
        hashed_password="hash-de-prueba",
        tell="3001112233",
        role_id=rol_user.id,
    )
    db_session.add(existente)
    db_session.commit()

    response = client.post("/auth/register-user", json=PAYLOAD)

    assert response.status_code == 409
    assert response.json() == {"detail": "correo en uso"}
    assert db_session.query(Users).filter(Users.email == PAYLOAD["email"]).count() == 1


def test_registro_password_debil_devuelve_422_y_no_escribe(client, db_session):
    payload = {**PAYLOAD, "password": "123"}

    response = client.post("/auth/register-user", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "password"
    assert db_session.query(Users).filter(Users.email == PAYLOAD["email"]).count() == 0
