from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.responses import StreamingResponse


class _ObjectStream:
    def __init__(self, data: bytes):
        self._data = data

    def read(self) -> bytes:
        return self._data

    def close(self):
        pass

    def release_conn(self):
        pass


@pytest.fixture
def email_mocks():
    code_email = MagicMock(
        return_value={
            "message": "Código enviado correctamente",
            "email_sent": True,
        }
    )
    company_email = MagicMock(return_value=True)
    email_verify = MagicMock(return_value=True)
    email_forgot = MagicMock(return_value=True)
    smtp = MagicMock()

    with (
        patch(
            "app.services.authentication.AuthService.create_code_and_send_code",
            code_email,
        ),
        patch(
            "app.services.authentication.AuthService.EmailRegisterCompany",
            company_email,
        ),
        patch(
            "app.services.email.SaveAndGenerateCode.EmailVerify",
            email_verify,
        ),
        patch(
            "app.services.email.SaveAndGenerateCode.EmailForgotPassword",
            email_forgot,
        ),
        patch("app.services.email.EmailService.smtplib.SMTP", smtp),
    ):
        yield SimpleNamespace(
            code=code_email,
            company=company_email,
            verify=email_verify,
            forgot=email_forgot,
            smtp=smtp,
        )


@pytest.fixture
def verify_code_mock():
    with patch(
        "app.services.authentication.AuthService.verify_code",
        MagicMock(return_value=True),
    ) as verify_code:
        yield verify_code


@pytest.fixture
def storage_mocks():
    upload = MagicMock(
        return_value={
            "success": True,
            "object_name": "avatars/prueba.png",
            "path": "uploads/avatars/prueba.png",
        }
    )
    get_object = MagicMock(return_value=_ObjectStream(b"contenido-api"))
    download_stream = MagicMock(
        return_value=StreamingResponse(
            iter([b"fallback-api"]),
            media_type="application/octet-stream",
        )
    )

    with (
        patch("app.services.NasService.subir.upload_file", upload),
        patch("app.services.NasService.subir.client.get_object", get_object),
        patch("app.services.NasService.subir.download_stream", download_stream),
    ):
        yield SimpleNamespace(
            upload=upload,
            get_object=get_object,
            download_stream=download_stream,
        )
