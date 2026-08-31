# Este servicio se encarga de manejar la lógica de autenticación de usuarios, 
# incluyendo registro, inicio de sesión, verificación de correo electrónico, 
# recuperación de contraseña y cierre de sesión.
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.ModelCompany import Company
from app.models.ModelUser import Users
from app.models.ModelRole import Role
from app.models.ModelRefreshToken import RefreshToken
from app.schemas.SchemaAuthUser import (
    createUser, 
    verifyEmail, 
    userLogin, 
    forgotPassword, 
    ResetPassword,
    TokenResponse,
    RefreshRequest
)
from app.services.authentication.JWTService import create_access_token, create_refresh_token, verify_token
from app.schemas.SchemaAuthCompany import createCompany, LoginCompany
from sqlalchemy.orm import Session
from app.utils.Security import hash_password, verify_password
from app.services.email.SaveAndGenerateCode import create_code_and_send_code, verify_code
from app.services.email.template.EmailRegisterCompany import EmailRegisterCompany
from app.Config import config

def register_user_service(user: createUser, database: Session):
    user_role = database.query(Role).filter(Role.name == "user").first()
    exists_user = database.query(Users).filter(Users.email == user.email).first()

    if exists_user:
        raise HTTPException(status_code=409, detail="correo en uso")
    
    try:

        hashed_password = hash_password(user.password)
        new_user = Users(
            fullName = user.fullName,
            email = user.email,
            hashed_password = hashed_password,
            role_id = user_role.id,
            tell = user.tell,
            isActive = user.isActive,
            verified = user.verified,
        )
        print("aca 1")
        database.add(new_user)
        print("aca 2")
        database.commit()
        database.refresh(new_user)
        print("aca 3")
        confirm_id_user = database.query(Users).filter(Users.email == user.email).first()
        create_code_and_send_code(database, confirm_id_user.id, email=user.email, code_type="verifyEmail")
        return {
            "message": "Usuario registrado correctamente, se ha enviado un código de verificación a tu correo electrónico para verificar tu cuenta."
        }
    
    except Exception as e:
        database.rollback()

        print("ERROR:",e)
        raise HTTPException(status_code=500, detail="Error al crear cuenta")

def register_company_service(user: createUser, company: createCompany, certificate_result: str, database: Session):
    company_role = database.query(Role).filter(Role.name == "company").first()
    exists_NIT = database.query(Company).filter(Company.CompanyNIT == company.companyNIT).first()
    exists_email = database.query(Users).filter(Users.email == user.email).first()

    if not company_role:
        raise HTTPException(status_code=409, detail="Ups no hay rol para empresa")
    
    if exists_NIT:
        raise HTTPException(status_code=409, detail="NIT en uso")
    
    if exists_email:
        raise HTTPException(status_code=409, detail="Correo en uso")
    

    try:
        hashed_password = hash_password(user.password)
        new_user = Users(
            fullName = user.fullName,
            email = user.email,
            hashed_password = hashed_password,
            role_id = company_role.id,
            tell = user.tell,
            isActive = user.isActive,
            verified = user.verified,
        )

        database.add(new_user)
        database.flush()

        new_company = Company(
            user_id = new_user.id,
            nameCompany = company.companyName,
            addressCompany = company.companyAddress,
            CompanyNIT = company.companyNIT,
            CompanyNITDV = company.companyNITDV,
            CompanyLogo = company.companyLogo,
            CompanyBanner = company.companyBanner,
            CompanyCertificate = certificate_result["path"],
        )

        database.add(new_company)
        database.commit()
        database.refresh(new_company)
        EmailRegisterCompany(user.email, company.companyName, company.companyNIT)

        return {
            "message": "Empresa registrada correctamente. espera que el equipo de Lubix se ponga en contacto contigo para verificar tu empresa y activar tu cuenta.",
            "certificate_url": new_company.CompanyCertificate,
            "company_name": new_company.nameCompany,
            "company_nit": new_company.CompanyNIT,
            "certificate": certificate_result["path"]
        }
    
    except Exception as e:
        database.rollback()
        print("ERROR",e)

        raise HTTPException(status_code=500, detail="Error al crear cuenta empresarial")

def verify_email_service(code: verifyEmail, database: Session):
    user = database.query(Users).filter(Users.email == code.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Correo incorrecto")
    
    if not verify_code(database, user.id, code.code, code_type="verifyEmail"):
        create_code_and_send_code(database, user.id, user.email, code_type="verifyEmail")
        raise HTTPException(
            status_code=400,
            detail="Código de verificación incorrecto o expirado. Se ha enviado un nuevo código a tu correo electrónico."
        )

    user.verified = True
    database.commit()

    return {
        "verified": user.verified,
        "message": "Correo electrónico verificado correctamente"
    }

def resend_verification_service(email: str, database: Session):
    user = database.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Correo no registrado")
    create_code_and_send_code(database, user.id, email, code_type="verifyEmail")
    return {"message": "Se ha enviado un nuevo código de verificación a tu correo electrónico."}

def login_user_service(user: userLogin, database: Session):
    print("entra a login_user_service")
    search_user = database.query(Users).filter(Users.email == user.email).first()

    if not search_user:
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
    
    if not verify_password(user.password, search_user.hashed_password):
        raise HTTPException(status_code=400, detail="contraseña incorrectos")

    # Validación de rol: este endpoint es para usuario y admin
    # Solo bloquea empresa (evita que empresa entre como usuario)
    if search_user.role.name == "company":
        raise HTTPException(status_code=403, detail="Esta cuenta es de empresa. Usa el acceso de Empresa.")
    
    if not search_user.verified:
        create_code_and_send_code(database, search_user.id, search_user.email, code_type="verifyEmail")
        return {
            "message": "Tu correo electrónico no ha sido verificado. Se ha enviado un nuevo código de verificación a tu correo electrónico."
        }
        
    access_token = create_access_token(
        user_id=str(search_user.id),
        role=str(search_user.role.name)
    )


    refresh_token = create_refresh_token(
        user_id=str(search_user.id)
    )

    save_refresh_token(database, search_user.id, refresh_token)
    
    print(search_user.id)
    print(search_user.role.name)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=search_user.role.name,
        id=str(search_user.id),
        Nombre=search_user.fullName,
        email=search_user.email
    )

