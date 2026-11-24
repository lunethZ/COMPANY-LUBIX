# Este servicio email se encarga de enviar correos electrónicos
# utilizando la cuenta de Gmail configurada en las variables de entorno.
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.Config import config

logger = logging.getLogger(__name__)

GMAIL_USERNAME = config.GMAIL_USERNAME
GMAIL_PASSWORD = (config.GMAIL_APP_PASSWORD or "").replace(" ", "")

# Render (plan gratuito) bloquea las conexiones salientes SMTP y, cuando no las
# bloquea, Gmail puede tardar más de un minuto en negociar TLS. Sin `timeout`
# el socket de smtplib espera indefinidamente y el endpoint queda colgado.
SMTP_TIMEOUT_SECONDS = 10


def send_email(to_email: str, subject: str, body: str, timeout: int = SMTP_TIMEOUT_SECONDS) -> bool:
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
