import pytest

pytestmark = pytest.mark.api


def test_ruta_protegida_sin_token_devuelve_401(client):
    response = client.get("/pqrs")

    assert response.status_code == 401
    assert response.json()["detail"] == "Token requerido"


def test_ruta_protegida_con_token_invalido_devuelve_401(client):
    response = client.get("/pqrs", headers={"Authorization": "Bearer token-falso"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Token invalido"


def test_usuario_sin_rol_admin_no_accede_a_rutas_de_admin(client, auth_headers):
    response = client.get("/admin/pqrs", headers=auth_headers)

    assert response.status_code == 401
    assert "no tienes permiso" in response.json()["detail"]
