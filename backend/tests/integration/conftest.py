"""Fixtures de integración contra PostgreSQL real.

Se activan solo si TEST_DATABASE_URL está definida. Sin ella, los tests que
pidan db_session se saltan y la suite normal (SQLite en memoria) no cambia.

Aislamiento: una transacción por test y rollback al final. El modo
create_savepoint convierte los commit()/rollback() de la aplicación en
savepoints, de modo que el rollback del fixture siempre deshace todo.

Ojo: el fixture `seed` del conftest raíz sigue atado a SQLite. En esta carpeta
crea los datos con `db_session`, no con `seed`.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.database.Connection import Base, get_db
from app.main import app as fastapi_app
from app.models.ModelCompany import Company
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.services.authentication.JWTService import create_access_token

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _normalize_postgres_url(raw: str) -> str:
    if raw.startswith("postgres://"):
        return "postgresql+psycopg2://" + raw[len("postgres://"):]
    if raw.startswith("postgresql://"):
        return "postgresql+psycopg2://" + raw[len("postgresql://"):]
    return raw


def _test_database_url() -> str:
    raw = os.environ.get("TEST_DATABASE_URL", "").strip()
    if not raw:
        pytest.skip(
            "Define TEST_DATABASE_URL y levanta docker-compose.test.yml "
            "para correr los tests de integración."
        )

    url = _normalize_postgres_url(raw)
    parsed = make_url(url)

    if parsed.get_backend_name() != "postgresql":
        pytest.fail(
            f"TEST_DATABASE_URL debe ser PostgreSQL, no {parsed.get_backend_name()}."
        )

    if not (parsed.database or "").endswith("_test"):
        pytest.fail(
            f"La base '{parsed.database}' no termina en _test. "
            "Los tests de integración no deben apuntar a la BD de desarrollo."
        )

    return url


@pytest.fixture(scope="session")
def pg_engine():
    url = _test_database_url()
    engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 5},
    )

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except OperationalError as exc:
        engine.dispose()
        pytest.fail(
            "No se pudo conectar a la BD de pruebas. Desde la raíz del repo:\n"
            "  docker compose -f docker-compose.test.yml up -d --wait\n"
            f"Detalle: {exc}"
        )

    result = subprocess.run(
        [sys.executable, str(BACKEND_DIR / "scripts" / "init_test_db.py")],
        cwd=BACKEND_DIR,
        env={
            **os.environ,
            "TEST_DATABASE_URL": url,
            "PGCONNECT_TIMEOUT": "5",
        },
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        engine.dispose()
        pytest.fail(
            "Falló la creación del esquema con Alembic:\n"
            f"{result.stdout}\n{result.stderr}"
        )

    yield engine
    engine.dispose()


@pytest.fixture()
def pg_connection(pg_engine):
    with pg_engine.connect() as connection:
        transaction = connection.begin()
        try:
            yield connection
        finally:
            if transaction.is_active:
                transaction.rollback()


@pytest.fixture()
def db_session(pg_connection):
    session = Session(
        bind=pg_connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )
    try:
        yield session
    finally:
        session.close()


def _override_get_db(session):
    def _get_db():
        yield session

    return _get_db


@pytest.fixture()
def client(db_session):
    fastapi_app.dependency_overrides[get_db] = _override_get_db(db_session)
    try:
        yield TestClient(fastapi_app)
    finally:
        fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def error_client(db_session):
    fastapi_app.dependency_overrides[get_db] = _override_get_db(db_session)
    try:
        yield TestClient(fastapi_app, raise_server_exceptions=False)
    finally:
        fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def clean_database(pg_engine):
    """Trunca todas las tablas antes del test.

    Alternativa al rollback de db_session para tests que necesitan commits
    reales. No lo combines con db_session en el mismo test.
    """
    tables = [
        f'"{table.name}"'
        for table in Base.metadata.sorted_tables
        if table.name != "alembic_version"
    ]
    if tables:
        with pg_engine.begin() as connection:
            connection.execute(
                text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE")
            )
    yield


@pytest.fixture()
def rol_user(db_session):
    role = Role(name="user")
    db_session.add(role)
    db_session.commit()
    return role


@pytest.fixture()
def empresa(db_session):
    role = Role(name="company")
    db_session.add(role)
    db_session.flush()

    user = Users(
        fullName="Dueño Empresa",
        email="empresa-postgres@lubix.com",
        hashed_password="hash-de-prueba",
        tell="3001234567",
        verified=True,
        isActive=True,
        role_id=role.id,
    )
    db_session.add(user)
    db_session.flush()

    company = Company(
        nameCompany="Empresa Postgres",
        addressCompany="Calle 1 # 2-3",
        CompanyNIT="900123456",
        CompanyNITDV="1",
        user_id=user.id,
    )
    db_session.add(company)
    db_session.commit()

    return user, company


@pytest.fixture()
def headers_empresa(empresa):
    user, _ = empresa
    token = create_access_token(str(user.id), "company")
    return {"Authorization": f"Bearer {token}"}