import uuid
from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models.ModelCompany import Company
from app.models.ModelRefreshToken import RefreshToken
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.schemas.SchemaAuthCompany import LoginCompany, createCompany
from app.schemas.SchemaAuthUser import (
    ResetPassword,
    RefreshRequest,
    createUser,
    forgotPassword,
    userLogin,
    verifyEmail,
)
from app.services.authentication import AuthService


def user_payload(**overrides):
    data = {
        "fullName": "Ana Tester",
        "email": "ana.tester@lubix.com",
        "password": "Secreta123",
        "tell": "3001234567",
    }
    data.update(overrides)
    return createUser(**data)


def company_payload(**overrides):
    data = {
        "companyName": "Lubix Corp",
        "companyAddress": "Calle 1 # 2-3",
        "companyNIT": "900123456",
        "companyNITDV": "7",
    }
    data.update(overrides)
    return createCompany(**data)


def user_role():
    return SimpleNamespace(id=uuid.uuid4(), name="user")


def company_role():
    return SimpleNamespace(id=uuid.uuid4(), name="company")


def expect_http_error(func, *args, status_code, detail_contains=None):
    with pytest.raises(HTTPException) as exc:
        func(*args)
    assert exc.value.status_code == status_code
    if detail_contains is not None:
        assert detail_contains in exc.value.detail
    return exc.value


class TestRegisterUser:
    def test_email_en_uso_devuelve_409(self, fake_db, make_user):
        db = fake_db(Users=make_user(email="ocupado@lubix.com"))

        expect_http_error(
            AuthService.register_user_service,
            user_payload(email="ocupado@lubix.com"),
            db,
            status_code=409,
            detail_contains="correo en uso",
        )
        assert db.rollbacks == 0
        assert db.commits == 0

    def test_registro_exitoso_guarda_hash_y_envia_codigo(
        self, fake_db, make_user, password_doubles, code_spy
    ):
        db = fake_db(Role=user_role())
        payload = user_payload()

        result = AuthService.register_user_service(payload, db)

        assert "Usuario registrado correctamente" in result["message"]
        assert db.commits == 1
        assert password_doubles["hash"] == ["Secreta123"]

        created = db.rows[Users]
        assert created.email == payload.email
        assert created.hashed_password == "hashed::Secreta123"
        assert created.verified is False

        assert len(code_spy) == 1
        assert code_spy[0]["email"] == payload.email
        assert code_spy[0]["code_type"] == "verifyEmail"
        assert code_spy[0]["user_id"] == created.id

    def test_fallo_de_base_de_datos_hace_rollback_y_500(
        self, fake_db, make_user, password_doubles, code_spy, monkeypatch
    ):
        db = fake_db(Role=user_role())

        def boom():
            raise RuntimeError("conexion perdida")

        monkeypatch.setattr(db, "commit", boom)

        expect_http_error(
            AuthService.register_user_service,
            user_payload(),
            db,
            status_code=500,
            detail_contains="Error al crear cuenta",
        )
        assert db.rollbacks == 1
        assert code_spy == []


class TestRegisterCompany:
    def test_sin_rol_company_devuelve_409(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.register_company_service,
            user_payload(),
            company_payload(),
            {"path": "/files/cert.pdf"},
            db,
            status_code=409,
            detail_contains="Ups no hay rol para empresa",
        )

    def test_nit_en_uso_devuelve_409(self, fake_db):
        db = fake_db(
            Role=company_role(),
            Company=SimpleNamespace(CompanyNIT="900123456"),
        )

        expect_http_error(
            AuthService.register_company_service,
            user_payload(),
            company_payload(),
            {"path": "/files/cert.pdf"},
            db,
            status_code=409,
            detail_contains="NIT en uso",
        )

    def test_email_en_uso_devuelve_409(self, fake_db, make_user):
        db = fake_db(
            Role=company_role(),
            Users=make_user(email="ocupado@lubix.com"),
        )

        expect_http_error(
            AuthService.register_company_service,
            user_payload(email="ocupado@lubix.com"),
            company_payload(),
            {"path": "/files/cert.pdf"},
            db,
            status_code=409,
            detail_contains="Correo en uso",
        )

    def test_registro_exitoso_crea_empresa_y_envia_correo(
        self, fake_db, password_doubles, company_email_spy
    ):
        db = fake_db(Role=company_role())
        payload = user_payload()
        company = company_payload()

        result = AuthService.register_company_service(
            payload, company, {"path": "/files/cert.pdf"}, db
        )

        assert result["company_name"] == "Lubix Corp"
        assert result["company_nit"] == "900123456"
        assert result["certificate_url"] == "/files/cert.pdf"
        assert db.commits == 1

        created_company = db.rows[Company]
        assert created_company.CompanyNIT == "900123456"
        assert created_company.user_id is not None

        assert company_email_spy == [
            {"to": payload.email, "name": "Lubix Corp", "nit": "900123456"}
        ]


