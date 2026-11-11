import pytest
from pydantic import ValidationError

from app.routers.PQRSRouter import (
    ASUNTO_MAX,
    ASUNTO_MIN,
    MENSAJE_MAX,
    MENSAJE_MIN,
    CreatePQRSRequest,
)

pytestmark = pytest.mark.unit

ASUNTO_VALIDO = "Problema con mi pedido"
MENSAJE_VALIDO = "El producto llegó con la caja dañada."


def crear(subject=ASUNTO_VALIDO, description=MENSAJE_VALIDO, type="queja"):
    return CreatePQRSRequest(type=type, subject=subject, description=description)


def test_acepta_asunto_y_mensaje_validos():
    data = crear()

    assert data.subject == ASUNTO_VALIDO
    assert data.description == MENSAJE_VALIDO


@pytest.mark.parametrize("largo", [ASUNTO_MIN, ASUNTO_MAX])
def test_acepta_asunto_en_los_limites(largo):
    assert len(crear(subject="a" * largo).subject) == largo


@pytest.mark.parametrize("largo", [0, ASUNTO_MIN - 1, ASUNTO_MAX + 1])
def test_rechaza_asunto_fuera_de_rango(largo):
    with pytest.raises(ValidationError) as error:
        crear(subject="a" * largo)

    assert "subject" in str(error.value)


@pytest.mark.parametrize("largo", [MENSAJE_MIN, MENSAJE_MAX])
def test_acepta_mensaje_en_los_limites(largo):
    assert len(crear(description="a" * largo).description) == largo


@pytest.mark.parametrize("largo", [0, MENSAJE_MIN - 1, MENSAJE_MAX + 1])
def test_rechaza_mensaje_fuera_de_rango(largo):
    with pytest.raises(ValidationError) as error:
        crear(description="a" * largo)

    assert "description" in str(error.value)


def test_rechaza_asunto_y_mensaje_formados_solo_por_espacios():
    with pytest.raises(ValidationError):
        crear(subject="     ")
    with pytest.raises(ValidationError):
        crear(description=" " * 20)


def test_quita_espacios_al_inicio_y_al_final():
    data = crear(subject="  Hola mundo  ", description="  " + MENSAJE_VALIDO + "  ")

    assert data.subject == "Hola mundo"
    assert data.description == MENSAJE_VALIDO
