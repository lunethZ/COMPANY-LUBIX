import pytest
from jose import jwt

from app.Config import config
from app.models.ModelUser import Users

pytestmark = pytest.mark.integration


def test_test_user_queda_guardado_en_la_base(db_session, test_user):
    guardado = (
        db_session.query(Users).filter(Users.email == "usuario.prueba@example.com").first()
    )

    assert guardado is not None
    assert guardado.fullName == "Usuario de Prueba"
    assert guardado.role.name == "user"


def test_auth_headers_trae_un_token_del_usuario_de_prueba(test_user, auth_headers):
    scheme, token = auth_headers["Authorization"].split()
    payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])

    assert scheme == "Bearer"
    assert payload["sub"] == str(test_user.id)
    assert payload["role"] == "user"
