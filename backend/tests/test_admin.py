"""Tests de administración (/admin).

Solo el rol "admin" pasa la middleware para estas rutas; cualquier otro rol
recibe 401 "no tienes permiso...".
"""

from app.models.ModelCompany import Company
from app.models.ModelPQRS import PQRS
from app.models.ModelUser import Users


# --------------------------------------------------------------------------- #
# Autorización
# --------------------------------------------------------------------------- #
def test_admin_rutas_sin_token_devuelve_401(client, seed):
    seed.roles("admin")

    for path in ("/admin/dashboard/me", "/admin/users", "/admin/companies", "/admin/pqrs"):
        assert client.get(path).status_code == 401, path


def test_admin_rutas_rol_user_devuelve_401(client, seed):
    user = seed.user()
    headers = seed.headers(user)

    for path in ("/admin/dashboard/me", "/admin/users", "/admin/companies", "/admin/pqrs"):
        response = client.get(path, headers=headers)
        assert response.status_code == 401, path
        assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}


def test_admin_rutas_rol_company_devuelve_401(client, seed):
    company = seed.company()

    response = client.get("/admin/users", headers=seed.headers(company))

    assert response.status_code == 401
    assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
def test_dashboard_me_devuelve_200_y_su_forma(client, seed):
    admin = seed.admin()
    seed.user(email="uno@lubix.com")
    seed.user(email="dos@lubix.com")
    seed.company(email="empresa@lubix.com")

    response = client.get("/admin/dashboard/me", headers=seed.headers(admin))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "totalUsers",
        "totalCompanies",
        "pendingCompanies",
        "activeUsers",
        "inactiveUsers",
    }
    assert body["totalUsers"] >= 2
    assert body["totalCompanies"] >= 1
    assert isinstance(body["pendingCompanies"], int)


# --------------------------------------------------------------------------- #
# Usuarios
# --------------------------------------------------------------------------- #
def test_list_users_devuelve_200_y_su_forma(client, seed):
    admin = seed.admin()
    seed.user(email="uno@lubix.com")

    response = client.get("/admin/users", headers=seed.headers(admin))

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list) and len(body) == 2
    assert set(body[0]) == {
        "id",
        "fullName",
        "email",
        "tell",
        "role",
        "verified",
        "isActive",
        "memberSince",
    }
    roles = {u["role"] for u in body}
    assert roles == {"user", "admin"}


