REGISTER_USER_PAYLOAD = {
    "fullName": "Persona S5",
    "email": "s5-usuario@lubix.com",
    "password": "Secreta1!",
    "tell": "3007776666",
}

COMPANY_FORM = {
    "fullName": "Empresa S5",
    "email": "s5-empresa@lubix.com",
    "password": "Secreta1!",
    "tell": "3006665555",
    "companyName": "Lubix SAS",
    "companyAddress": "Calle 10 # 20",
    "companyNIT": "900555111",
    "companyNITDV": "7",
}


def _company_files():
    return {
        "certificate": (
            "certificado.pdf",
            b"contenido-certificado",
            "application/pdf",
        )
    }


def _assert_code_email(mock, email, code_type):
    mock.assert_called_once()
    args, kwargs = mock.call_args
    if len(args) == 3:
        assert args[2] == email
    else:
        assert len(args) == 2
        assert kwargs["email"] == email
    assert kwargs["code_type"] == code_type


def test_register_user_invoca_mock_de_correo_y_no_usar_smtp(client, seed, email_mocks):
    seed.roles("user")

    response = client.post("/auth/register-user", json=REGISTER_USER_PAYLOAD)

    assert response.status_code == 200
    assert set(response.json()) == {"message"}
    _assert_code_email(email_mocks.code, REGISTER_USER_PAYLOAD["email"], "verifyEmail")
    email_mocks.verify.assert_not_called()
    email_mocks.forgot.assert_not_called()
    email_mocks.smtp.assert_not_called()


def test_register_user_con_fallo_de_correo_devuelve_500(client, seed, email_mocks):
    seed.roles("user")
    email_mocks.code.side_effect = RuntimeError("smtp caído")

    response = client.post("/auth/register-user", json=REGISTER_USER_PAYLOAD)

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al crear cuenta"}
    email_mocks.code.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_register_company_sube_certificado_y_envia_correo(
    client, seed, email_mocks, storage_mocks
):
    seed.roles("company")
    certificate_path = "uploads/companies/900555111/certificates/certificado.pdf"
    storage_mocks.upload.return_value = {
        "success": True,
        "object_name": certificate_path,
        "path": certificate_path,
    }

    response = client.post(
        "/auth/register-company",
        data=COMPANY_FORM,
        files=_company_files(),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "message",
        "certificate_url",
        "company_name",
        "company_nit",
        "certificate",
    }
    assert body["certificate_url"] == certificate_path
    assert body["company_name"] == COMPANY_FORM["companyName"]
    assert body["company_nit"] == COMPANY_FORM["companyNIT"]

    storage_mocks.upload.assert_called_once()
    file_arg, path_arg = storage_mocks.upload.call_args.args
    assert path_arg == "companies/900555111/certificates/"
    assert file_arg.filename == "certificado.pdf"

    email_mocks.company.assert_called_once_with(
        COMPANY_FORM["email"],
        COMPANY_FORM["companyName"],
        COMPANY_FORM["companyNIT"],
    )
    email_mocks.smtp.assert_not_called()


