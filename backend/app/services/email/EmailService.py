# Este servicio email se encarga de enviar correos electrónicos
# utilizando la cuenta de Gmail configurada en las variables de entorno.
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.Config import config

GMAIL_USERNAME = config.GMAIL_USERNAME
GMAIL_PASSWORD = (config.GMAIL_APP_PASSWORD or "").replace(" ", "")

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = GMAIL_USERNAME
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USERNAME, GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info("Correo enviado exitosamente a %s", to_email)
        return True
    except Exception:
        logger.exception("Error enviando correo a %s", to_email)
        return False


