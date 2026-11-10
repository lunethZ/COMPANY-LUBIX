import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestAuthRouter:
    """Tests for /auth endpoints."""

    def test_register_user_success(self, api_client, _mock_external_services):
        """POST /auth/register-user -> 200 with success message."""
        payload = {
            "fullName": "John Doe",
            "email": "john@example.com",
            "password": "TestPass123",
            "tell": "1234567890",
        }
        response = api_client.post("/auth/register-user", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "registrado correctamente" in data["message"]
        _mock_external_services["email_send"].assert_called_once()

    def test_register_user_duplicate_email(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/register-user -> 409 when email already exists."""
        payload = {
            "fullName": "Another User",
            "email": api_fake_user.email,
            "password": "TestPass123",
            "tell": "1234567890",
        }
        response = api_client.post("/auth/register-user", json=payload)
        assert response.status_code == 409
        data = response.json()
        assert "correo en uso" in data["detail"].lower()

    def test_register_user_validation_error(self, api_client):
        """POST /auth/register-user -> 422 with validation errors."""
        payload = {
            "fullName": "Jo",
            "email": "invalid-email",
            "password": "weak",
            "tell": "123",
        }
        response = api_client.post("/auth/register-user", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        errors = data["detail"]
        # Check that validation errors are returned for each field
        error_msgs = " ".join(str(e) for e in errors).lower()
        assert "3 caracteres" in error_msgs or "fullname" in error_msgs
        assert "email" in error_msgs or "correo" in error_msgs or "válido" in error_msgs
        assert "8 caracteres" in error_msgs or "password" in error_msgs

    def test_register_company_success(self, api_client, _mock_external_services):
        """POST /auth/register-company -> 200 with company data."""
        from io import BytesIO
        files = {
            "certificate": ("test.pdf", BytesIO(b"fake pdf content"), "application/pdf"),
        }
        data = {
            "fullName": "Company Admin",
            "email": "company@example.com",
            "password": "TestPass123",
            "tell": "1234567890",
            "companyName": "Test Company S.A.S",
            "companyAddress": "Calle 123",
            "companyNIT": "900999999",
            "companyNITDV": "7",
        }
        response = api_client.post("/auth/register-company", data=data, files=files)
        assert response.status_code == 200
        resp_data = response.json()
        assert "message" in resp_data
        assert "certificate_url" in resp_data
        assert "company_name" in resp_data
        assert "company_nit" in resp_data
        _mock_external_services["minio"].assert_called_once()
        _mock_external_services["email_company"].assert_called_once()

    def test_register_company_duplicate_nit(self, api_client, api_fake_company, _mock_external_services):
        """POST /auth/register-company -> 409 when NIT already exists."""
        from io import BytesIO
        files = {
            "certificate": ("test.pdf", BytesIO(b"fake pdf content"), "application/pdf"),
        }
        data = {
            "fullName": "Another Admin",
            "email": "another@example.com",
            "password": "TestPass123",
            "tell": "1234567890",
            "companyName": "Another Company",
            "companyAddress": "Calle 456",
            "companyNIT": "900123456",
            "companyNITDV": "7",
        }
        response = api_client.post("/auth/register-company", data=data, files=files)
        assert response.status_code == 409
        resp_data = response.json()
        assert "nit en uso" in resp_data["detail"].lower()

    def test_verify_email_success(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/verify-email-user -> 200 when code is valid."""
        _mock_external_services["email_verify"].return_value = True
        payload = {"email": api_fake_user.email, "code": "123456"}
        response = api_client.post("/auth/verify-email-user", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["verified"] is True
        assert "verificado correctamente" in data["message"].lower()

    def test_verify_email_invalid_code(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/verify-email-user -> 400 when code is invalid."""
        _mock_external_services["email_verify"].return_value = False
        payload = {"email": api_fake_user.email, "code": "000000"}
        response = api_client.post("/auth/verify-email-user", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "incorrecto o expirado" in data["detail"].lower()
        _mock_external_services["email_send"].assert_called_once()

    def test_verify_email_wrong_email(self, api_client, _mock_external_services):
        """POST /auth/verify-email-user -> 400 when email not registered."""
        payload = {"email": "nonexistent@example.com", "code": "123456"}
        response = api_client.post("/auth/verify-email-user", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "correo incorrecto" in data["detail"].lower()

    def test_resend_verification_success(self, api_client, api_db_session, _mock_external_services):
        """POST /auth/resend-verification -> 200 (tested once, endpoint duplicated in router)."""
        from app.models.ModelUser import Users
        from app.utils.Security import hash_password
        from app.models.ModelRole import Role

        # Create unverified user (api_fake_user is already verified)
        user_role = api_db_session.query(Role).filter(Role.name == "user").first()
        user = Users(
            fullName="Unverified User",
            email="unverified_resend@example.com",
            hashed_password=hash_password("TestPass123"),
            tell="1234567890",
            role_id=user_role.id,
            verified=False,
            isActive=True,
        )
        api_db_session.add(user)
        api_db_session.commit()

        payload = {"email": user.email}
        response = api_client.post("/auth/resend-verification", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "enviado" in data["message"].lower()
        _mock_external_services["email_send"].assert_called_once()

    def test_resend_verification_not_registered(self, api_client, _mock_external_services):
        """POST /auth/resend-verification -> 400 when email not registered."""
        payload = {"email": "nonexistent@example.com"}
        response = api_client.post("/auth/resend-verification", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "no registrado" in data["detail"].lower()

    def test_login_user_success(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/login-user -> 200 with TokenResponse."""
        payload = {"email": api_fake_user.email, "password": "TestPass123"}
        response = api_client.post("/auth/login-user", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "user"
        assert data["id"] == str(api_fake_user.id)
        assert data["Nombre"] == api_fake_user.fullName
        assert data["email"] == api_fake_user.email

    def test_login_user_wrong_password(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/login-user -> 400 when password is wrong."""
        payload = {"email": api_fake_user.email, "password": "WrongPass123"}
        response = api_client.post("/auth/login-user", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "contraseña incorrecta" in data["detail"].lower()

    def test_login_user_nonexistent(self, api_client, _mock_external_services):
        """POST /auth/login-user -> 400 when user doesn't exist."""
        payload = {"email": "nonexistent@example.com", "password": "TestPass123"}
        response = api_client.post("/auth/login-user", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "correo o contraseña incorrectos" in data["detail"].lower()

    def test_login_user_company_forbidden(self, api_client, api_fake_company, _mock_external_services):
        """POST /auth/login-user -> 403 when account is company."""
        payload = {"email": api_fake_company.email, "password": "TestPass123"}
        response = api_client.post("/auth/login-user", json=payload)
        assert response.status_code == 403
        data = response.json()
        assert "empresa" in data["detail"].lower()

    def test_login_user_unverified(self, api_client, api_db_session, _mock_external_services):
        """POST /auth/login-user -> 200 with resend message when user not verified."""
        from app.models.ModelUser import Users
        from app.utils.Security import hash_password
        from app.models.ModelRole import Role

        user_role = api_db_session.query(Role).filter(Role.name == "user").first()

        user = Users(
            fullName="Unverified User",
            email="unverified@example.com",
            hashed_password=hash_password("TestPass123"),
            tell="1234567890",
            role_id=user_role.id,
            verified=False,
            isActive=True,
        )
        api_db_session.add(user)
        api_db_session.commit()

        payload = {"email": user.email, "password": "TestPass123"}
        response = api_client.post("/auth/login-user", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "no ha sido verificado" in data["message"].lower()
        _mock_external_services["email_send"].assert_called_once()

    def test_login_company_success(self, api_client, api_fake_company, _mock_external_services):
        """POST /auth/login-company -> 200 with TokenResponse."""
        payload = {"email": api_fake_company.email, "password": "TestPass123"}
        response = api_client.post("/auth/login-company", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["role"] == "company"

    def test_login_company_wrong_password(self, api_client, api_fake_company, _mock_external_services):
        """POST /auth/login-company -> 400 when password is wrong."""
        payload = {"email": api_fake_company.email, "password": "WrongPass123"}
        response = api_client.post("/auth/login-company", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "contraseña incorrecta" in data["detail"].lower()

    def test_login_company_not_company(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/login-company -> 403 when account is not company."""
        payload = {"email": api_fake_user.email, "password": "TestPass123"}
        response = api_client.post("/auth/login-company", json=payload)
        assert response.status_code == 403
        data = response.json()
        assert "no es de empresa" in data["detail"].lower()

    def test_forgot_password_success(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/forgot-password-user -> 200."""
        payload = {"email": api_fake_user.email}
        response = api_client.post("/auth/forgot-password-user", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "recuperación" in data["message"].lower()
        _mock_external_services["email_send"].assert_called_once()

    def test_forgot_password_not_registered(self, api_client, _mock_external_services):
        """POST /auth/forgot-password-user -> 400 when email not registered."""
        payload = {"email": "nonexistent@example.com"}
        response = api_client.post("/auth/forgot-password-user", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "no registrado" in data["detail"].lower()

    def test_reset_password_success(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/reset-password-user -> 200."""
        _mock_external_services["email_verify"].return_value = True
        payload = {"email": api_fake_user.email, "code": "123456", "new_password": "NewPass123"}
        response = api_client.post("/auth/reset-password-user", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "restablecida correctamente" in data["message"].lower()

    def test_reset_password_invalid_code(self, api_client, api_fake_user, _mock_external_services):
        """POST /auth/reset-password-user -> 400 when code is invalid."""
        _mock_external_services["email_verify"].return_value = False
        payload = {"email": api_fake_user.email, "code": "000000", "new_password": "NewPass123"}
        response = api_client.post("/auth/reset-password-user", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "incorrecto o expirado" in data["detail"].lower()

    def test_refresh_token_success(self, api_client, api_fake_user, api_db_session, _mock_external_services):
        """POST /auth/refresh -> 200 with new TokenResponse."""
        from app.models.ModelRefreshToken import RefreshToken
        from app.services.authentication.JWTService import create_refresh_token
        from datetime import datetime, timedelta

        refresh_token = create_refresh_token(user_id=str(api_fake_user.id))
        db_token = RefreshToken(
            token=refresh_token,
            revoked=False,
            user_id=api_fake_user.id,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        api_db_session.add(db_token)
        api_db_session.commit()

        payload = {"old_refresh_token": refresh_token}
        response = api_client.post("/auth/refresh", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "user"

    def test_refresh_token_invalid(self, api_client, _mock_external_services):
        """POST /auth/refresh -> 401 when refresh token is invalid."""
        payload = {"old_refresh_token": "invalid.token.here"}
        response = api_client.post("/auth/refresh", json=payload)
        assert response.status_code == 401
        data = response.json()
        assert "inválido o expirado" in data["detail"].lower()

    def test_refresh_token_revoked(self, api_client, api_fake_user, api_db_session, _mock_external_services):
        """POST /auth/refresh -> 401 when refresh token is revoked."""
        from app.models.ModelRefreshToken import RefreshToken
        from app.services.authentication.JWTService import create_refresh_token
        from datetime import datetime, timedelta

        refresh_token = create_refresh_token(user_id=str(api_fake_user.id))
        db_token = RefreshToken(
            token=refresh_token,
            revoked=True,
            user_id=api_fake_user.id,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        api_db_session.add(db_token)
        api_db_session.commit()

        payload = {"old_refresh_token": refresh_token}
        response = api_client.post("/auth/refresh", json=payload)
        assert response.status_code == 401
        data = response.json()
        assert "revocada" in data["detail"].lower()

    def test_refresh_token_expired(self, api_client, api_fake_user, api_db_session, _mock_external_services):
        """POST /auth/refresh -> 401 when refresh token is expired."""
        from app.models.ModelRefreshToken import RefreshToken
        from app.services.authentication.JWTService import create_refresh_token
        from datetime import datetime, timedelta

        refresh_token = create_refresh_token(user_id=str(api_fake_user.id))
        db_token = RefreshToken(
            token=refresh_token,
            revoked=False,
            user_id=api_fake_user.id,
            expires_at=datetime.utcnow() - timedelta(days=1),
        )
        api_db_session.add(db_token)
        api_db_session.commit()

        payload = {"old_refresh_token": refresh_token}
        response = api_client.post("/auth/refresh", json=payload)
        assert response.status_code == 401
        data = response.json()
        assert "expirada" in data["detail"].lower()

    def test_logout_success(self, api_client, api_fake_user, api_db_session, _mock_external_services):
        """POST /auth/logout -> 200."""
        from app.models.ModelRefreshToken import RefreshToken
        from app.services.authentication.JWTService import create_refresh_token
        from datetime import datetime, timedelta

        refresh_token = create_refresh_token(user_id=str(api_fake_user.id))
        db_token = RefreshToken(
            token=refresh_token,
            revoked=False,
            user_id=api_fake_user.id,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        api_db_session.add(db_token)
        api_db_session.commit()

        payload = {"refresh_token": refresh_token}
        response = api_client.post("/auth/logout", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "cerrada correctamente" in data["message"].lower()

        api_db_session.refresh(db_token)
        assert db_token.revoked is True

    def test_logout_no_token(self, api_client, _mock_external_services):
        """POST /auth/logout -> 200 even without token (idempotent)."""
        response = api_client.post("/auth/logout", json={})
        assert response.status_code == 200
        data = response.json()
        assert "message" in data