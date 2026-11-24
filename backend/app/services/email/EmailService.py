# Este servicio email se encarga de enviar correos electrónicos.
# En producción usa la API HTTPS de Resend (Render free bloquea el puerto SMTP
# 587); en desarrollo local, sin RESEND_API_KEY, usa la cuenta de Gmail
# configurada en las variables de entorno.
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

RESEND_API_URL = "https://api.resend.com/emails"
RESEND_TIMEOUT_SECONDS = 10.0


def _resend_api_key() -> str:
    # Se lee en cada envío (no al importar) para que las pruebas y un reinicio
    # con la variable ya definida siempre vean el valor vigente.
    return (config.RESEND_API_KEY or "").strip()


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
    """Envía un correo HTML por Resend si hay API key; si no, por SMTP."""
    api_key = _resend_api_key()
    if api_key:
        return _send_via_resend(to_email, subject, body, api_key)
    return _send_via_smtp(to_email, subject, body, timeout)
