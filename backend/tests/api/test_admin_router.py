import uuid

import pytest

from app.models.ModelCompany import Company
from app.models.ModelPQRS import PQRS
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.services.authentication.JWTService import create_access_token
from app.utils.Security import hash_password


pytestmark = pytest.mark.api


@pytest.fixture
def admin_user(api_db_session):
    role = api_db_session.query(Role).filter(Role.name == "admin").first()
    user = Users(
        fullName="Admin User",
        email="admin@example.com",
        hashed_password=hash_password("AdminPass123"),
        tell="1234567890",
        role_id=role.id,
        verified=True,
        isActive=True,
    )
    api_db_session.add(user)
    api_db_session.commit()
    api_db_session.refresh(user)
    return user


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(user_id=str(admin_user.id), role="admin")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_company(api_fake_company, api_db_session):
    return (
        api_db_session.query(Company)
        .filter(Company.user_id == api_fake_company.id)
        .first()
    )


@pytest.fixture
def admin_pending_company_user(api_db_session):
    role = api_db_session.query(Role).filter(Role.name == "company").first()
    user = Users(
        fullName="Pending Company",
        email="pending-company@example.com",
        hashed_password=hash_password("PendingPass123"),
        tell="1234567890",
        role_id=role.id,
        verified=False,
        isActive=False,
    )
    api_db_session.add(user)
    api_db_session.flush()

    company = Company(
        user_id=user.id,
        nameCompany="Pending Company S.A.S",
        addressCompany="Calle 456",
        CompanyNIT="900987654",
        CompanyNITDV="3",
        CompanyCertificate="certificates/pending.pdf",
    )
    api_db_session.add(company)
    api_db_session.commit()
    api_db_session.refresh(user)
    return user


@pytest.fixture
def admin_pending_company(admin_pending_company_user, api_db_session):
    return (
        api_db_session.query(Company)
        .filter(Company.user_id == admin_pending_company_user.id)
        .first()
    )


@pytest.fixture
def admin_unknown_headers():
    token = create_access_token(user_id=str(uuid.uuid4()), role="admin")
    return {"Authorization": f"Bearer {token}"}


