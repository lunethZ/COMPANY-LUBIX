from unittest.mock import MagicMock

import pytest

from app.database.Connection import get_db
from app.main import app as fastapi_app
from app.routers.PQRSRouter import ASUNTO_MAX, MENSAJE_MAX

pytestmark = pytest.mark.api

ASUNTO_VALIDO = "Problema con mi pedido"
MENSAJE_VALIDO = "El producto llegó con la caja dañada."


def cuerpo(**cambios):
    datos = {"type": "queja", "subject": ASUNTO_VALIDO, "description": MENSAJE_VALIDO}
    datos.update(cambios)
    return datos


@pytest.fixture()
def db_falsa(client):
    """Reemplaza la base de datos por un doble para probar el caso válido.

    El router guarda el id del usuario como texto y SQLite no lo acepta en una
    columna UUID, así que el caso válido se prueba sin base de datos real.
    """
    db = MagicMock()
    fastapi_app.dependency_overrides[get_db] = lambda: db
    return db


def campos_con_error(response):
    return {item["loc"][-1] for item in response.json()["detail"]}


@pytest.mark.parametrize("asunto", ["", "ab", "a" * (ASUNTO_MAX + 1)])
def test_asunto_fuera_de_rango_devuelve_422(client, auth_headers, asunto):
    response = client.post("/pqrs", json=cuerpo(subject=asunto), headers=auth_headers)

    assert response.status_code == 422
    assert campos_con_error(response) == {"subject"}


@pytest.mark.parametrize("mensaje", ["", "corto", "a" * (MENSAJE_MAX + 1)])
def test_mensaje_fuera_de_rango_devuelve_422(client, auth_headers, mensaje):
    response = client.post("/pqrs", json=cuerpo(description=mensaje), headers=auth_headers)

    assert response.status_code == 422
    assert campos_con_error(response) == {"description"}


def test_asunto_y_mensaje_invalidos_reportan_los_dos_campos(client, auth_headers):
    response = client.post(
        "/pqrs", json=cuerpo(subject="ab", description="corto"), headers=auth_headers
    )

    assert response.status_code == 422
    assert campos_con_error(response) == {"subject", "description"}


def test_asunto_y_mensaje_validos_crean_la_pqrs(client, auth_headers, db_falsa):
    response = client.post("/pqrs", json=cuerpo(), headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["message"] == "PQRS enviada correctamente"
    db_falsa.add.assert_called_once()
    db_falsa.commit.assert_called_once()


def test_la_pqrs_se_guarda_sin_espacios_sobrantes(client, auth_headers, db_falsa):
    response = client.post(
        "/pqrs",
        json=cuerpo(subject="  Hola mundo  "),
        headers=auth_headers,
    )

    assert response.status_code == 200
    guardada = db_falsa.add.call_args.args[0]
    assert guardada.subject == "Hola mundo"


def test_tipo_invalido_sigue_devolviendo_400(client, auth_headers, db_falsa):
    response = client.post("/pqrs", json=cuerpo(type="otro"), headers=auth_headers)

    assert response.status_code == 400
    db_falsa.add.assert_not_called()
