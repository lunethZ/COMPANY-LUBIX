# Este esquema define los modelos de datos para la autenticación de empresas,
from pydantic import BaseModel, EmailStr, field_validator
import re

class createCompany(BaseModel):
    companyName: str
    companyAddress: str
    companyNIT: str     
    companyNITDV: str
    companyLogo: str | None = None
    companyBanner: str | None = None
    companyCertificate: str | None = None

    @field_validator('companyName')
    def validate_companyName(cls, v: str):
        if not v or not v.strip():
            raise ValueError('el nombre de la empresa es obligatorio')
        if len(v.strip()) < 3:
            raise ValueError('el nombre de la empresa debe tener al menos 3 caracteres')
        if len(v) > 50:
            raise ValueError('el nombre de la empresa no debe exceder los 50 caracteres')
        return v
    
    @field_validator('companyAddress')
    def validate_companyAddress(cls, v: str):
        if not v or not v.strip():
            raise ValueError('la dirección de la empresa es obligatoria')
        return v
    
    @field_validator('companyNIT')
    def validate_nit(cls, v: str):
        if not v or not v.strip():
            raise ValueError('el NIT es obligatorio')
        if len(v) < 5:
            raise ValueError('el NIT debe tener al menos 5 caracteres')
        if not v.isdigit():
            raise ValueError('el NIT debe contener solo números')
        return v
    
    @field_validator('companyNITDV')
    def validate_nitdv(cls, v: str):
        if not v or not v.strip():
            raise ValueError('el dígito de verificación del NIT es obligatorio')
        if len(v) != 1:
            raise ValueError('el dígito de verificación del NIT debe tener exactamente 1 carácter')
        if not v.isdigit():
            raise ValueError('el dígito de verificación del NIT debe contener solo números')
        return v
    
    @field_validator('companyLogo')
    def validate_logo(cls, v: str | None):
        if v is not None and len(v) > 255:
            raise ValueError('la URL del logo no debe exceder los 255 caracteres')
        return v

    @field_validator('companyBanner')
    def validate_banner(cls, v: str | None):
        if v is not None and len(v) > 255:
            raise ValueError('la URL del banner no debe exceder los 255 caracteres')
        return v

    @field_validator('companyCertificate')
    def validate_certificate(cls, v: str | None):
        if v is not None and len(v) > 255:
            raise ValueError('la URL del certificado no debe exceder los 255 caracteres')
        return v


class LoginCompany(BaseModel):
    email: str
    password: str