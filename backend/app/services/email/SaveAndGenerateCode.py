# Este servicio se encarga de generar códigos de verificación o recuperación de contraseña,
# almacenarlos en la base de datos y enviarlos por correo electrónico al usuario.
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.ModelCode import Codes, typeCode
from app.services.email.template.EmailForgotPassword import EmailForgotPassword
from app.services.email.template.EmailVerify import EmailVerify

import random
import uuid

def generate_code(length=6) -> str:
    return ''.join(random.choices('0123456789', k=length))

# Crear un nuevo codigo
# Eliminar cualquier código existente para 
# el usuario y tipo de código antes de crear uno nuevo
def create_code_and_send_code(database: Session, user_id: uuid.UUID, email: str, code_type: typeCode):
    database.query(Codes).filter(
        Codes.user_id == user_id
    ).delete(synchronize_session=False)
    database.commit()
    
    code = generate_code(6)
    new_code = Codes(
        code=code,
        type=code_type,
        user_id=user_id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=1)  # El código expira en 1 día
    )

    database.add(new_code)
    database.commit()
    database.refresh(new_code)

    print(f"[LUBIX-DEBUG] Código de verificación generado para {email} ({code_type}): {code}")
    
    if code_type == typeCode.resetPassword:
        EmailForgotPassword(email, code, code_type)
    elif code_type == typeCode.verifyEmail:
        EmailVerify(email, code, code_type)
        
    return {
        "message":"Código enviado correctamente"
    }

# Verificar el código ingresado por el usuario
# Si el código es correcto, eliminarlo de la base de datos para evitar reutilización
def verify_code(database: Session, user_id: uuid.UUID, code: str, code_type: typeCode):
    code_entry = database.query(Codes).filter(
        Codes.user_id == user_id,
        Codes.code == code,
        Codes.type == code_type,
        Codes.expires_at > datetime.utcnow()
    ).first()

    if code_entry:
        database.delete(code_entry)
        database.commit()
        return True
    
    return False