class TestLoginUser:
    def test_email_inexistente_devuelve_400(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.login_user_service,
            userLogin(email="nadie@lubix.com", password="Secreta123"),
            db,
            status_code=400,
            detail_contains="Correo o contraseña incorrectos",
        )

    def test_password_incorrecta_devuelve_400(self, fake_db, make_user, password_doubles):
        db = fake_db(Users=make_user())

        expect_http_error(
            AuthService.login_user_service,
            userLogin(email="ana.tester@lubix.com", password="OtraClave9"),
            db,
            status_code=400,
            detail_contains="Contraseña incorrecta",
        )

    def test_cuenta_de_empresa_devuelve_403(self, fake_db, make_user, password_doubles):
        db = fake_db(Users=make_user(role_name="company"))

        expect_http_error(
            AuthService.login_user_service,
            userLogin(email="ana.tester@lubix.com", password="Secreta123"),
            db,
            status_code=403,
            detail_contains="cuenta es de empresa",
        )

    def test_usuario_no_verificado_pide_reenviar_codigo(
        self, fake_db, make_user, password_doubles, code_spy
    ):
        db = fake_db(Users=make_user(verified=False))

        result = AuthService.login_user_service(
            userLogin(email="ana.tester@lubix.com", password="Secreta123"), db
        )

        assert "no ha sido verificado" in result["message"]
        assert "access_token" not in result
        assert len(code_spy) == 1
        assert code_spy[0]["code_type"] == "verifyEmail"

    def test_login_exitoso_devuelve_tokens_y_guarda_refresh(
        self, fake_db, make_user, password_doubles
    ):
        user = make_user()
        db = fake_db(Users=user)

        result = AuthService.login_user_service(
            userLogin(email=user.email, password="Secreta123"), db
        )

        assert result.token_type == "bearer"
        assert result.role == "user"
        assert result.id == str(user.id)
        assert result.Nombre == user.fullName
        assert result.email == user.email

        saved = db.rows[RefreshToken]
        assert isinstance(saved, RefreshToken)
        assert saved.token == result.refresh_token
        assert saved.revoked is False
        assert saved.expires_at > datetime.utcnow()

        from jose import jwt
        from app.Config import config

        payload = jwt.decode(
            result.access_token, config.SECRET_KEY, algorithms=[config.ALGORITHM]
        )
        assert payload["sub"] == str(user.id)
        assert payload["role"] == "user"
        assert payload["type"] == "access"


class TestLoginCompany:
    def test_email_inexistente_devuelve_400(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.login_company_service,
            LoginCompany(email="nadie@lubix.com", password="Secreta123"),
            db,
            status_code=400,
            detail_contains="Correo o contraseña incorrectos",
        )

    def test_password_incorrecta_devuelve_400(self, fake_db, make_user, password_doubles):
        db = fake_db(Users=make_user(role_name="company"))

        expect_http_error(
            AuthService.login_company_service,
            LoginCompany(email="ana.tester@lubix.com", password="MalaClave9"),
            db,
            status_code=400,
            detail_contains="Contraseña incorrecta",
        )

    def test_cuenta_de_usuario_comun_devuelve_403(
        self, fake_db, make_user, password_doubles
    ):
        db = fake_db(Users=make_user(role_name="user"))

        expect_http_error(
            AuthService.login_company_service,
            LoginCompany(email="ana.tester@lubix.com", password="Secreta123"),
            db,
            status_code=403,
            detail_contains="Esta cuenta no es de empresa",
        )

    def test_empresa_sin_registro_en_tabla_company_devuelve_403(
        self, fake_db, make_user, password_doubles
    ):
        db = fake_db(Users=make_user(role_name="company"))

        expect_http_error(
            AuthService.login_company_service,
            LoginCompany(email="ana.tester@lubix.com", password="Secreta123"),
            db,
            status_code=403,
            detail_contains="Cuenta de empresa no encontrada",
        )

    def test_empresa_no_verificada_pide_reenviar_codigo(
        self, fake_db, make_user, password_doubles, code_spy
    ):
        user = make_user(role_name="company", verified=False)
        db = fake_db(Users=user, Company=SimpleNamespace(user_id=user.id))

        result = AuthService.login_company_service(
            LoginCompany(email=user.email, password="Secreta123"), db
        )

        assert "no ha sido verificado" in result["message"]
        assert "access_token" not in result
        assert len(code_spy) == 1

    def test_login_exitoso_devuelve_tokens_de_empresa(
        self, fake_db, make_user, password_doubles
    ):
        user = make_user(role_name="company")
        db = fake_db(Users=user, Company=SimpleNamespace(user_id=user.id))

        result = AuthService.login_company_service(
            LoginCompany(email=user.email, password="Secreta123"), db
        )

        assert result.role == "company"
        assert result.access_token
        assert result.refresh_token
        assert result.id == str(user.id)
        assert db.rows[RefreshToken].token == result.refresh_token


