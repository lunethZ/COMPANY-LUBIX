from datetime import datetime

import pytest

from app.models.ModelPQRS import PQRS


pytestmark = pytest.mark.api


def _cuerpo_pqrs(**cambios):
    datos = {
        "type": "queja",
        "subject": "Asunto de prueba",
        "description": "Descripcion valida para la PQRS",
    }
    datos.update(cambios)
    return datos


class TestPQRSRouter:
    def test_create_pqrs_exitoso_guarda_datos_limpios(
        self, api_client, api_auth_headers_user, api_fake_user, api_db_session
    ):
        response = api_client.post(
            "/pqrs",
            json=_cuerpo_pqrs(
                subject="  Asunto de prueba  ",
                description="  Descripcion valida para la PQRS  ",
            ),
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "PQRS enviada correctamente"
        assert data["id"]

        guardada = (
            api_db_session.query(PQRS)
            .filter(PQRS.id == data["id"])
            .first()
        )
        assert guardada is not None
        assert guardada.type == "queja"
        assert guardada.subject == "Asunto de prueba"
        assert guardada.description == "Descripcion valida para la PQRS"
        assert guardada.status == "pending"
        assert guardada.user_id == api_fake_user.id
        assert guardada.user_role == "user"

    def test_create_pqrs_como_empresa_guarda_el_rol(
        self, api_client, api_auth_headers_company, api_db_session
    ):
        response = api_client.post(
            "/pqrs",
            json=_cuerpo_pqrs(type="sugerencia"),
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200

        guardada = (
            api_db_session.query(PQRS)
            .filter(PQRS.id == response.json()["id"])
            .first()
        )
        assert guardada is not None
        assert guardada.user_role == "company"
        assert guardada.type == "sugerencia"

    def test_create_pqrs_tipo_invalido_devuelve_400(
        self, api_client, api_auth_headers_user, api_fake_user, api_db_session
    ):
        response = api_client.post(
            "/pqrs",
            json=_cuerpo_pqrs(type="otro"),
            headers=api_auth_headers_user,
        )

        assert response.status_code == 400
        assert "Tipo de PQRS" in response.json()["detail"]
        assert api_db_session.query(PQRS).count() == 0

    def test_create_pqrs_asunto_invalido_devuelve_422(
        self, api_client, api_auth_headers_user, api_fake_user, api_db_session
    ):
        response = api_client.post(
            "/pqrs",
            json=_cuerpo_pqrs(subject="ab"),
            headers=api_auth_headers_user,
        )

        assert response.status_code == 422
        campos = {item["loc"][-1] for item in response.json()["detail"]}
        assert campos == {"subject"}
        assert api_db_session.query(PQRS).count() == 0

    def test_create_pqrs_mensaje_invalido_devuelve_422(
        self, api_client, api_auth_headers_user, api_fake_user, api_db_session
    ):
        response = api_client.post(
            "/pqrs",
            json=_cuerpo_pqrs(description="corto"),
            headers=api_auth_headers_user,
        )

        assert response.status_code == 422
        campos = {item["loc"][-1] for item in response.json()["detail"]}
        assert campos == {"description"}
        assert api_db_session.query(PQRS).count() == 0

    def test_list_my_pqrs_vacio_devuelve_lista_vacia(
        self, api_client, api_auth_headers_user, api_fake_user
    ):
        response = api_client.get("/pqrs", headers=api_auth_headers_user)

        assert response.status_code == 200
        assert response.json() == []

    def test_list_my_pqrs_devuelve_solo_las_del_usuario_y_ordenadas(
        self,
        api_client,
        api_auth_headers_user,
        api_fake_user,
        api_fake_company,
        api_db_session,
    ):
        antigua = PQRS(
            type="peticion",
            subject="PQRS antigua",
            description="Descripcion de la PQRS antigua",
            status="pending",
            user_id=str(api_fake_user.id),
            user_role="user",
            created_at=datetime(2026, 1, 1, 10, 0, 0),
        )
        reciente = PQRS(
            type="reclamo",
            subject="PQRS reciente",
            description="Descripcion de la PQRS reciente",
            status="resolved",
            user_id=str(api_fake_user.id),
            user_role="user",
            created_at=datetime(2026, 1, 2, 10, 0, 0),
        )
        ajena = PQRS(
            type="queja",
            subject="PQRS de otra empresa",
            description="Descripcion de una PQRS ajena",
            status="pending",
            user_id=str(api_fake_company.id),
            user_role="company",
            created_at=datetime(2026, 1, 3, 10, 0, 0),
        )
        api_db_session.add_all([antigua, reciente, ajena])
        api_db_session.commit()
        api_db_session.refresh(antigua)
        api_db_session.refresh(reciente)
        api_db_session.refresh(ajena)

        response = api_client.get("/pqrs", headers=api_auth_headers_user)

        assert response.status_code == 200
        data = response.json()
        assert [item["id"] for item in data] == [
            str(reciente.id),
            str(antigua.id),
        ]
        assert data[0] == {
            "id": str(reciente.id),
            "type": "reclamo",
            "subject": "PQRS reciente",
            "description": "Descripcion de la PQRS reciente",
            "status": "resolved",
            "user_role": "user",
            "created_at": "2026-01-02T10:00:00",
        }

    def test_hallazgo_h6_error_interno_devuelve_401(
        self,
        api_client,
        api_auth_headers_user,
        api_fake_user,
        api_db_session,
        monkeypatch,
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.post(
            "/pqrs", json=_cuerpo_pqrs(), headers=api_auth_headers_user
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"