def test_register_company_falla_si_el_certificado_no_se_sube(
    client, seed, email_mocks, storage_mocks
):
    seed.roles("company")
    storage_mocks.upload.return_value = {
        "success": False,
        "code": "AccessDenied",
        "message": "Access Denied.",
        "hint": "La Application Key necesita permiso Read and Write sobre el bucket.",
    }

    response = client.post(
        "/auth/register-company",
        data=COMPANY_FORM,
        files=_company_files(),
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert "No se pudo guardar el certificado" in detail
    assert "AccessDenied" in detail
    assert "Application Key" in detail
    email_mocks.company.assert_not_called()


def test_register_company_datos_invalidos_devuelve_400_con_detalle(client, seed):
    seed.roles("company")
    data = {**COMPANY_FORM, "companyNIT": "12ab5"}

    response = client.post(
        "/auth/register-company",
        data=data,
        files=_company_files(),
    )

    assert response.status_code == 400
    assert "solo números" in response.json()["detail"]


def test_register_company_commit_fallido_devuelve_500(    client, seed, email_mocks, storage_mocks, monkeypatch
):
    seed.roles("company")

    def boom(self):
        raise RuntimeError("base de datos caída")

    monkeypatch.setattr("sqlalchemy.orm.Session.commit", boom)

    response = client.post(
        "/auth/register-company",
        data=COMPANY_FORM,
        files=_company_files(),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al crear cuenta empresarial"}


def test_register_company_responde_200_aunque_falle_el_correo(
    client, seed, email_mocks, storage_mocks
):
    seed.roles("company")
    email_mocks.company.return_value = False

    response = client.post(
        "/auth/register-company",
        data=COMPANY_FORM,
        files=_company_files(),
    )

    assert response.status_code == 200
    storage_mocks.upload.assert_called_once()
    email_mocks.company.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_verify_email_valido_no_reenvia_correo(
    client, seed, email_mocks, verify_code_mock
):
    seed.user(email="s5-verificar@lubix.com")
    verify_code_mock.return_value = True

    response = client.post(
        "/auth/verify-email-user",
        json={"email": "s5-verificar@lubix.com", "code": "123456"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "verified": True,
        "message": "Correo electrónico verificado correctamente",
    }
    verify_code_mock.assert_called_once()
    assert verify_code_mock.call_args.kwargs["code_type"] == "verifyEmail"
    email_mocks.code.assert_not_called()
    email_mocks.smtp.assert_not_called()


def test_verify_email_codigo_invalido_reenvia_correo(
    client, seed, email_mocks, verify_code_mock
):
    seed.user(email="s5-invalido@lubix.com")
    verify_code_mock.return_value = False

    response = client.post(
        "/auth/verify-email-user",
        json={"email": "s5-invalido@lubix.com", "code": "000000"},
    )

    assert response.status_code == 400
    assert "Se ha enviado un nuevo código" in response.json()["detail"]
    _assert_code_email(email_mocks.code, "s5-invalido@lubix.com", "verifyEmail")
    email_mocks.smtp.assert_not_called()


def test_verify_email_con_fallo_de_correo_devuelve_500(
    error_client, seed, email_mocks, verify_code_mock
):
    seed.user(email="s5-verificar-error@lubix.com")
    verify_code_mock.return_value = False
    email_mocks.code.side_effect = RuntimeError("smtp caído")

    response = error_client.post(
        "/auth/verify-email-user",
        json={"email": "s5-verificar-error@lubix.com", "code": "000000"},
    )

    assert response.status_code == 500
    email_mocks.code.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_resend_verification_invoca_mock_de_correo(client, seed, email_mocks):
    seed.user(email="s5-reenvio@lubix.com", verified=False)

    response = client.post(
        "/auth/resend-verification",
        json={"email": "s5-reenvio@lubix.com"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Se ha enviado un nuevo código de verificación a tu correo electrónico."
    }
    _assert_code_email(email_mocks.code, "s5-reenvio@lubix.com", "verifyEmail")
    email_mocks.smtp.assert_not_called()


def test_resend_verification_con_fallo_de_correo_devuelve_500(
    error_client, seed, email_mocks
):
    seed.user(email="s5-reenvio-error@lubix.com", verified=False)
    email_mocks.code.side_effect = RuntimeError("smtp caído")

    response = error_client.post(
        "/auth/resend-verification",
        json={"email": "s5-reenvio-error@lubix.com"},
    )

    assert response.status_code == 500
    email_mocks.code.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_login_user_sin_verificar_invoca_mock_de_correo(client, seed, email_mocks):
    seed.user(email="s5-login@lubix.com", verified=False)

    response = client.post(
        "/auth/login-user",
        json={"email": "s5-login@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 200
    assert "Se ha enviado un nuevo código" in response.json()["message"]
    assert "access_token" not in response.json()
    _assert_code_email(email_mocks.code, "s5-login@lubix.com", "verifyEmail")
    email_mocks.smtp.assert_not_called()


def test_login_user_con_fallo_de_correo_devuelve_500(error_client, seed, email_mocks):
    seed.user(email="s5-login-error@lubix.com", verified=False)
    email_mocks.code.side_effect = RuntimeError("smtp caído")

    response = error_client.post(
        "/auth/login-user",
        json={"email": "s5-login-error@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 500
    email_mocks.code.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_login_company_sin_verificar_invoca_mock_de_correo(client, seed, email_mocks):
    seed.company(email="s5-login-empresa@lubix.com", verified=False)

    response = client.post(
        "/auth/login-company",
        json={"email": "s5-login-empresa@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 200
    assert "Se ha enviado un nuevo código" in response.json()["message"]
    assert "access_token" not in response.json()
    _assert_code_email(email_mocks.code, "s5-login-empresa@lubix.com", "verifyEmail")
    email_mocks.smtp.assert_not_called()


def test_login_company_con_fallo_de_correo_devuelve_500(
    error_client, seed, email_mocks
):
    seed.company(email="s5-login-empresa-error@lubix.com", verified=False)
    email_mocks.code.side_effect = RuntimeError("smtp caído")

    response = error_client.post(
        "/auth/login-company",
        json={"email": "s5-login-empresa-error@lubix.com", "password": "Secreta1!"},
    )

    assert response.status_code == 500
    email_mocks.code.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_forgot_password_invoca_mock_de_correo(client, seed, email_mocks):
    seed.user(email="s5-recuperar@lubix.com")

    response = client.post(
        "/auth/forgot-password-user",
        json={"email": "s5-recuperar@lubix.com"},
    )

    assert response.status_code == 200
    assert "código de recuperación" in response.json()["message"]
    _assert_code_email(email_mocks.code, "s5-recuperar@lubix.com", "resetPassword")
    email_mocks.smtp.assert_not_called()


def test_forgot_password_con_fallo_de_correo_devuelve_500(
    error_client, seed, email_mocks
):
    seed.user(email="s5-recuperar-error@lubix.com")
    email_mocks.code.side_effect = RuntimeError("smtp caído")

    response = error_client.post(
        "/auth/forgot-password-user",
        json={"email": "s5-recuperar-error@lubix.com"},
    )

    assert response.status_code == 500
    email_mocks.code.assert_called_once()
    email_mocks.smtp.assert_not_called()


def test_reset_password_no_envia_correo(client, seed, email_mocks):
    user = seed.user(email="s5-reset@lubix.com")
    seed.code(user, code="654321", kind="resetPassword")

    response = client.post(
        "/auth/reset-password-user",
        json={
            "email": "s5-reset@lubix.com",
            "code": "654321",
            "new_password": "NuevaClave1!",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Contraseña restablecida correctamente"}
    email_mocks.code.assert_not_called()
    email_mocks.company.assert_not_called()
    email_mocks.smtp.assert_not_called()

def test_register_user_con_correo_en_uso_no_envia_correo(client, seed, email_mocks):
    seed.user(email="s5-duplicado@lubix.com")

    response = client.post(
        "/auth/register-user",
        json={**REGISTER_USER_PAYLOAD, "email": "s5-duplicado@lubix.com"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "correo en uso"}
    email_mocks.code.assert_not_called()
    email_mocks.company.assert_not_called()
    email_mocks.smtp.assert_not_called()
    