class TestForgotAndResetPassword:
    def test_forgot_con_email_no_registrado_devuelve_400(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.forgot_password_service,
            forgotPassword(email="nadie@lubix.com"),
            db,
            status_code=400,
            detail_contains="Correo no registrado",
        )

    def test_forgot_exitoso_envia_codigo(self, fake_db, make_user, code_spy):
        user = make_user()
        db = fake_db(Users=user)

        result = AuthService.forgot_password_service(
            forgotPassword(email=user.email), db
        )

        assert "código de recuperación" in result["message"]
        assert code_spy[0]["code_type"] == "resetPassword"
        assert code_spy[0]["email"] == user.email

    def test_reset_con_email_no_registrado_devuelve_400(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.reset_password_service,
            ResetPassword(
                email="nadie@lubix.com", code="123456", new_password="NuevaClave1"
            ),
            db,
            status_code=400,
            detail_contains="Correo no registrado",
        )

    def test_reset_con_codigo_invalido_devuelve_400(
        self, fake_db, make_user, verify_code_stub
    ):
        verify_code_stub["result"] = False
        user = make_user()
        db = fake_db(Users=user)

        expect_http_error(
            AuthService.reset_password_service,
            ResetPassword(email=user.email, code="000000", new_password="NuevaClave1"),
            db,
            status_code=400,
            detail_contains="Código de recuperación de contraseña incorrecto",
        )
        assert verify_code_stub["calls"][0]["code"] == "000000"

    def test_reset_exitoso_reemplaza_el_password(
        self, fake_db, make_user, password_doubles, verify_code_stub
    ):
        verify_code_stub["result"] = True
        user = make_user()
        db = fake_db(Users=user)

        result = AuthService.reset_password_service(
            ResetPassword(email=user.email, code="123456", new_password="NuevaClave1"),
            db,
        )

        assert "Contraseña restablecida" in result["message"]
        assert user.hashed_password == "hashed::NuevaClave1"
        assert password_doubles["hash"] == ["NuevaClave1"]
        assert db.commits == 1


class TestVerifyEmail:
    def test_email_inexistente_devuelve_400(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.verify_email_service,
            verifyEmail(email="nadie@lubix.com", code="123456"),
            db,
            status_code=400,
            detail_contains="Correo incorrecto",
        )

    def test_codigo_invalido_devuelve_400_y_reenvia(
        self, fake_db, make_user, code_spy, verify_code_stub
    ):
        verify_code_stub["result"] = False
        user = make_user(verified=False)
        db = fake_db(Users=user)

        expect_http_error(
            AuthService.verify_email_service,
            verifyEmail(email=user.email, code="000000"),
            db,
            status_code=400,
            detail_contains="Código de verificación incorrecto o expirado",
        )
        assert len(code_spy) == 1
        assert code_spy[0]["code_type"] == "verifyEmail"
        assert db.commits == 0

    def test_codigo_correcto_marca_verificado(
        self, fake_db, make_user, verify_code_stub
    ):
        verify_code_stub["result"] = True
        user = make_user(verified=False)
        db = fake_db(Users=user)

        result = AuthService.verify_email_service(
            verifyEmail(email=user.email, code="123456"), db
        )

        assert result["verified"] is True
        assert user.verified is True
        assert db.commits == 1


class TestResendVerification:
    def test_email_inexistente_devuelve_400(self, fake_db):
        db = fake_db()

        expect_http_error(
            AuthService.resend_verification_service,
            "nadie@lubix.com",
            db,
            status_code=400,
            detail_contains="Correo no registrado",
        )

    def test_ya_verificado_devuelve_400(self, fake_db, make_user):
        user = make_user(verified=True)
        db = fake_db(Users=user)

        expect_http_error(
            AuthService.resend_verification_service,
            user.email,
            db,
            status_code=400,
            detail_contains="El correo ya ha sido verificado",
        )

    def test_reenvio_exitoso(self, fake_db, make_user, code_spy):
        user = make_user(verified=False)
        db = fake_db(Users=user)

        result = AuthService.resend_verification_service(user.email, db)

        assert "nuevo código de verificación" in result["message"]
        assert len(code_spy) == 1
        assert code_spy[0]["email"] == user.email