def test_toggle_user_status_devuelve_200(client, seed):
    admin = seed.admin()
    target = seed.user(email="uno@lubix.com")

    response = client.patch(
        f"/admin/users/{target.id}/toggle-status", headers=seed.headers(admin)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id", "isActive"}
    assert body["isActive"] is False
    assert "inhabilitado" in body["message"]


def test_toggle_user_status_inexistente_devuelve_404(client, seed):
    admin = seed.admin()

    response = client.patch(
        "/admin/users/00000000-0000-0000-0000-000000000000/toggle-status",
        headers=seed.headers(admin),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Usuario no encontrado"}


def test_toggle_user_status_no_puede_desactivar_a_un_admin(client, seed):
    admin = seed.admin()
    otro_admin = seed.admin(email="otro-admin@lubix.com")

    response = client.patch(
        f"/admin/users/{otro_admin.id}/toggle-status", headers=seed.headers(admin)
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "No se puede inhabilitar un administrador"}


def test_toggle_user_status_no_puede_desactivarse_a_si_mismo(client, seed):
    admin = seed.admin()

    response = client.patch(
        f"/admin/users/{admin.id}/toggle-status", headers=seed.headers(admin)
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "No puedes inhabilitar tu propia cuenta de administrador"
    }


# --------------------------------------------------------------------------- #
# Empresas
# --------------------------------------------------------------------------- #
def test_list_companies_devuelve_200_y_su_forma(client, seed):
    admin = seed.admin()
    seed.company()

    response = client.get("/admin/companies", headers=seed.headers(admin))

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list) and len(body) == 1
    assert set(body[0]) == {
        "id",
        "userId",
        "nameCompany",
        "nit",
        "nitDV",
        "addressCompany",
        "email",
        "ownerName",
        "ownerTell",
        "verified",
        "isActive",
        "certificate",
        "memberSince",
    }
    assert body[0]["email"] == "empresa@lubix.com"


def test_toggle_company_status_devuelve_200(client, seed):
    admin = seed.admin()
    company = seed.company()

    response = client.patch(
        f"/admin/companies/{company.id}/toggle-status", headers=seed.headers(admin)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id", "isActive"}
    assert body["isActive"] is False
    assert "Empresa inhabilitada" in body["message"]


def test_toggle_company_status_inexistente_devuelve_404(client, seed):
    admin = seed.admin()

    response = client.patch(
        "/admin/companies/00000000-0000-0000-0000-000000000000/toggle-status",
        headers=seed.headers(admin),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Empresa no encontrada"}


def test_validate_company_devuelve_200_y_su_forma(client, seed):
    admin = seed.admin()
    company = seed.company(verified=False)

    response = client.patch(
        f"/admin/companies/{company.id}/validate", headers=seed.headers(admin)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id", "nameCompany", "verified", "isActive"}
    assert body["verified"] is True
    assert body["isActive"] is True

    with seed.session() as session:
        owner = session.get(Users, company.user_id)
        assert owner.verified is True


def test_validate_company_inexistente_devuelve_404(client, seed):
    admin = seed.admin()

    response = client.patch(
        "/admin/companies/00000000-0000-0000-0000-000000000000/validate",
        headers=seed.headers(admin),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Empresa no encontrada"}


# --------------------------------------------------------------------------- #
# PQRS
# --------------------------------------------------------------------------- #
def test_list_pqrs_admin_devuelve_200_y_su_forma(client, seed):
    admin = seed.admin()
    solicitante = seed.user(email="solicitante@lubix.com")
    seed.pqrs(solicitante, subject="Reclamo de prueba")

    response = client.get("/admin/pqrs", headers=seed.headers(admin))

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list) and len(body) == 1
    assert set(body[0]) == {
        "id",
        "type",
        "subject",
        "description",
        "status",
        "user_role",
        "user_name",
        "user_email",
        "created_at",
    }
    assert body[0]["user_email"] == "solicitante@lubix.com"


def test_resolve_pqrs_devuelve_200(client, seed):
    admin = seed.admin()
    solicitante = seed.user(email="solicitante@lubix.com")
    pqrs = seed.pqrs(solicitante, status="pending")

    response = client.patch(
        f"/admin/pqrs/{pqrs.id}/status", headers=seed.headers(admin)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id", "status"}
    assert body["status"] == "resolved"

    with seed.session() as session:
        assert session.get(PQRS, pqrs.id).status == "resolved"


def test_resolve_pqrs_inexistente_devuelve_404(client, seed):
    admin = seed.admin()

    response = client.patch(
        "/admin/pqrs/00000000-0000-0000-0000-000000000000/status",
        headers=seed.headers(admin),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "PQRS no encontrada"}


# --------------------------------------------------------------------------- #
# 5xx
# --------------------------------------------------------------------------- #
def test_toggle_user_status_commit_fallido_no_da_500(client, seed, monkeypatch):
    """Documenta el mismo hallazgo que en /pqrs: las excepciones crudas no
    llegan a 500, el `except Exception` de la middleware las reporta 401."""
    admin = seed.admin()
    target = seed.user(email="uno@lubix.com")

    def boom(self):
        raise RuntimeError("base de datos caída")

    monkeypatch.setattr("sqlalchemy.orm.Session.commit", boom)

    response = client.patch(
        f"/admin/users/{target.id}/toggle-status", headers=seed.headers(admin)
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Token invalido"}
