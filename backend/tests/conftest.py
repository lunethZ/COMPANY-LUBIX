import os
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
import pytest

# 1. Configura el entorno ANTES de importar cualquier módulo de app
os.environ["URL_DATABASE"] = "sqlite:///:memory:"
os.environ.setdefault("SECRET_KEY", "lubix-test-secret")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("REFRESH_TOKEN_DAYS", "7")
os.environ.setdefault("GMAIL_USERNAME", "tests@lubix.test")
os.environ.setdefault("GMAIL_APP_PASSWORD", "dummy")
os.environ.setdefault("URL_FRONTEND", "http://localhost:5173")

# 2. Imports de la app (después de configurar las variables de entorno)
from app.models.ModelCompany import Company
from app.models.ModelRefreshToken import RefreshToken
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.services.authentication import AuthService

MODEL_KEYS = {"Users": Users, "Role": Role, "Company": Company, "RefreshToken": RefreshToken}

# 3. Configuración de Minio (de tu feature branch)
_minio_patcher = None

def pytest_configure(config):
    global _minio_patcher
    
    mock_minio = MagicMock()
    mock_minio.Minio = MagicMock()
    mock_minio.Minio.bucket_exists = MagicMock(return_value=True)
    mock_minio.Minio.make_bucket = MagicMock()
    mock_minio.Minio.put_object = MagicMock(return_value=None)
    mock_minio.Minio.get_object = MagicMock(return_value=MagicMock(read=MagicMock(return_value=b"data")))
    mock_minio.Minio.presigned_get_object = MagicMock(return_value="https://presigned.url")
    mock_minio.Minio.remove_object = MagicMock(return_value=None)
    
    mock_minio.error = MagicMock()
    mock_minio.error.S3Error = type("S3Error", (Exception,), {})
    
    if "minio" in sys.modules:
        del sys.modules["minio"]
    if "minio.error" in sys.modules:
        del sys.modules["minio.error"]
    
    sys.modules["minio"] = mock_minio
    sys.modules["minio.error"] = mock_minio.error

# 4. Clases y Fixtures de Develop
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
