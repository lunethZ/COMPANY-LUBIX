"""
Configuración compartida de la suite de tests del backend.

Decisiones importantes:

1. **Sin servicios externos**: MinIO y el envío de correo se sustituyen por
   dobles de prueba, de modo que la suite corre sin Docker ni red.
2. **SQLite en memoria** en lugar de PostgreSQL: se sobreescribe la dependencia
   `get_db` con `app.dependency_overrides`, por lo que el código de la aplicación
   (routers, middleware, servicios) se ejecuta tal cual, solo cambia el motor.
3. **UUIDs**: las columnas declaradas como `postgresql.UUID` esperan objetos
   `uuid.UUID` cuando el dialecto no es PostgreSQL, pero el middleware pasa el
   `sub` del JWT como *string* (psycopg2 lo acepta sin más). Se emula ese
   comportamiento del driver para que SQLite se comporte igual que Postgres.
"""

from __future__ import annotations

import uuid as uuid_module
from contextlib import contextmanager

import minio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.sql import sqltypes

# --------------------------------------------------------------------------- #
# 1. Doblantes de red: la importación de NasService comprueba el bucket de
#    MinIO y cualquier subida/lectura tocaría la red. En tests no hay red.
# --------------------------------------------------------------------------- #
minio.Minio.bucket_exists = lambda self, bucket: True
minio.Minio.make_bucket = lambda self, bucket: None
minio.Minio.put_object = lambda self, *args, **kwargs: None


class FakeObjectStream:
    """Sustituye a la respuesta de `get_object` de MinIO."""

    def __init__(self, data: bytes = b"contenido-de-prueba"):
        self._data = data

    def read(self) -> bytes:
        return self._data

    def close(self) -> None:  # pragma: no cover - solo limpieza
        pass

    def release_conn(self) -> None:  # pragma: no cover - solo limpieza
        pass


# --------------------------------------------------------------------------- #
# 2. UUIDs: emula el comportamiento de psycopg2 (acepta strings) sobre SQLite.
# --------------------------------------------------------------------------- #
_original_bind_processor = sqltypes.Uuid.bind_processor


def _bind_processor_accepting_strings(self, dialect):
    process = _original_bind_processor(self, dialect)
    if process is None:
        return None

    def coerce(value):
        if isinstance(value, str):
            try:
                value = uuid_module.UUID(value)
            except ValueError:
                pass
        return process(value)

    return coerce


sqltypes.Uuid.bind_processor = _bind_processor_accepting_strings

# --------------------------------------------------------------------------- #
# 3. Importar la aplicación DESPUÉS de instalar los dobles.
# --------------------------------------------------------------------------- #
from app.database.Connection import Base, get_db  # noqa: E402
import app.models  # noqa: E402,F401
from app.main import app as fastapi_app  # noqa: E402
from app.services.authentication.JWTService import create_access_token  # noqa: E402
from app.utils.Security import hash_password  # noqa: E402
import app.models  # noqa: E402,F401

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def _override_get_db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


fastapi_app.dependency_overrides[get_db] = _override_get_db

# Hash único reutilizado: bcrypt es lento y solo interesa que coincida con
# PASSWORD para poder iniciar sesión desde cualquier test.
PASSWORD = "Secreta1!"
PASSWORD_HASH = hash_password(PASSWORD)