class TestLogout:
    def test_logout_revoca_el_token(self, fake_db):
        stored = SimpleNamespace(token="tok-1", revoked=False)
        db = fake_db(RefreshToken=stored)

        result = AuthService.logout_service("tok-1", db)

        assert "Sesión cerrada correctamente" in result["message"]
        assert stored.revoked is True
        assert db.commits == 1

    def test_logout_sin_token_en_bd_no_falla(self, fake_db):
        db = fake_db()

        result = AuthService.logout_service("desconocido", db)

        assert "Sesión cerrada correctamente" in result["message"]
        assert db.commits == 0

    def test_logout_sin_token_no_hace_nada(self, fake_db):
        db = fake_db()

        result = AuthService.logout_service("", db)

        assert "Sesión cerrada correctamente" in result["message"]
        assert db.commits == 0


class TestRefreshToken:
    def _stub(self, monkeypatch, payload):
        monkeypatch.setattr(AuthService, "verify_token", lambda token: payload)

    def test_token_expirado_devuelve_401(self, fake_db, monkeypatch):
        self._stub(monkeypatch, "expired")
        db = fake_db()

        expect_http_error(
            AuthService.refresh_token_service,
            RefreshRequest(old_refresh_token="tok"),
            db,
            status_code=401,
            detail_contains="Refresh token inválido o expirado",
        )

    def test_token_de_tipo_access_devuelve_401(self, fake_db, monkeypatch):
        self._stub(monkeypatch, {"sub": "1", "type": "access"})
        db = fake_db()

        expect_http_error(
            AuthService.refresh_token_service,
            RefreshRequest(old_refresh_token="tok"),
            db,
            status_code=401,
            detail_contains="Token incorrecto",
        )

    def test_usuario_inexistente_devuelve_401(self, fake_db, monkeypatch):
        self._stub(monkeypatch, {"sub": "no-existe", "type": "refresh"})
        db = fake_db()

        expect_http_error(
            AuthService.refresh_token_service,
            RefreshRequest(old_refresh_token="tok"),
            db,
            status_code=401,
            detail_contains="Usuario no encontrado",
        )

    def test_sesion_no_guardada_devuelve_401(
        self, fake_db, make_user, monkeypatch
    ):
        user = make_user()
        self._stub(monkeypatch, {"sub": str(user.id), "type": "refresh"})
        db = fake_db(Users=user)

        expect_http_error(
            AuthService.refresh_token_service,
            RefreshRequest(old_refresh_token="tok"),
            db,
            status_code=401,
            detail_contains="Sesión no encontrada",
        )

    def test_sesion_revocada_devuelve_401(self, fake_db, make_user, monkeypatch):
        user = make_user()
        self._stub(monkeypatch, {"sub": str(user.id), "type": "refresh"})
        db = fake_db(
            Users=user,
            RefreshToken=SimpleNamespace(token="tok", revoked=True),
        )

        expect_http_error(
            AuthService.refresh_token_service,
            RefreshRequest(old_refresh_token="tok"),
            db,
            status_code=401,
            detail_contains="Sesión revocada",
        )

    def test_sesion_expirada_devuelve_401(self, fake_db, make_user, monkeypatch):
        user = make_user()
        self._stub(monkeypatch, {"sub": str(user.id), "type": "refresh"})
        db = fake_db(
            Users=user,
            RefreshToken=SimpleNamespace(
                token="tok", revoked=False, expires_at=datetime.utcnow() - timedelta(days=1)
            ),
        )

        expect_http_error(
            AuthService.refresh_token_service,
            RefreshRequest(old_refresh_token="tok"),
            db,
            status_code=401,
            detail_contains="Sesión expirada",
        )

    def test_refresh_exitoso_rota_los_tokens(self, fake_db, make_user, monkeypatch):
        user = make_user()
        old_token = SimpleNamespace(
            token="tok-viejo",
            revoked=False,
            expires_at=datetime.utcnow() + timedelta(days=7),
            user_id=user.id,
        )
        self._stub(monkeypatch, {"sub": str(user.id), "type": "refresh"})
        db = fake_db(Users=user, RefreshToken=old_token)

        result = AuthService.refresh_token_service(
            RefreshRequest(old_refresh_token="tok-viejo"), db
        )

        assert result.role == "user"
        assert result.access_token
        assert result.refresh_token != "tok-viejo"
        assert old_token.revoked is True
        assert db.rows[RefreshToken].token == result.refresh_token
        assert db.rows[RefreshToken] is not old_token
        assert db.commits >= 2
