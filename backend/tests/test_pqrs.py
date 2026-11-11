"""Tests de PQRS (/pqrs).

La ruta está permitida para los roles "user" y "company"; el listado solo
devuelve las PQRS del usuario autenticado.
"""

PQRS_PAYLOAD = {
    "type": "queja",
    "subject": "Asunto de prueba",
    "description": "Descripción detallada de la solicitud",
}


# --------------------------------------------------------------------------- #
# Creación
# --------------------------------------------------------------------------- #
def test_create_pqrs_devuelve_200_y_su_forma(client, seed):
    user = seed.user()

    response = client.post("/pqrs", json=PQRS_PAYLOAD, headers=seed.headers(user))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id"}
    assert body["message"] == "PQRS enviada correctamente"
    assert body["id"]


def test_create_pqrs_guarda_rol_y_estado(client, seed):
    user = seed.user()

    response = client.post("/pqrs", json=PQRS_PAYLOAD, headers=seed.headers(user))

    from app.models.ModelPQRS import PQRS

    with seed.session() as session:
        stored = session.get(PQRS, response.json()["id"])
        assert stored.status == "pending"
        assert stored.user_role == "user"
        assert str(stored.user_id) == str(user.id)


def test_create_pqrs_rol_company_tambien_puede(client, seed):
    company = seed.company()

    response = client.post("/pqrs", json=PQRS_PAYLOAD, headers=seed.headers(company))

    assert response.status_code == 200

    from app.models.ModelPQRS import PQRS

    with seed.session() as session:
        stored = session.get(PQRS, response.json()["id"])
        assert stored.user_role == "company"


def test_create_pqrs_tipo_invalido_devuelve_400(client, seed):
    user = seed.user()
    payload = {**PQRS_PAYLOAD, "type": "no-existe"}

    response = client.post("/pqrs", json=payload, headers=seed.headers(user))

    assert response.status_code == 400
    assert response.json() == {"detail": "Tipo de PQRS no válido"}


def test_create_pqrs_sin_subject_devuelve_422(client, seed):
    user = seed.user()
    payload = {k: v for k, v in PQRS_PAYLOAD.items() if k != "subject"}

    response = client.post("/pqrs", json=payload, headers=seed.headers(user))

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "subject"


def test_create_pqrs_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    response = client.post("/pqrs", json=PQRS_PAYLOAD)

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_create_pqrs_commit_fallido_no_da_500(client, seed, monkeypatch):
    """Documenta un hallazgo: una excepción cruda en el endpoint no llega a
    ser 500; el `except Exception` de `auth_middleware` la reporta como 401."""
    user = seed.user()

    def boom(self):
        raise RuntimeError("base de datos caída")

    monkeypatch.setattr("sqlalchemy.orm.Session.commit", boom)

    response = client.post("/pqrs", json=PQRS_PAYLOAD, headers=seed.headers(user))

    assert response.status_code == 401
    assert response.json() == {"detail": "Token invalido"}


# --------------------------------------------------------------------------- #
# Listado
# --------------------------------------------------------------------------- #
def test_list_my_pqrs_devuelve_200_y_lista(client, seed):
    user = seed.user()
    seed.pqrs(user, subject="Mía")
    otro = seed.user(email="otro@lubix.com")
    seed.pqrs(otro, subject="Ajena")

    response = client.get("/pqrs", headers=seed.headers(user))

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert set(body[0]) == {
        "id",
        "type",
        "subject",
        "description",
        "status",
        "user_role",
        "created_at",
    }
    assert body[0]["subject"] == "Mía"


def test_list_my_pqrs_sin_datos_devuelve_lista_vacia(client, seed):
    user = seed.user()

    response = client.get("/pqrs", headers=seed.headers(user))

    assert response.status_code == 200
    assert response.json() == []


def test_list_my_pqrs_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    response = client.get("/pqrs")

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}