def login_company_service(company: LoginCompany, database: Session):
    search_company = database.query(Users).filter(Users.email == company.email).first()
    
    if not search_company:
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
    
    if not verify_password(company.password, search_company.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    # Validación de rol: este endpoint solo permite cuentas de empresa
    # Evita que un usuario normal inicie sesión como empresa
    if search_company.role.name != "company":
        raise HTTPException(status_code=403, detail="Esta cuenta no es de empresa. Usa el acceso de Usuario.")
    
    # Verificar que exista registro en tabla Company (cuenta empresarial válida)
    company_record = database.query(Company).filter(Company.user_id == search_company.id).first()
    if not company_record:
        raise HTTPException(status_code=403, detail="Cuenta de empresa no encontrada o no verificada por Lubix")
    
    if not search_company.verified:
        create_code_and_send_code(database, search_company.id, search_company.email, code_type="verifyEmail")
        return {
            "message": "Tu correo electrónico no ha sido verificado. Se ha enviado un nuevo código de verificación a tu correo electrónico."
        }
    
    access_token = create_access_token(
        user_id=str(search_company.id),
        role=search_company.role.name
    )

    refresh_token = create_refresh_token(
        user_id=str(search_company.id)
    )

    save_refresh_token(database, search_company.id, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=search_company.role.name,
        id=str(search_company.id),
        Nombre=search_company.fullName,
        email=search_company.email
    )

def forgot_password_service(user: forgotPassword, database: Session):
    search_user = database.query(Users).filter(Users.email == user.email).first()
    if not search_user:
        raise HTTPException(status_code=400, detail="Correo no registrado")
    create_code_and_send_code(database, search_user.id, user.email, code_type="resetPassword")

    return {
        "message": "se ha enviado un código de recuperación de contraseña a tu correo electrónico."
    }

def reset_password_service(user: ResetPassword, database: Session):
    search_user = database.query(Users).filter(Users.email == user.email).first()
    if not search_user:
        raise HTTPException(status_code=400, detail="Correo no registrado")
    
    if not verify_code(database, search_user.id, user.code, code_type="resetPassword"):
        raise HTTPException(status_code=400, detail="Código de recuperación de contraseña incorrecto o expirado.")
    
    hashed_password = hash_password(user.new_password)
    search_user.hashed_password = hashed_password
    database.commit()
    
    return {
        "message": "Contraseña restablecida correctamente"
    }


def save_refresh_token(database: Session, user_id, token: str):
    database.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)
    new_token = RefreshToken(
        token=token,
        revoked=False,
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=config.REFRESH_TOKEN_DAYS)
    )
    database.add(new_token)
    database.commit()

def resend_verification_service(email: str, database: Session):
    user = database.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Correo no registrado")
    if user.verified:
        raise HTTPException(status_code=400, detail="El correo ya ha sido verificado")
    create_code_and_send_code(database, user.id, user.email, code_type="verifyEmail")
    return {
        "message": "Se ha enviado un nuevo código de verificación a tu correo electrónico."
    }

def refresh_token_service(data: RefreshRequest, database: Session):

    payload = verify_token(data.old_refresh_token)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=401,detail="Refresh token inválido o expirado")
    
    id_user = payload["sub"]

    if payload["type"] != "refresh":
        raise HTTPException(status_code=401, detail="Token incorrecto")
    
    user = database.query(Users).filter(Users.id == id_user).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado...")
    
    db_token = database.query(RefreshToken).filter(
        RefreshToken.token == data.old_refresh_token,
        RefreshToken.user_id == user.id
    ).first()

    if not db_token:
        raise HTTPException(status_code=401, detail="Sesión no encontrada")
    
    if db_token.revoked:
        raise HTTPException(status_code=401, detail="Sesión revocada")
    
    if db_token.expires_at and db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Sesión expirada")

    db_token.revoked = True
    database.commit()

    new_access_token = create_access_token(
        user_id=str(user.id),
        role=str(user.role.name)
    )

    new_refresh_token = create_refresh_token(
        user_id=str(user.id)
    )

    save_refresh_token(database, user.id, new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        role=user.role.name,
        id=str(user.id),
        Nombre=user.fullName,
        email=user.email
    )

def logout_service(refresh_token: str, database: Session):
    if refresh_token:
        db_token = database.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if db_token:
            db_token.revoked = True
            database.commit()

    return {
        "message": "Sesión cerrada correctamente"
    }