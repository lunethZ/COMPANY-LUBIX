from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from app.database.Connection import get_db
from app.models.ModelPQRS import PQRS

router = APIRouter(
    prefix="/pqrs",
    tags=["pqrs"]
)


ASUNTO_MIN = 3
ASUNTO_MAX = 150  # coincide con String(150) de la columna subject
MENSAJE_MIN = 10
MENSAJE_MAX = 2000


class CreatePQRSRequest(BaseModel):
    type: str
    subject: str
    description: str

    @field_validator("subject")
    @classmethod
    def validar_asunto(cls, value: str) -> str:
        value = value.strip()
        if not ASUNTO_MIN <= len(value) <= ASUNTO_MAX:
            raise ValueError(
                f"El asunto debe tener entre {ASUNTO_MIN} y {ASUNTO_MAX} caracteres"
            )
        return value

    @field_validator("description")
    @classmethod
    def validar_mensaje(cls, value: str) -> str:
        value = value.strip()
        if not MENSAJE_MIN <= len(value) <= MENSAJE_MAX:
            raise ValueError(
                f"El mensaje debe tener entre {MENSAJE_MIN} y {MENSAJE_MAX} caracteres"
            )
        return value


@router.post("")
def create_pqrs(data: CreatePQRSRequest, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    user_role = request.state.role

    if data.type not in ("peticion", "queja", "reclamo", "sugerencia"):
        raise HTTPException(status_code=400, detail="Tipo de PQRS no válido")

    new_pqrs = PQRS(
        type=data.type,
        subject=data.subject,
        description=data.description,
        status="pending",
        user_id=user_id,
        user_role=user_role
    )

    database.add(new_pqrs)
    database.commit()
    database.refresh(new_pqrs)

    return {
        "message": "PQRS enviada correctamente",
        "id": str(new_pqrs.id)
    }


@router.get("")
def list_my_pqrs(request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id

    pqrs_list = (
        database.query(PQRS)
        .filter(PQRS.user_id == user_id)
        .order_by(PQRS.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(p.id),
            "type": p.type,
            "subject": p.subject,
            "description": p.description,
            "status": p.status,
            "user_role": p.user_role,
            "created_at": p.created_at,
        }
        for p in pqrs_list
    ]