class Seed:
    """Fábrica de datos de prueba (roles, usuarios, empresas, productos...)."""

    def __init__(self, session_factory):
        self._session_factory = session_factory

    @contextmanager
    def session(self):
        session = self._session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    # -- helpers ----------------------------------------------------------- #
    def roles(self, *names: str) -> dict[str, object]:
        created = {}
        with self.session() as session:
            from app.models.ModelRole import Role

            for name in names:
                role = session.query(Role).filter(Role.name == name).first()
                if not role:
                    role = Role(name=name)
                    session.add(role)
                    session.flush()
                created[name] = role.id
        return created

    def user(
        self,
        *,
        email: str = "usuario@lubix.com",
        role: str = "user",
        full_name: str = "Usuario de Prueba",
        verified: bool = True,
        is_active: bool = True,
        password_hash: str | None = None,
    ):
        from app.models.ModelUser import Users

        role_ids = self.roles(role, "user", "company", "admin")
        with self.session() as session:
            user = Users(
                fullName=full_name,
                email=email,
                hashed_password=password_hash or PASSWORD_HASH,
                tell="3001234567",
                verified=verified,
                isActive=is_active,
                role_id=role_ids[role],
            )
            session.add(user)
            session.flush()
            session.expunge(user)
        # El rol se guarda aparte: la instancia queda desenganchada de la
        # sesión y `user.role` ya no podría cargarse de forma perezosa.
        user.role_name = role
        return user

    def company(
        self,
        *,
        email: str = "empresa@lubix.com",
        nit: str = "900111222",
        name: str = "Empresa Prueba",
        verified: bool = True,
    ):
        from app.models.ModelCompany import Company

        user = self.user(
            email=email,
            role="company",
            full_name="Dueño Empresa",
            verified=verified,
        )
        with self.session() as session:
            company = Company(
                user_id=user.id,
                nameCompany=name,
                addressCompany="Calle 1 # 2-3",
                CompanyNIT=nit,
                CompanyNITDV="1",
                CompanyCertificate="uploads/cert.txt",
            )
            session.add(company)
            session.flush()
            session.expunge(company)
        # Igual que en `user`: la instancia queda desenganchada y sin relación
        # cargable; `headers()` usa este atributo para firmar el JWT con el
        # rol "company" (si no, caería al "user" por defecto y la middleware
        # rechazaría las rutas /company/*).
        company.role_name = "company"
        return company

    def admin(self, *, email: str = "admin@lubix.com"):
        return self.user(email=email, role="admin", full_name="Administrador")

    def catalog(self, name: str = "Celulares"):
        from app.models.ModelProduct import Catalog

        with self.session() as session:
            catalog = Catalog(name=name)
            session.add(catalog)
            session.flush()
            session.expunge(catalog)
        return catalog

    def product(
        self,
        company,
        *,
        name: str = "Producto de Prueba",
        price: float = 1500.0,
        stock: int = 10,
        status: str = "active",
        catalog=None,
        images: list | None = None,
    ):
        from app.models.ModelProduct import Product

        with self.session() as session:
            product = Product(
                name=name,
                price=price,
                stock=stock,
                status=status,
                descripcion="Descripción de prueba",
                company_id=company.id,
                catalog_id=catalog.id if catalog else None,
                images=images if images is not None else ["/files/imagen.png"],
                technical_spec={"brand": "Marca"},
            )
            session.add(product)
            session.flush()
            session.expunge(product)
        return product

    def pqrs(
        self,
        user,
        *,
        kind: str = "queja",
        subject: str = "Asunto de prueba",
        user_role: str = "user",
        status: str = "pending",
    ):
        from app.models.ModelPQRS import PQRS

        with self.session() as session:
            pqrs = PQRS(
                type=kind,
                subject=subject,
                description="Descripción detallada de la solicitud",
                status=status,
                user_id=user.id,
                user_role=user_role,
            )
            session.add(pqrs)
            session.flush()
            session.expunge(pqrs)
        return pqrs

    def code(self, user, *, code: str = "123456", kind: str = "verifyEmail"):
        """Inserta un código de verificación / recuperación vigente."""
        from datetime import datetime, timedelta

        from app.models.ModelCode import Codes, typeCode

        with self.session() as session:
            entry = Codes(
                code=code,
                type=typeCode(kind),
                user_id=user.id,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=15),
            )
            session.add(entry)
            session.flush()
            session.expunge(entry)
        return entry

    # -- autenticación ----------------------------------------------------- #
    @staticmethod
    def headers(user, role: str | None = None) -> dict[str, str]:
        role_name = role or getattr(user, "role_name", "user")
        # El `sub` del JWT es siempre el id del *usuario*. Si nos pasan una
        # instancia de Company (u otro modelo con FK al usuario) usamos esa FK.
        sub = getattr(user, "user_id", None) or user.id
        token = create_access_token(str(sub), role_name)
        return {"Authorization": f"Bearer {token}"}


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #


@pytest.fixture()
def db():
    """Esquema limpio por test; devuelve la fábrica de sesiones."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield TestingSession
    Base.metadata.drop_all(engine)


@pytest.fixture()
def seed(db):
    return Seed(db)


@pytest.fixture()
def client(db):
    return TestClient(fastapi_app)


@pytest.fixture()
def error_client(db):
    """Cliente que devuelve el 500 en lugar de relanzar la excepción."""
    return TestClient(fastapi_app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def no_real_emails(monkeypatch):
    """Ningún test debe intentar enviar correo por SMTP."""
    monkeypatch.setattr(
        "app.services.email.SaveAndGenerateCode.EmailVerify",
        lambda *args, **kwargs: True,
    )
    monkeypatch.setattr(
        "app.services.email.SaveAndGenerateCode.EmailForgotPassword",
        lambda *args, **kwargs: True,
    )
    monkeypatch.setattr(
        "app.services.authentication.AuthService.EmailRegisterCompany",
        lambda *args,
        **kwargs: True,
    )


@pytest.fixture()
def internet_ok(monkeypatch):
    monkeypatch.setattr(
        "app.routers.HealthRouter.check_internet_connection", lambda: True
    )


@pytest.fixture()
def internet_fail(monkeypatch):
    monkeypatch.setattr(
        "app.routers.HealthRouter.check_internet_connection", lambda: False
    )
