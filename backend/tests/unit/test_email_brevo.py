"""Envío de correo por la API HTTPS de Brevo (v3), proveedor principal.

Brevo se usa cuando `BREVO_API_KEY` está definida; si no, EmailService cae a
Resend y, en último término, al SMTP de Gmail (solo desarrollo local).
"""
import logging
import unittest
from unittest.mock import MagicMock, patch

import httpx

from app.Config import config
from app.services.email import EmailService

TO_EMAIL = "destino@lubix.com"
SUBJECT = "Verifica tu cuenta"
HTML_BODY = "<p>Tu código es <b>123456</b></p>"
# Claves ficticias: en el repositorio no debe existir ninguna API key real.
TEST_BREVO_KEY = "test-brevo-key"
TEST_RESEND_KEY = "test-resend-key"


class BrevoEmailTest(unittest.TestCase):
    """Dobles de red y SMTP con las variables de entorno controladas por test."""

    def setUp(self):
        for config_patch in (
            patch.object(config, "BREVO_API_KEY", TEST_BREVO_KEY),
            patch.object(config, "BREVO_SENDER_EMAIL", "lubixcompanyemail@gmail.com"),
            patch.object(config, "BREVO_SENDER_NAME", "lubix"),
            patch.object(config, "RESEND_API_KEY", ""),
        ):
            config_patch.start()
            self.addCleanup(config_patch.stop)

        self.http_post = MagicMock(return_value=self._responder(201))
        http_patch = patch.object(EmailService.httpx, "post", self.http_post)
        http_patch.start()
        self.addCleanup(http_patch.stop)

        self.smtp_cls = MagicMock()
        smtp_patch = patch.object(EmailService.smtplib, "SMTP", self.smtp_cls)
        smtp_patch.start()
        self.addCleanup(smtp_patch.stop)

    @staticmethod
    def _responder(status, text="{}"):
        return MagicMock(status_code=status, text=text)

    @staticmethod
    def _brevo_payload(sender_name="lubix", sender_email="lubixcompanyemail@gmail.com"):
        return {
            "sender": {"name": sender_name, "email": sender_email},
            "to": [{"email": TO_EMAIL}],
            "subject": SUBJECT,
            "htmlContent": HTML_BODY,
        }

    def test_envia_por_brevo_y_valida_url_headers_y_payload(self):
        with self.assertLogs(EmailService.logger, level=logging.INFO) as logs:
            resultado = EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY)

        self.assertTrue(resultado)
        self.http_post.assert_called_once_with(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": TEST_BREVO_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=self._brevo_payload(),
            timeout=10.0,
        )
        self.assertIn(
            f"Correo enviado vía Brevo a {TO_EMAIL}", "\n".join(logs.output)
        )
        self.smtp_cls.assert_not_called()

    def test_acepta_respuestas_2xx_de_brevo(self):
        for status in (200, 201):
            with self.subTest(status=status):
                self.http_post.reset_mock()
                self.http_post.return_value = self._responder(status)

                self.assertTrue(
                    EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY)
                )
                self.http_post.assert_called_once()

    def test_error_http_de_brevo_se_registra_sin_lanzar_excepcion(self):
        for status in (400, 401, 403):
            with self.subTest(status=status):
                self.http_post.reset_mock()
                self.http_post.return_value = self._responder(
                    status, '{"message": "api key no válida"}'
                )

                with self.assertLogs(EmailService.logger, level=logging.ERROR) as logs:
                    resultado = EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY)

                self.assertFalse(resultado)
                self.assertIn(str(status), "\n".join(logs.output))
                self.smtp_cls.assert_not_called()

    def test_timeout_de_brevo_devuelve_false_sin_propagar_excepcion(self):
        self.http_post.side_effect = httpx.TimeoutException("sin respuesta de Brevo")

        with self.assertLogs(EmailService.logger, level=logging.ERROR) as logs:
            resultado = EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY)

        self.assertFalse(resultado)
        self.assertIn("TimeoutException", "\n".join(logs.output))
        self.smtp_cls.assert_not_called()

    def test_error_de_red_de_brevo_devuelve_false(self):
        self.http_post.side_effect = httpx.ConnectError("sin ruta a api.brevo.com")

        with self.assertLogs(EmailService.logger, level=logging.ERROR):
            resultado = EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY)

        self.assertFalse(resultado)
        self.smtp_cls.assert_not_called()

    def test_brevo_tiene_prioridad_sobre_resend(self):
        with patch.object(config, "RESEND_API_KEY", TEST_RESEND_KEY):
            self.assertTrue(EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY))

        self.http_post.assert_called_once()
        self.assertEqual(
            self.http_post.call_args.args[0], "https://api.brevo.com/v3/smtp/email"
        )

    def test_fallback_a_resend_si_brevo_no_esta_configurado(self):
        self.http_post.return_value = self._responder(200)

        with (
            patch.object(config, "BREVO_API_KEY", ""),
            patch.object(config, "RESEND_API_KEY", TEST_RESEND_KEY),
        ):
            self.assertTrue(EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY))

        self.http_post.assert_called_once_with(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {TEST_RESEND_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": config.RESEND_FROM_EMAIL,
                "to": [TO_EMAIL],
                "subject": SUBJECT,
                "html": HTML_BODY,
            },
            timeout=EmailService.RESEND_TIMEOUT_SECONDS,
        )
        self.smtp_cls.assert_not_called()

    def test_fallback_a_smtp_si_no_hay_ninguna_api(self):
        with patch.object(config, "BREVO_API_KEY", ""):
            self.assertTrue(EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY))

        self.http_post.assert_not_called()
        self.smtp_cls.assert_called_once_with(
            "smtp.gmail.com", 587, timeout=EmailService.SMTP_TIMEOUT_SECONDS
        )

    def test_api_key_de_brevo_en_blanco_se_ignora(self):
        with patch.object(config, "BREVO_API_KEY", "   "):
            self.assertTrue(EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY))

        self.http_post.assert_not_called()
        self.smtp_cls.assert_called_once()

    def test_usa_remitente_por_defecto_si_no_hay_configuracion(self):
        with (
            patch.object(config, "BREVO_SENDER_EMAIL", ""),
            patch.object(config, "BREVO_SENDER_NAME", ""),
        ):
            self.assertTrue(EmailService.send_email(TO_EMAIL, SUBJECT, HTML_BODY))

        payload = self.http_post.call_args.kwargs["json"]
        self.assertEqual(
            payload["sender"],
            {"name": "lubix", "email": "lubixcompanyemail@gmail.com"},
        )


if __name__ == "__main__":
    unittest.main()
