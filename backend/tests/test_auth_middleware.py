"""Tests de la middleware de autenticación y de permisos por rol."""

from datetime import datetime, timedelta

from jose import jwt

from app.Config import config
from app.services.authentication.JWTService import create_refresh_token

PROTECTED = "/user/dashboard/me"


def _expired_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "role": "user",
        "type": "access",
        "exp": datetime.utcnow() - timedelta(minutes=5),
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)


def test_ruta_protegida_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    response = client.get(PROTECTED)

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_esquema_de_autorizacion_invalido_devuelve_401(client, seed):
    seed.roles("user")

    response = client.get(PROTECTED, headers={"Authorization": "Basic c2VjcmV0"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Formato de autorizacion invalido"}


def test_token_malformado_devuelve_401(client, seed):
    seed.roles("user")

    response = client.get(PROTECTED, headers={"Authorization": "Bearer no.es.un.jwt"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Token invalido"}


def test_token_expirado_devuelve_401(client, seed):
    user = seed.user()
    token = _expired_access_token(str(user.id))

    response = client.get(PROTECTED, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Token invalido"}


def test_refresh_token_no_sirve_como_access_token(client, seed):
    user = seed.user()
    token = create_refresh_token(str(user.id))

    response = client.get(PROTECTED, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Access token requerido"}


def test_usuario_no_puede_acceder_a_rutas_de_empresa(client, seed):
    user = seed.user()

    response = client.get("/company/dashboard/me", headers=seed.headers(user))

    assert response.status_code == 401
    assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}


def test_empresa_no_puede_acceder_a_rutas_de_usuario(client, seed):
    company = seed.company()

    response = client.get("/user/favorites", headers=seed.headers(company))

    assert response.status_code == 401
    assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}


def test_admin_puede_acceder_a_rutas_de_otro_rol(client, seed):
    admin = seed.admin()

    response = client.get("/admin/dashboard/me", headers=seed.headers(admin))

    assert response.status_code == 200


def test_crear_reseña_requiere_rol_usuario(client, seed):
    company = seed.company()

    response = client.post(
        "/products/00000000-0000-0000-0000-000000000000/reviews",
        json={"rating": 5, "comment": "Muy bueno"},
        headers=seed.headers(company),
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Solo usuarios pueden crear reseñas"}


def test_crear_reseña_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    response = client.post(
        "/products/00000000-0000-0000-0000-000000000000/reviews",
        json={"rating": 5, "comment": "Muy bueno"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_preflight_cors_no_requiere_token(client, seed):
    seed.roles("user")

    response = client.options(
        "/pqrs",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin")
