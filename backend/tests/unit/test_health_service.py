import pytest

from app.services.health.HealthService import HealthReport, HealthService

pytestmark = pytest.mark.unit


def test_health_service_reporta_ok_cuando_la_bd_esta_disponible():
    service = HealthService(lambda: True, "production")

    report = service.check()

    assert report == HealthReport(
        status="ok",
        service="lubix-api",
        environment="production",
        database="ok",
    )
    assert report.to_dict() == {
        "status": "ok",
        "service": "lubix-api",
        "environment": "production",
        "database": "ok",
    }


def test_health_service_reporta_no_disponible_cuando_la_bd_falla():
    service = HealthService(lambda: False, "production")

    report = service.check()

    assert report.status == "unavailable"
    assert report.database == "error"
    assert report.service == "lubix-api"
    assert report.environment == "production"


def test_health_service_respeta_nombre_de_servicio():
    service = HealthService(lambda: True, "staging", service="lubix-worker")

    assert service.check().service == "lubix-worker"
