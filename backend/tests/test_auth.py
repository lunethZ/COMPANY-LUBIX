"""Tests de los endpoints de autenticación (/auth)."""

from app.models.ModelUser import Users


REGISTER_PAYLOAD = {
    "fullName": "Persona Nueva",
    "email": "nuevo@lubix.com",
    "password": "Secreta1!",
    "tell": "3009998877",
}


# --------------------------------------------------------------------------- #
# Registro de usuario
# --------------------------------------------------------------------------- #
def test_register_user_devuelve_200_y_mensaje(client, seed):
    seed.roles("user")

    response = client.post("/auth/register-user", json=REGISTER_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message"}
    assert "Usuario registrado correctamente" in body["message"]

    with seed.session() as session:
        user = session.query(Users).filter(Users.email == REGISTER_PAYLOAD["email"]).first()
        assert user is not None
        assert user.verified is False
        assert user.hashed_password != REGISTER_PAYLOAD["password"]


def test_register_user_con_datos_invalidos_devuelve_422(client, seed):
    seed.roles("user")
    payload = {**REGISTER_PAYLOAD, "password": "123"}

    response = client.post("/auth/register-user", json=payload)

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list) and detail
    assert detail[0]["loc"][-1] == "password"
    assert "msg" in detail[0]


def test_register_user_correo_en_uso_devuelve_409(client, seed):
    seed.roles("user")
    seed.user(email=REGISTER_PAYLOAD["email"])

    response = client.post("/auth/register-user", json=REGISTER_PAYLOAD)

    assert response.status_code == 409
    assert response.json() == {"detail": "correo en uso"}


def test_register_user_fallo_al_generar_codigo_devuelve_500(client, seed, monkeypatch):
    seed.roles("user")
    monkeypatch.setattr(
        "app.services.authentication.AuthService.create_code_and_send_code",
        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("smtp caído")),
    )

    response = client.post("/auth/register-user", json=REGISTER_PAYLOAD)

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al crear cuenta"}


