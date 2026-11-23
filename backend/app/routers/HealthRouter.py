from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from app.Config import config
from app.services.health.HealthService import HealthService
from app.utils.CheckNetwork import check_internet_connection
from app.utils.TestDatabase import database_is_available, db_test

router = APIRouter(prefix="/health", tags=["health"])


def get_health_service() -> HealthService:
    return HealthService(
        database_probe=database_is_available,
        environment=config.ENVIRONMENT,
    )


@router.get("")
def health(service: HealthService = Depends(get_health_service)):
    report = service.check()
    payload = report.to_dict()
    if report.status != "ok":
        return JSONResponse(status_code=503, content=payload)
    return payload


@router.get("/database")
def healthDatabase():
    return db_test()


@router.get("/internet")
def healthInternet():
    if check_internet_connection():
        return {"message": "Conexión a Internet exitosa"}
    else:
        return {"message": "No se pudo establecer conexión a Internet"}
