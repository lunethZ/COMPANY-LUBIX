# Tests unitarios de JWTService: creación, verificación, expiración y tokens inválidos.
# No hay BD ni dobles: el servicio es puro (python-jose + config).
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.Config import config
from app.services.authentication import JWTService


def test_access_token_contiene_sub_role_type_y_expiracion():
    token = JWTService.create_access_token(user_id="42", role="user")

    payload = JWTService.verify_token(token)

    assert isinstance(payload, dict)
    assert payload["sub"] == "42"
    assert payload["role"] == "user"
    assert payload["type"] == "access"
    assert payload["exp"] > datetime.now(timezone.utc).timestamp()


def test_access_token_expira_en_el_tiempo_configurado():
    token = JWTService.create_access_token(user_id="1", role="admin")

    payload = JWTService.verify_token(token)

    minutos = (payload["exp"] - datetime.now(timezone.utc).timestamp()) / 60
    assert 0 < minutos <= config.ACCESS_TOKEN_EXPIRE_MINUTES + 1


def test_refresh_token_es_de_tipo_refresh_y_no_lleva_role():
    token = JWTService.create_refresh_token(user_id="42")

    payload = JWTService.verify_token(token)

    assert payload["sub"] == "42"
    assert payload["type"] == "refresh"
    assert "role" not in payload
    assert payload["exp"] > datetime.now(timezone.utc).timestamp()


def test_access_y_refresh_son_tokens_distintos():
    access = JWTService.create_access_token(user_id="42", role="user")
    refresh = JWTService.create_refresh_token(user_id="42")

    assert access != refresh
    assert JWTService.verify_token(access)["type"] == "access"
    assert JWTService.verify_token(refresh)["type"] == "refresh"


def test_access_token_se_verifica_con_la_clave_fuera_del_servicio():
    token = JWTService.create_access_token(user_id="7", role="admin")

    payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])

    assert payload["sub"] == "7"
    assert payload["role"] == "admin"


def test_verify_token_expirado_devuelve_expired():
    token = jwt.encode(
        {
            "sub": "1",
            "type": "access",
            "exp": datetime.utcnow() - timedelta(minutes=1),
        },
        config.SECRET_KEY,
        algorithm=config.ALGORITHM,
    )

    assert JWTService.verify_token(token) == "expired"


def test_verify_token_firmado_con_otra_clave_devuelve_none():
    token = jwt.encode(
        {
            "sub": "1",
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=5),
        },
        "otra-clave-secreta",
        algorithm=config.ALGORITHM,
    )

    assert JWTService.verify_token(token) is None


def test_verify_token_con_basura_devuelve_none():
    assert JWTService.verify_token("esto-no-es-un-jwt") is None


def test_verify_token_falsificado_al_final_devuelve_none():
    token = JWTService.create_access_token(user_id="1", role="user")

    assert JWTService.verify_token(token + "x") is None
