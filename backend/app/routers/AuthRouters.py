# Este router se encarga de manejar las rutas relacionadas 
# con la autenticación de usuarios, incluyendo registro, inicio de sesión,
# verificación de correo electrónico, recuperación de contraseña y cierre de sesión.
from fastapi import APIRouter,Depends, UploadFile, File, Form, BackgroundTasks, requests
from app.services.authentication.AuthService import (
    register_user_service,
    register_company_service,
    verify_email_service,
    resend_verification_service,
    login_user_service,
    login_company_service,
    forgot_password_service,
    reset_password_service,
    refresh_token_service,
    resend_verification_service,
    logout_service
)
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.schemas.SchemaAuthUser import (
    createUser, 
    verifyEmail, 
    userLogin, 
    forgotPassword, 
    ResetPassword,
    RefreshRequest,
    ResendVerification,
    LogoutRequest
)
from app.schemas.SchemaAuthCompany import createCompany, LoginCompany
from app.services.NasService import subir

from app.services.authentication.JWTService import verify_token
from app.Config import config

router = APIRouter(
    prefix=("/auth"),   
    tags=["auth"]
)

@router.post("/register-user")
def registerUser(user: createUser, background_tasks: BackgroundTasks, database: Session = Depends(get_db)):
    register_user_service(user, database, background_tasks=background_tasks)
    return {
        "message": "Usuario registrado correctamente, se ha enviado un código de verificación a tu correo electrónico para verificar tu cuenta.",
    }

@router.post("/register-company")
def registerCompany(
    background_tasks: BackgroundTasks,
    fullName: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    tell: str = Form(...),
    companyName: str = Form(...),
    companyAddress: str = Form(...),
    companyNIT: str = Form(...),
    companyNITDV: str = Form(...),
    certificate: UploadFile = File(...),
    database: Session = Depends(get_db)):

    try:
        user = createUser(
            fullName=fullName,
            email=email,
            password=password,
            tell=tell
        )

        company = createCompany(
            companyName=companyName,
            companyAddress=companyAddress,
            companyNIT=companyNIT,
            companyNITDV=companyNITDV
        )
        path = f"companies/{companyNIT}/certificates/"
        certificate_result = subir.upload_file(certificate, path)
        
        return register_company_service(
            user,
            company,
            certificate_result,
            database,
            background_tasks=background_tasks,
        )
    except Exception as e:
        # Re-lanzar HTTPExceptions (errores de validación de Pydantic o del servicio)
        from fastapi import HTTPException
        if isinstance(e, HTTPException):
            raise e
        # Para otros errores, retornar un error genérico
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={"detail": "Error en los datos de registro. Verifica la información ingresada."}
        )

@router.post("/verify-email-user")
def verify_email(code: verifyEmail, background_tasks: BackgroundTasks, database: Session = Depends(get_db)):
    
    return verify_email_service(code, database, background_tasks=background_tasks)

@router.post("/resend-verification")
def resend_verification(user: ResendVerification, background_tasks: BackgroundTasks, database: Session = Depends(get_db)):
    return resend_verification_service(user.email, database, background_tasks=background_tasks)

@router.post("/login-user")
def login_user(user: userLogin, background_tasks: BackgroundTasks, database: Session = Depends(get_db)):
    return login_user_service(user, database, background_tasks=background_tasks)

@router.post("/login-company")
def login_company(company: LoginCompany, background_tasks: BackgroundTasks, database: Session = Depends(get_db)):
    return login_company_service(company, database, background_tasks=background_tasks)

@router.post("/forgot-password-user")
def forgot_password(user: forgotPassword, background_tasks: BackgroundTasks, database: Session = Depends(get_db)):
    return forgot_password_service(user, database, background_tasks=background_tasks)

@router.post("/reset-password-user")
def reset_password(user: ResetPassword, database: Session = Depends(get_db)):
    return reset_password_service(user, database)

@router.post("/refresh")
def refresh_token(data: RefreshRequest, database: Session = Depends(get_db)):
    return refresh_token_service(data, database)

@router.post("/logout")
def logout(body: LogoutRequest, database: Session = Depends(get_db)):
    return logout_service(body.refresh_token, database)
