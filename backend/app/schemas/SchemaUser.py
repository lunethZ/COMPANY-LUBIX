from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
import re

class OrderItemRequest(BaseModel):
    product_id: Optional[str] = None
    name: str
    price: float
    quantity: int = 1

    @field_validator('quantity')
    def validate_quantity(cls, v):
        if v < 1:
            raise ValueError('la cantidad debe ser al menos 1')
        return v

class CreateOrderRequest(BaseModel):
    items: list[OrderItemRequest]
    subtotal: float = 0
    discount: float = 0
    shipping: float = 0
    total: float = 0
    payment_method: str = "efectivo"
    recipient: str
    address: str
    city: str
    department: str
    postal_code: str

    @field_validator('recipient')
    def validate_recipient(cls, v):
        if not v or not v.strip():
            raise ValueError('el nombre del destinatario es obligatorio')
        return v

    @field_validator('address')
    def validate_address(cls, v):
        if not v or not v.strip():
            raise ValueError('la dirección es obligatoria')
        return v

    @field_validator('city')
    def validate_city(cls, v):
        if not v or not v.strip():
            raise ValueError('la ciudad es obligatoria')
        return v

    @field_validator('department')
    def validate_department(cls, v):
        if not v or not v.strip():
            raise ValueError('el departamento es obligatorio')
        return v

    @field_validator('postal_code')
    def validate_postal_code(cls, v):
        if not v or not v.strip():
            raise ValueError('el código postal es obligatorio')
        return v

class UpdateUserProfileRequest(BaseModel):
    fullName: Optional[str] = None
    tell: Optional[str] = None

    @field_validator('fullName')
    def validate_fullName(cls, v):
        if v is not None and len(v) < 3:
            raise ValueError('el nombre completo debe tener al menos 3 caracteres')
        return v

    @field_validator('tell')
    def validate_tell(cls, v):
        if v is not None and len(v) < 10:
            raise ValueError('el número de teléfono debe tener al menos 10 caracteres')
        return v

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('la contraseña debe tener al menos 8 caracteres')
        if not re.search(r'[A-Z]', v):
            raise ValueError('la contraseña debe contener al menos una letra mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('la contraseña debe contener al menos una letra minúscula')
        if not re.search(r'[0-9]', v):
            raise ValueError('la contraseña debe contener al menos un número')
        return v

class CreateAddressRequest(BaseModel):
    label: Optional[str] = None
    address: str
    city: str
    department: str
    postal_code: Optional[str] = None
    is_default: bool = False

class UpdateAddressRequest(BaseModel):
    label: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    postal_code: Optional[str] = None
    is_default: Optional[bool] = None