class TestAdminRouter:
    """Tests para /admin."""

    def test_dashboard_me_devuelve_conteos(
        self,
        api_client,
        admin_headers,
        api_fake_user,
        api_fake_company,
        admin_pending_company_user,
    ):
        response = api_client.get("/admin/dashboard/me", headers=admin_headers)

        assert response.status_code == 200
        assert response.json() == {
            "totalUsers": 1,
            "totalCompanies": 2,
            "pendingCompanies": 1,
            "activeUsers": 3,
            "inactiveUsers": 1,
        }

    def test_dashboard_me_sin_token_devuelve_401(self, api_client):
        response = api_client.get("/admin/dashboard/me")

        assert response.status_code == 401
        assert response.json()["detail"] == "Token requerido"

    def test_dashboard_me_rol_user_devuelve_401(
        self, api_client, api_auth_headers_user
    ):
        response = api_client.get(
            "/admin/dashboard/me", headers=api_auth_headers_user
        )

        assert response.status_code == 401
        assert (
            response.json()["detail"]
            == "no tienes permiso para acceder a este recurso"
        )

    def test_dashboard_me_rol_company_devuelve_401(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.get(
            "/admin/dashboard/me", headers=api_auth_headers_company
        )

        assert response.status_code == 401
        assert (
            response.json()["detail"]
            == "no tienes permiso para acceder a este recurso"
        )

    def test_list_users_devuelve_claves_y_roles(
        self, api_client, admin_headers, admin_user, api_fake_user, api_fake_company
    ):
        response = api_client.get("/admin/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        expected_keys = {
            "id",
            "fullName",
            "email",
            "tell",
            "role",
            "verified",
            "isActive",
            "memberSince",
        }
        assert all(set(item) == expected_keys for item in data)
        by_id = {item["id"]: item for item in data}
        assert by_id[str(admin_user.id)]["role"] == "admin"
        assert by_id[str(api_fake_user.id)]["role"] == "user"
        assert by_id[str(api_fake_company.id)]["role"] == "company"

    def test_toggle_user_status_exitoso(
        self, api_client, admin_headers, api_fake_user, api_db_session
    ):
        first = api_client.patch(
            f"/admin/users/{api_fake_user.id}/toggle-status",
            headers=admin_headers,
        )

        assert first.status_code == 200
        assert first.json() == {
            "message": "Usuario inhabilitado correctamente",
            "id": str(api_fake_user.id),
            "isActive": False,
        }

        second = api_client.patch(
            f"/admin/users/{api_fake_user.id}/toggle-status",
            headers=admin_headers,
        )

        assert second.status_code == 200
        assert second.json()["message"] == "Usuario habilitado correctamente"
        assert second.json()["isActive"] is True

        api_db_session.refresh(api_fake_user)
        assert api_fake_user.isActive is True

    def test_toggle_user_status_propio_admin_devuelve_400(
        self, api_client, admin_headers, admin_user
    ):
        response = api_client.patch(
            f"/admin/users/{admin_user.id}/toggle-status",
            headers=admin_headers,
        )

        assert response.status_code == 400
        assert (
            response.json()["detail"]
            == "No puedes inhabilitar tu propia cuenta de administrador"
        )

    def test_toggle_user_status_otro_admin_devuelve_400(
        self, api_client, admin_headers, api_db_session
    ):
        role = api_db_session.query(Role).filter(Role.name == "admin").first()
        other_admin = Users(
            fullName="Other Admin",
            email="other-admin@example.com",
            hashed_password=hash_password("OtherAdmin123"),
            tell="1234567890",
            role_id=role.id,
            verified=True,
            isActive=True,
        )
        api_db_session.add(other_admin)
        api_db_session.commit()
        api_db_session.refresh(other_admin)

        response = api_client.patch(
            f"/admin/users/{other_admin.id}/toggle-status",
            headers=admin_headers,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "No se puede inhabilitar un administrador"

    def test_toggle_user_status_inexistente_devuelve_404(
        self, api_client, admin_headers
    ):
        response = api_client.patch(
            f"/admin/users/{uuid.uuid4()}/toggle-status",
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_toggle_user_status_admin_actual_inexistente_devuelve_404(
        self, api_client, admin_unknown_headers, api_fake_user
    ):
        response = api_client.patch(
            f"/admin/users/{api_fake_user.id}/toggle-status",
            headers=admin_unknown_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario administrador no encontrado"

    def test_list_companies_devuelve_claves_del_contrato(
        self,
        api_client,
        admin_headers,
        api_fake_company,
        admin_company,
        admin_pending_company,
    ):
        response = api_client.get("/admin/companies", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        expected_keys = {
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
        assert all(set(item) == expected_keys for item in data)
        by_id = {item["id"]: item for item in data}
        company = by_id[str(admin_company.id)]
        assert company["userId"] == str(api_fake_company.id)
        assert company["nameCompany"] == admin_company.nameCompany
        assert company["nit"] == admin_company.CompanyNIT
        assert company["email"] == api_fake_company.email
        pending = by_id[str(admin_pending_company.id)]
        assert pending["verified"] is False
        assert pending["isActive"] is False

    def test_toggle_company_status_exitoso(
        self, api_client, admin_headers, api_fake_company, admin_company, api_db_session
    ):
        first = api_client.patch(
            f"/admin/companies/{admin_company.id}/toggle-status",
            headers=admin_headers,
        )

        assert first.status_code == 200
        assert first.json() == {
            "message": "Empresa inhabilitada correctamente",
            "id": str(admin_company.id),
            "isActive": False,
        }

        second = api_client.patch(
            f"/admin/companies/{admin_company.id}/toggle-status",
            headers=admin_headers,
        )

        assert second.status_code == 200
        assert second.json()["message"] == "Empresa habilitada correctamente"
        assert second.json()["isActive"] is True

        api_db_session.refresh(api_fake_company)
        assert api_fake_company.isActive is True

    def test_toggle_company_status_inexistente_devuelve_404(
        self, api_client, admin_headers
    ):
        response = api_client.patch(
            f"/admin/companies/{uuid.uuid4()}/toggle-status",
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"

    def test_toggle_company_status_admin_devuelve_400(
        self, api_client, admin_headers, admin_user, api_db_session
    ):
        company = Company(
            user_id=admin_user.id,
            nameCompany="Admin Company",
            addressCompany="Calle Admin",
            CompanyNIT="900000001",
            CompanyNITDV="1",
            CompanyCertificate=None,
        )
        api_db_session.add(company)
        api_db_session.commit()
        api_db_session.refresh(company)

        response = api_client.patch(
            f"/admin/companies/{company.id}/toggle-status",
            headers=admin_headers,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "No se puede inhabilitar un administrador"

    def test_validate_company_exitoso(
        self, api_client, admin_headers, admin_pending_company, admin_pending_company_user, api_db_session
    ):
        response = api_client.patch(
            f"/admin/companies/{admin_pending_company.id}/validate",
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "Empresa validada correctamente",
            "id": str(admin_pending_company.id),
            "nameCompany": admin_pending_company.nameCompany,
            "verified": True,
            "isActive": True,
        }

        api_db_session.refresh(admin_pending_company_user)
        assert admin_pending_company_user.verified is True
        assert admin_pending_company_user.isActive is True

    def test_validate_company_inexistente_devuelve_404(
        self, api_client, admin_headers
    ):
        response = api_client.patch(
            f"/admin/companies/{uuid.uuid4()}/validate",
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"

    def test_list_pqrs_admin_devuelve_claves_y_usuario_desconocido(
        self, api_client, admin_headers, api_fake_user, api_db_session
    ):
        known = PQRS(
            type="queja",
            subject="Queja de prueba",
            description="Descripcion de la queja",
            status="pending",
            user_id=api_fake_user.id,
            user_role="user",
        )
        unknown = PQRS(
            type="peticion",
            subject="Peticion de prueba",
            description="Descripcion de la peticion",
            status="pending",
            user_id=uuid.uuid4(),
            user_role="user",
        )
        api_db_session.add_all([known, unknown])
        api_db_session.commit()
        api_db_session.refresh(known)
        api_db_session.refresh(unknown)

        response = api_client.get("/admin/pqrs", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        expected_keys = {
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
        assert all(set(item) == expected_keys for item in data)
        by_id = {item["id"]: item for item in data}
        assert by_id[str(known.id)]["user_name"] == api_fake_user.fullName
        assert by_id[str(known.id)]["user_email"] == api_fake_user.email
        assert by_id[str(unknown.id)]["user_name"] == "Desconocido"
        assert by_id[str(unknown.id)]["user_email"] == ""

    def test_resolve_pqrs_exitoso(
        self, api_client, admin_headers, api_fake_user, api_db_session
    ):
        pqrs = PQRS(
            type="reclamo",
            subject="Reclamo de prueba",
            description="Descripcion del reclamo",
            status="pending",
            user_id=api_fake_user.id,
            user_role="user",
        )
        api_db_session.add(pqrs)
        api_db_session.commit()
        api_db_session.refresh(pqrs)

        response = api_client.patch(
            f"/admin/pqrs/{pqrs.id}/status",
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "PQRS marcada como resuelta",
            "id": str(pqrs.id),
            "status": "resolved",
        }

        api_db_session.refresh(pqrs)
        assert pqrs.status == "resolved"

    def test_resolve_pqrs_inexistente_devuelve_404(
        self, api_client, admin_headers
    ):
        response = api_client.patch(
            f"/admin/pqrs/{uuid.uuid4()}/status",
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "PQRS no encontrada"

    def test_hallazgo_h6_error_interno_en_ruta_protegida_devuelve_401(
        self, api_client, admin_headers, monkeypatch
    ):
        # HALLAZGO H6: AuthMiddleware captura la excepcion interna y la devuelve
        # como 401 "Token invalido" en rutas protegidas; el endpoint no llega a 500.
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr("app.routers.AdminRouter._get_role_id", _fallar)

        response = api_client.get("/admin/dashboard/me", headers=admin_headers)

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"
