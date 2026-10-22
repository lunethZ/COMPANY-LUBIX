import pytest

from app.services.authentication.JWTService import (
    create_access_token,
    create_refresh_token,
    verify_token,
)

pytestmark = pytest.mark.unit


def test_access_token_contiene_usuario_rol_y_tipo():
    token = create_access_token("usuario-123", "user")

    payload = verify_token(token)

    assert payload["sub"] == "usuario-123"
    assert payload["role"] == "user"
    assert payload["type"] == "access"


def test_refresh_token_tiene_tipo_refresh():
    token = create_refresh_token("usuario-123")

    payload = verify_token(token)

    assert payload["sub"] == "usuario-123"
    assert payload["type"] == "refresh"


def test_verify_token_devuelve_none_con_un_token_invalido():
    assert verify_token("esto-no-es-un-token") is None
