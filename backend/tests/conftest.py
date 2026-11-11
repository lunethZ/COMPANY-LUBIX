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

import os
import uuid as uuid_module
from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import MagicMock

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
# 2b. Variables de entorno que exige app.Config. Se fuerzan para que las
#     pruebas nunca apunten a una base de datos real definida en .env.
# --------------------------------------------------------------------------- #
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

# --------------------------------------------------------------------------- #
# 3. Importar la aplicación DESPUÉS de instalar los dobles.
# --------------------------------------------------------------------------- #
from app.database.Connection import Base, get_db  # noqa: E402
import app.models  # noqa: E402,F401
from app.main import app as fastapi_app  # noqa: E402
from app.models.ModelCompany import Company  # noqa: E402
from app.models.ModelRefreshToken import RefreshToken  # noqa: E402
from app.models.ModelRole import Role  # noqa: E402
from app.models.ModelUser import Users  # noqa: E402
from app.services.authentication import AuthService  # noqa: E402
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
    # Se reinstala el override en cada test: alguna prueba (por ejemplo la de
    # validación de PQRS) lo reemplaza por un doble y debe quedar limpio después.
    fastapi_app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(fastapi_app)
    finally:
        fastapi_app.dependency_overrides.clear()


@pytest.fixture()
def error_client(db):
    """Cliente que devuelve el 500 en lugar de relanzar la excepción."""
    fastapi_app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(fastapi_app, raise_server_exceptions=False)
    finally:
        fastapi_app.dependency_overrides.clear()


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


# --------------------------------------------------------------------------- #
# 4. Fixtures de la suite S1/S2 (api e integration).
#    Reutilizan el mismo motor en memoria que el resto de la suite para que el
#    usuario creado por `test_user` sea visible desde la aplicación.
# --------------------------------------------------------------------------- #
@pytest.fixture()
def db_session(db):
    """Sesión de SQLite en memoria sobre el esquema creado por `db`."""
    session = db()
    try:
        yield session
    finally:
        session.close()


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


MODEL_KEYS = {
    "Users": Users,
    "Role": Role,
    "Company": Company,
    "RefreshToken": RefreshToken,
}


class FakeQuery:
    """Doble encadenable de Query: filter() es no-op y first() lee de las filas del FakeDB."""

    def __init__(self, db, model):
        self._db = db
        self._model = model

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._db.rows.get(self._model)

    def all(self):
        value = self._db.rows.get(self._model)
        if value is None:
            return []
        return list(value) if isinstance(value, list) else [value]

    def delete(self, synchronize_session=False):
        if self._db.rows.pop(self._model, None) is None:
            return 0
        self._db.deleted.append(self._model)
        return 1


class FakeDB:
    """Doble de Session de SQLAlchemy: filas por modelo + registro de add/commit/rollback.

    Uso: FakeDB({Users: usuario}) o FakeDB(Users=usuario).
    """

    def __init__(self, rows=None, **by_name):
        self.rows = dict(rows or {})
        for name, value in by_name.items():
            self.rows[MODEL_KEYS[name]] = value
        self.added = []
        self.deleted = []
        self.commits = 0
        self.rollbacks = 0

    def query(self, model):
        return FakeQuery(self, model)

    def add(self, obj):
        self.added.append(obj)
        if self.rows.get(type(obj)) is None:
            self.rows[type(obj)] = obj

    def _assign_ids(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                try:
                    obj.id = uuid_module.uuid4()
                except Exception:
                    obj.id = 1

    def flush(self):
        self._assign_ids()

    def refresh(self, obj):
        self._assign_ids()

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def delete(self, obj):
        self.deleted.append(obj)


@pytest.fixture
def fake_db():
    """Clase FakeDB para instanciar en cada test: fake_db(Users=usuario_existente)."""
    return FakeDB


@pytest.fixture
def make_user():
    """Fábrica de usuarios (SimpleNamespace) con la forma que consume AuthService."""

    def _make(role_name="user", **overrides):
        defaults = {
            "id": uuid_module.uuid4(),
            "fullName": "Ana Tester",
            "email": "ana.tester@lubix.com",
            "hashed_password": "hashed::Secreta123",
            "tell": "3001234567",
            "verified": True,
            "isActive": True,
            "role": SimpleNamespace(name=role_name),
        }
        defaults.update(overrides)
        return SimpleNamespace(**defaults)

    return _make


@pytest.fixture
def password_doubles(monkeypatch):
    """Dobles de hash_password/verify_password: sin bcrypt real, rápido y determinista."""
    calls = {"hash": [], "verify": []}

    def fake_hash(password):
        calls["hash"].append(password)
        return f"hashed::{password}"

    def fake_verify(plain_password, hashed_password):
        calls["verify"].append(plain_password)
        return hashed_password == f"hashed::{plain_password}"

    monkeypatch.setattr(AuthService, "hash_password", fake_hash)
    monkeypatch.setattr(AuthService, "verify_password", fake_verify)
    return calls


@pytest.fixture
def code_spy(monkeypatch):
    """Doble de create_code_and_send_code: no escribe en BD ni envía correo, solo registra."""
    calls = []

    def fake_create_code(database, user_id, email, code_type):
        calls.append({"user_id": user_id, "email": email, "code_type": code_type})
        return {"message": "Código enviado correctamente"}

    monkeypatch.setattr(AuthService, "create_code_and_send_code", fake_create_code)
    return calls


@pytest.fixture
def verify_code_stub(monkeypatch):
    """Doble de verify_code con resultado controlable: stub["result"] = False."""
    stub = {"result": True, "calls": []}

    def fake_verify_code(database, user_id, code, code_type):
        stub["calls"].append({"user_id": user_id, "code": code, "code_type": code_type})
        return stub["result"]

    monkeypatch.setattr(AuthService, "verify_code", fake_verify_code)
    return stub


@pytest.fixture
def company_email_spy(monkeypatch):
    """Doble de EmailRegisterCompany: no envía correo real, solo registra la llamada."""
    calls = []

    def fake_email(to_email, company_name, company_nit):
        calls.append({"to": to_email, "name": company_name, "nit": company_nit})
        return True

    monkeypatch.setattr(AuthService, "EmailRegisterCompany", fake_email)
    return calls
