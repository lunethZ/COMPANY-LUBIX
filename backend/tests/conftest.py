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
import uuid
from types import SimpleNamespace
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
from app.models.ModelCompany import Company  # noqa: E402
from app.models.ModelRefreshToken import RefreshToken  # noqa: E402
from app.models.ModelRole import Role  # noqa: E402
from app.models.ModelUser import Users  # noqa: E402
from app.services.authentication import AuthService  # noqa: E402
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
                    obj.id = uuid.uuid4()
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
            "id": uuid.uuid4(),
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
