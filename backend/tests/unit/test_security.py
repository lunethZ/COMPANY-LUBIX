import pytest

from app.utils.Security import hash_password, verify_password

pytestmark = pytest.mark.unit


def test_hash_password_no_guarda_la_contrasena_en_texto_plano():
    hashed = hash_password("Prueba123!")

    assert hashed != "Prueba123!"
    assert hashed.startswith("$2")


def test_verify_password_acepta_la_contrasena_correcta():
    hashed = hash_password("Prueba123!")

    assert verify_password("Prueba123!", hashed) is True


def test_verify_password_rechaza_una_contrasena_incorrecta():
    hashed = hash_password("Prueba123!")

    assert verify_password("OtraClave456!", hashed) is False
