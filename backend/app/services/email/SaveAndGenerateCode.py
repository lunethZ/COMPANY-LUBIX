# Este servicio se encarga de generar códigos de verificación o recuperación de contraseña,
# almacenarlos en la base de datos y enviarlos por correo electrónico al usuario.
import logging
import secrets
import uuid

from datetime import datetime, timedelta, timezone
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models.ModelCode import Codes, typeCode
from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailVerify import EmailVerify

logger = logging.getLogger(__name__)

CODE_DIGITS = "0123456789"


def generate_code(length: int = 6) -> str:
    return ''.join(secrets.choice(CODE_DIGITS) for _ in range(length))


def _email_sender(code_type: typeCode):
    if code_type == typeCode.resetPassword:
        return EmailForgotPassword
    if code_type == typeCode.verifyEmail:
        return EmailVerify
    return None


# Crear un nuevo codigo
# Eliminar cualquier código existente para
# el usuario y tipo de código antes de crear uno nuevo.
# Si se recibe `background_tasks`, el correo se envía después de responder
# para que el endpoint no dependa del tiempo de SMTP (Render free lo bloquea).
def create_code_and_send_code(
    database: Session,
    user_id: uuid.UUID,
    email: str,
    code_type: typeCode,
    background_tasks: BackgroundTasks | None = None,
):
    database.query(Codes).filter(
        Codes.user_id == user_id
    ).delete(synchronize_session=False)
    database.commit()

    code = generate_code(6)
    new_code = Codes(
        code=code,
        type=code_type,
        user_id=user_id,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=1)  # El código expira en 1 día
    )

    database.add(new_code)
    database.commit()
    database.refresh(new_code)

    logger.info("Código de %s generado para %s", code_type, email)

    sender = _email_sender(code_type)

    if sender is not None and background_tasks is not None:
        background_tasks.add_task(sender, email, code, code_type)
        return {
            "message": "Código enviado correctamente",
            "email_sent": True,
        }

    email_sent = bool(sender(email, code, code_type)) if sender is not None else False

    if not email_sent:
        logger.error("No se pudo enviar el correo de %s a %s", code_type, email)

    return {
        "message": "Código enviado correctamente" if email_sent else "Código generado pero no se pudo enviar el correo. Intenta de nuevo.",
        "email_sent": email_sent
    }

# Verificar el código ingresado por el usuario
# Si el código es correcto, eliminarlo de la base de datos para evitar reutilización
def verify_code(database: Session, user_id: uuid.UUID, code: str, code_type: typeCode):
    code_entry = database.query(Codes).filter(
        Codes.user_id == user_id,
        Codes.code == code,
        Codes.type == code_type,
        Codes.expires_at > datetime.now(timezone.utc)
    ).first()

    if code_entry:
        database.delete(code_entry)
        database.commit()
        return True
    
    return False