# --------------------------------------------------------------------------- #
# Login de usuario
# --------------------------------------------------------------------------- #
def test_login_user_devuelve_tokens_y_forma_completa(client, seed):
    seed.user(email="activo@lubix.com")

    response = client.post(
        "/auth/login-user",
        json={"email": "activo@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "access_token",
        "refresh_token",
        "token_type",
        "role",
        "id",
        "Nombre",
        "email",
    }
    assert body["role"] == "user"
    assert body["token_type"] == "bearer"
    assert body["Nombre"] == "Usuario de Prueba"
    assert body["email"] == "activo@lubix.com"
    assert body["access_token"].count(".") == 2
    assert body["refresh_token"].count(".") == 2


def test_login_user_correo_inexistente_devuelve_400(client, seed):
    seed.roles("user")

    response = client.post(
        "/auth/login-user", json={"email": "nadie@lubix.com", "password": "Secreta1!"}
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Correo o contraseña incorrectos"}


def test_login_user_password_incorrecta_devuelve_400(client, seed):
    seed.user(email="activo@lubix.com")

    response = client.post(
        "/auth/login-user", json={"email": "activo@lubix.com", "password": "OtraClave1"}
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Contraseña incorrecta"}


def test_login_user_cuenta_empresa_devuelve_403(client, seed):
    seed.company(email="empresa@lubix.com")

    response = client.post(
        "/auth/login-user",
        json={"email": "empresa@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 403
    assert "empresa" in response.json()["detail"].lower()


def test_login_user_sin_verificar_devuelve_mensaje_sin_token(client, seed):
    seed.user(email="pendiente@lubix.com", verified=False)

    response = client.post(
        "/auth/login-user",
        json={"email": "pendiente@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 200
    body = response.json()
    assert "access_token" not in body
    assert "message" in body
    assert "no ha sido verificado" in body["message"]


def test_login_user_payload_invalido_devuelve_422(client, seed):
    seed.roles("user")

    response = client.post("/auth/login-user", json={"email": "no-es-correo"})

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


# --------------------------------------------------------------------------- #
# Login de empresa
# --------------------------------------------------------------------------- #
def test_login_company_devuelve_tokens(client, seed):
    seed.company(email="empresa@lubix.com")

    response = client.post(
        "/auth/login-company",
        json={"email": "empresa@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "company"
    assert body["access_token"]
    assert body["refresh_token"]


def test_login_company_con_cuenta_de_usuario_devuelve_403(client, seed):
    seed.user(email="usuario@lubix.com")

    response = client.post(
        "/auth/login-company",
        json={"email": "usuario@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 403
    assert "no es de empresa" in response.json()["detail"]


def test_login_company_sin_registro_de_empresa_devuelve_403(client, seed):
    # Rol company pero sin fila en la tabla company (cuenta sin aprobar).
    seed.user(email="sin-empresa@lubix.com", role="company")

    response = client.post(
        "/auth/login-company",
        json={"email": "sin-empresa@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 403
    assert "no encontrada" in response.json()["detail"]


def test_login_company_correo_inexistente_devuelve_400(client, seed):
    seed.roles("company")

    response = client.post(
        "/auth/login-company",
        json={"email": "nadie@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Correo o contraseña incorrectos"}


# --------------------------------------------------------------------------- #
# Verificación de correo
# --------------------------------------------------------------------------- #
def test_verify_email_devuelve_200_y_marcara_verificado(client, seed):
    user = seed.user(email="pendiente@lubix.com", verified=False)
    seed.code(user, code="123456")

    response = client.post(
        "/auth/verify-email-user",
        json={"email": "pendiente@lubix.com", "code": "123456"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["verified"] is True
    assert "message" in body

    with seed.session() as session:
        stored = session.query(Users).filter(Users.email == "pendiente@lubix.com").first()
        assert stored.verified is True


def test_verify_email_codigo_incorrecto_devuelve_400(client, seed):
    user = seed.user(email="pendiente@lubix.com", verified=False)
    seed.code(user, code="123456")

    response = client.post(
        "/auth/verify-email-user",
        json={"email": "pendiente@lubix.com", "code": "999999"},
    )

    assert response.status_code == 400
    assert "incorrecto o expirado" in response.json()["detail"]


def test_verify_email_correo_inexistente_devuelve_400(client, seed):
    seed.roles("user")

    response = client.post(
        "/auth/verify-email-user",
        json={"email": "nadie@lubix.com", "code": "123456"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Correo incorrecto"}


def test_verify_email_codigo_mal_formado_devuelve_422(client, seed):
    seed.roles("user")

    response = client.post(
        "/auth/verify-email-user",
        json={"email": "nadie@lubix.com", "code": "abc"},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "code"


def test_resend_verification_devuelve_200(client, seed):
    seed.user(email="pendiente@lubix.com", verified=False)

    response = client.post("/auth/resend-verification", json={"email": "pendiente@lubix.com"})

    assert response.status_code == 200
    assert "message" in response.json()


def test_resend_verification_correo_inexistente_devuelve_400(client, seed):
    seed.roles("user")

    response = client.post("/auth/resend-verification", json={"email": "nadie@lubix.com"})

    assert response.status_code == 400
    assert response.json() == {"detail": "Correo no registrado"}


def test_resend_verification_ya_verificado_devuelve_400(client, seed):
    seed.user(email="listo@lubix.com", verified=True)

    response = client.post("/auth/resend-verification", json={"email": "listo@lubix.com"})

    assert response.status_code == 400
    assert response.json() == {"detail": "El correo ya ha sido verificado"}


# --------------------------------------------------------------------------- #
# Recuperación de contraseña
# --------------------------------------------------------------------------- #
def test_forgot_password_devuelve_200(client, seed):
    seed.user(email="activo@lubix.com")

    response = client.post("/auth/forgot-password-user", json={"email": "activo@lubix.com"})

    assert response.status_code == 200
    assert "message" in response.json()


def test_forgot_password_correo_inexistente_devuelve_400(client, seed):
    seed.roles("user")

    response = client.post("/auth/forgot-password-user", json={"email": "nadie@lubix.com"})

    assert response.status_code == 400
    assert response.json() == {"detail": "Correo no registrado"}


def test_reset_password_devuelve_200_y_permite_nuevo_login(client, seed):
    user = seed.user(email="activo@lubix.com")
    seed.code(user, code="654321", kind="resetPassword")

    response = client.post(
        "/auth/reset-password-user",
        json={
            "email": "activo@lubix.com",
            "code": "654321",
            "new_password": "NuevaClave1",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Contraseña restablecida correctamente"}

    login = client.post(
        "/auth/login-user",
        json={"email": "activo@lubix.com", "password": "NuevaClave1"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()


def test_reset_password_codigo_incorrecto_devuelve_400(client, seed):
    user = seed.user(email="activo@lubix.com")
    seed.code(user, code="654321", kind="resetPassword")

    response = client.post(
        "/auth/reset-password-user",
        json={
            "email": "activo@lubix.com",
            "code": "111111",
            "new_password": "NuevaClave1",
        },
    )

    assert response.status_code == 400
    assert "incorrecto o expirado" in response.json()["detail"]


def test_reset_password_password_debil_devuelve_422(client, seed):
    user = seed.user(email="activo@lubix.com")
    seed.code(user, code="654321", kind="resetPassword")

    response = client.post(
        "/auth/reset-password-user",
        json={"email": "activo@lubix.com", "code": "654321", "new_password": "123"},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "new_password"


# --------------------------------------------------------------------------- #
# Refresh y logout
# --------------------------------------------------------------------------- #
def _login(client, email="activo@lubix.com"):
    return client.post(
        "/auth/login-user", json={"email": email, "password": "Secreta1!"}
    ).json()


def test_refresh_devuelve_nuevos_tokens(client, seed):
    seed.user(email="activo@lubix.com")
    tokens = _login(client)

    response = client.post(
        "/auth/refresh", json={"old_refresh_token": tokens["refresh_token"]}
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "access_token",
        "refresh_token",
        "token_type",
        "role",
        "id",
        "Nombre",
        "email",
    }
    assert body["role"] == "user"
    assert body["access_token"].count(".") == 2
    assert body["refresh_token"].count(".") == 2


def test_refresh_con_token_invalido_devuelve_401(client, seed):
    seed.roles("user")

    response = client.post("/auth/refresh", json={"old_refresh_token": "token.raro"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Refresh token inválido o expirado"}


def test_refresh_con_access_token_devuelve_401(client, seed):
    seed.user(email="activo@lubix.com")
    tokens = _login(client)

    response = client.post("/auth/refresh", json={"old_refresh_token": tokens["access_token"]})

    assert response.status_code == 401
    assert response.json() == {"detail": "Token incorrecto"}


def test_logout_devuelve_200_aunque_el_token_no_exista(client, seed):
    seed.roles("user")

    response = client.post("/auth/logout", json={"refresh_token": "no-existe"})

    assert response.status_code == 200
    assert response.json() == {"message": "Sesión cerrada correctamente"}


def test_logout_revoca_el_refresh_token(client, seed):
    seed.user(email="activo@lubix.com")
    tokens = _login(client)

    assert client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]}).status_code == 200

    refresh = client.post(
        "/auth/refresh", json={"old_refresh_token": tokens["refresh_token"]}
    )
    assert refresh.status_code == 401
    assert refresh.json() == {"detail": "Sesión revocada"}
