# Este router se encarga de manejar las rutas relacionadas
# con la salud del sistema.
from fastapi import APIRouter
from app.utils.TestDatabase import db_test
from app.utils.CheckNetwork import check_internet_connection

router = APIRouter(
    prefix=("/health"),
    tags=["health"]
)


@router.get("/database")
def healthDatabase():
    return db_test()


@router.get("/internet")
def healthInternet():
    if check_internet_connection():
        return {"message": "Conexión a Internet exitosa"}
    else:
        return {"message": "No se pudo establecer conexión a Internet"}