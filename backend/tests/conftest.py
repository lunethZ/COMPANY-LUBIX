"""Fixtures base para las pruebas del backend.

Las pruebas NO usan PostgreSQL ni MinIO: la base de datos es SQLite en memoria
y MinIO se reemplaza por un doble de prueba. Por eso lo primero que hace este
archivo es preparar el entorno, antes de importar la aplicación.

Fixtures disponibles:
    db_session    sesión de SQLite en memoria con las tablas base creadas
    client        TestClient de FastAPI conectado a db_session
    test_user     usuario de prueba (rol "user") guardado en la base
    auth_headers  encabezado Authorization con un access token de test_user
"""
import os
from unittest.mock import MagicMock

import pytest

# 1) Variables de entorno que exige app.Config. Se fuerzan (no se usa setdefault)
#    para que las pruebas nunca apunten a una base de datos real definida en .env.
os.environ.update(
    {
        "URL_DATABASE": "sqlite://",
        "SECRET_KEY": "clave-solo-para-pruebas",
        "ALGORITHM": "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "60",
        "REFRESH_TOKEN_DAYS": "7",
        "URL_FRONTEND": "http://localhost:5173",
        "MINIO_ROOT_USER": "test",
        "MINIO_ROOT_PASSWORD": "test",
        "GMAIL_USERNAME": "test@example.com",
        "GMAIL_APP_PASSWORD": "test",
        "ADMIN_DEFAULT": "admin@example.com",
        "PASSWORD_DEFAULT": "Admin123!",
        "RUN_SEED": "false",
    }
)

# 2) app.services.NasService se conecta a MinIO al importarse. Se reemplaza el
#    cliente por un doble para poder importar la aplicación sin ese servicio.
import minio  # noqa: E402

_minio_falso = MagicMock()
_minio_falso.bucket_exists.return_value = True
minio.Minio = MagicMock(return_value=_minio_falso)

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database.Connection import Base, get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.models.ModelPQRS import PQRS  # noqa: E402
from app.models.ModelRole import Role  # noqa: E402
from app.models.ModelUser import Users  # noqa: E402
from app.services.authentication.JWTService import create_access_token  # noqa: E402
from app.utils.Security import hash_password  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

# Tablas que se crean en cada prueba. Si una prueba necesita otras (productos,
# carrito, etc.), agrégalas aquí junto con las que dependan de ellas por clave foránea.
TABLAS_BASE = [Role.__table__, Users.__table__, PQRS.__table__]


@pytest.fixture()
def db_session():
    """Sesión de SQLite en memoria; se crea y se destruye en cada prueba."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine, tables=TABLAS_BASE)
    session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine, tables=TABLAS_BASE)
        engine.dispose()


@pytest.fixture()
def client(db_session):
    """Cliente de FastAPI que usa db_session en lugar de la base real."""

    def _get_db_de_prueba():
        db = sessionmaker(
            autocommit=False, autoflush=False, bind=db_session.get_bind()
        )()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = _get_db_de_prueba
    # No se usa "with TestClient(...)": así no se ejecuta el lifespan (seed).
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()


@pytest.fixture()
def test_user(db_session):
    """Usuario de prueba con rol "user" guardado en la base."""
    role = Role(name="user")
    db_session.add(role)
    db_session.flush()

    user = Users(
        fullName="Usuario de Prueba",
        email="usuario.prueba@example.com",
        hashed_password=hash_password("Prueba123!"),
        tell="3000000000",
        verified=True,
        role_id=role.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(test_user):
    """Encabezado Authorization con un access token válido de test_user."""
    token = create_access_token(str(test_user.id), "user")
    return {"Authorization": f"Bearer {token}"}
