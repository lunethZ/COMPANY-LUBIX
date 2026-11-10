import sys
from unittest.mock import MagicMock, patch, AsyncMock

# Mock minio BEFORE any other imports (root conftest patches minio.Minio, not sys.modules)
_mock_minio = MagicMock()
_mock_minio.Minio = MagicMock()
_mock_minio.Minio.bucket_exists = MagicMock(return_value=True)
_mock_minio.Minio.make_bucket = MagicMock()
_mock_minio.Minio.put_object = MagicMock(return_value=None)
_mock_minio.Minio.get_object = MagicMock(return_value=MagicMock(read=MagicMock(return_value=b"data")))
_mock_minio.Minio.presigned_get_object = MagicMock(return_value="https://presigned.url")
_mock_minio.Minio.remove_object = MagicMock(return_value=None)
_mock_minio.error = MagicMock()
_mock_minio.error.S3Error = type("S3Error", (Exception,), {})

if "minio" in sys.modules:
    del sys.modules["minio"]
if "minio.error" in sys.modules:
    del sys.modules["minio.error"]
sys.modules["minio"] = _mock_minio
sys.modules["minio.error"] = _mock_minio.error

# Patch UUID bind processors BEFORE importing models (so model column types get patched)
import uuid as uuid_lib
from sqlalchemy import UUID
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

print("[CONFTEST] Patching UUID bind processors...")

original_bind_processor = UUID.bind_processor
def patched_bind_processor(self, dialect):
    orig_proc = original_bind_processor(self, dialect)
    def process(value):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                # For SQLite, store UUID as 32-char hex (no hyphens)
                if dialect.name == 'sqlite':
                    return uuid_lib.UUID(value).hex
                return uuid_lib.UUID(value).bytes_le
            except ValueError:
                return value
        return orig_proc(value)
    return process
UUID.bind_processor = patched_bind_processor

original_pg_bind_processor = PG_UUID.bind_processor
def patched_pg_bind_processor(self, dialect):
    orig_proc = original_pg_bind_processor(self, dialect)
    def process(value):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                if dialect.name == 'sqlite':
                    return uuid_lib.UUID(value).hex
                return uuid_lib.UUID(value).bytes_le
            except ValueError:
                return value
        return orig_proc(value)
    return process
PG_UUID.bind_processor = patched_pg_bind_processor

print("[CONFTEST] UUID bind processors patched.")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.Connection import get_db, Base
from app.Config import config
from app.models.ModelUser import Users
from app.models.ModelRole import Role
from app.models.ModelRefreshToken import RefreshToken
from app.services.authentication.JWTService import create_access_token, create_refresh_token
from app.utils.Security import hash_password


@pytest.fixture(scope="session", autouse=True)
def _patch_lifespan_and_config():
    """Patch lifespan to avoid real DB connection and seed on import."""
    config.RUN_SEED = False
    yield


@pytest.fixture(scope="function")
def api_db_engine():
    """SQLite in-memory engine for isolated tests."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=True,  # Enable SQL logging
    )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def api_db_session(api_db_engine):
    """Database session for a single test with default roles."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=api_db_engine)
    session = SessionLocal()
    try:
        # Create default roles
        user_role = Role(name="user")
        company_role = Role(name="company")
        admin_role = Role(name="admin")
        session.add_all([user_role, company_role, admin_role])
        session.commit()
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def api_client(api_db_session):
    """TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield api_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app, raise_server_exceptions=True)
    try:
        yield client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def api_fake_user(api_db_session):
    """Create a fake user in the test database."""
    user_role = api_db_session.query(Role).filter(Role.name == "user").first()

    user = Users(
        fullName="Test User",
        email="test@example.com",
        hashed_password=hash_password("TestPass123"),
        tell="1234567890",
        role_id=user_role.id,
        verified=True,
        isActive=True,
    )
    api_db_session.add(user)
    api_db_session.commit()
    api_db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def api_fake_company(api_db_session):
    """Create a fake company user in the test database."""
    company_role = api_db_session.query(Role).filter(Role.name == "company").first()

    user = Users(
        fullName="Test Company",
        email="company@example.com",
        hashed_password=hash_password("TestPass123"),
        tell="1234567890",
        role_id=company_role.id,
        verified=True,
        isActive=True,
    )
    api_db_session.add(user)
    api_db_session.flush()

    from app.models.ModelCompany import Company
    company = Company(
        user_id=user.id,
        nameCompany="Test Company S.A.S",
        addressCompany="Calle 123",
        CompanyNIT="900123456",
        CompanyNITDV="7",
        CompanyCertificate="certificates/test.pdf",
    )
    api_db_session.add(company)
    api_db_session.commit()
    api_db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def api_auth_headers_user(api_fake_user):
    """Authorization headers for a regular user."""
    access_token = create_access_token(user_id=str(api_fake_user.id), role="user")
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def api_auth_headers_company(api_fake_company):
    """Authorization headers for a company user."""
    access_token = create_access_token(user_id=str(api_fake_company.id), role="company")
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function", autouse=True)
def _mock_external_services():
    """Mock external services (MinIO, Email, Network) for all tests."""
    with patch("app.utils.CheckNetwork.check_internet_connection", return_value=True) as mock_net, \
         patch("app.services.authentication.AuthService.create_code_and_send_code", return_value={"email_sent": True}) as mock_email_send, \
         patch("app.services.authentication.AuthService.verify_code", return_value=True) as mock_email_verify, \
         patch("app.services.authentication.AuthService.EmailRegisterCompany", return_value=None) as mock_email_company, \
         patch("app.services.NasService.subir.upload_file", return_value={"success": True, "object_name": "test.jpg", "path": "test/path.jpg"}) as mock_minio:
        yield {
            "network": mock_net,
            "email_send": mock_email_send,
            "email_verify": mock_email_verify,
            "email_company": mock_email_company,
            "minio": mock_minio,
        }