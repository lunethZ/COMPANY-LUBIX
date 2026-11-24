# Este servicio email se encarga de enviar correos electrónicos.
# En producción usa la API HTTPS de Brevo (Render free bloquea el puerto SMTP
# 587); si Brevo no está configurado, intenta Resend y, en última instancia,
# el SMTP de Gmail configurado en las variables de entorno (desarrollo local).
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx

from app.Config import config

logger = logging.getLogger(__name__)

GMAIL_USERNAME = config.GMAIL_USERNAME
GMAIL_PASSWORD = (config.GMAIL_APP_PASSWORD or "").replace(" ", "")

# Render (plan gratuito) bloquea las conexiones salientes SMTP y, cuando no las
# bloquea, Gmail puede tardar más de un minuto en negociar TLS. Sin `timeout`
# el socket de smtplib espera indefinidamente y el endpoint queda colgado.
SMTP_TIMEOUT_SECONDS = 10

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_TIMEOUT_SECONDS = 10.0
BREVO_DEFAULT_SENDER_NAME = "lubix"
BREVO_DEFAULT_SENDER_EMAIL = "lubixcompanyemail@gmail.com"

RESEND_API_URL = "https://api.resend.com/emails"
RESEND_TIMEOUT_SECONDS = 10.0


def _brevo_api_key() -> str:
    # Se lee en cada envío (no al importar) para que las pruebas y un reinicio
    # con la variable ya definida siempre vean el valor vigente.
    return (config.BREVO_API_KEY or "").strip()


def _resend_api_key() -> str:
    return (config.RESEND_API_KEY or "").strip()


def _brevo_sender() -> dict:
    return {
        "name": config.BREVO_SENDER_NAME or BREVO_DEFAULT_SENDER_NAME,
        "email": config.BREVO_SENDER_EMAIL or BREVO_DEFAULT_SENDER_EMAIL,
    }


def _send_via_brevo(to_email: str, subject: str, html_body: str, api_key: str) -> bool:
    payload = {
        "sender": _brevo_sender(),
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }
    try:
        response = httpx.post(
            BREVO_API_URL,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=BREVO_TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        # Timeout o error de red: no se propaga porque estas funciones corren
        # en BackgroundTasks y la petición HTTP ya fue respondida.
        logger.error(
            "Brevo no respondió al enviar a %s: %s: %s",
            to_email,
            type(exc).__name__,
            exc,
            exc_info=True,
        )
        return False

    # Un fallo de Brevo (401 por API key inválida, 400 por payload, etc.) no
    # debe propagarse: estas funciones corren dentro de BackgroundTasks.
    if not 200 <= response.status_code < 300:
        logger.error(
            "Brevo rechazó el correo a %s: status=%s body=%s",
            to_email,
            response.status_code,
            response.text,
        )
        return False

    logger.info("Correo enviado vía Brevo a %s", to_email)
    return True


def _send_via_resend(to_email: str, subject: str, html_body: str, api_key: str) -> bool:
    payload = {
        "from": config.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=RESEND_TIMEOUT_SECONDS,
        )
    except httpx.HTTPError:
        logger.exception("No se pudo conectar con la API de Resend para %s", to_email)
        return False

    # Un fallo de Resend (403 por dominio no verificado, 500, etc.) no debe
    # propagarse: estas funciones corren dentro de BackgroundTasks.
    if not 200 <= response.status_code < 300:
        logger.error(
            "Resend rechazó el correo a %s: status=%s body=%s",
            to_email,
            response.status_code,
            response.text,
        )
        return False

    logger.info("Correo enviado vía Resend a %s", to_email)
    return True


def _send_via_smtp(to_email: str, subject: str, body: str, timeout: int) -> bool:
    msg = MIMEMultipart()
    msg['From'] = GMAIL_USERNAME
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    server = None
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=timeout)
        server.starttls()
        server.login(GMAIL_USERNAME, GMAIL_PASSWORD)
        server.send_message(msg)
        logger.info("Correo enviado a %s", to_email)
        return True
    except Exception:
        logger.exception("No se pudo enviar el correo a %s", to_email)
        return False
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                logger.debug("No se pudo cerrar la conexión SMTP con %s", to_email, exc_info=True)


def send_email(to_email: str, subject: str, body: str, timeout: int = SMTP_TIMEOUT_SECONDS) -> bool:
    """Envía un correo HTML por Brevo, Resend o SMTP, en ese orden de prioridad."""
    brevo_api_key = _brevo_api_key()
    if brevo_api_key:
        return _send_via_brevo(to_email, subject, body, brevo_api_key)

    resend_api_key = _resend_api_key()
    if resend_api_key:
        return _send_via_resend(to_email, subject, body, resend_api_key)

    return _send_via_smtp(to_email, subject, body, timeout)
