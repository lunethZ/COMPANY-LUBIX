import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.Connection import get_db

# Imports correctos según tu AuthService
from app.models.ModelCompany import Company
from app.models.ModelUser import Users

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

# Consulta usuarios con rol de empresa que NO estén verificados/activos
@router.get("/pending-companies")
def get_pending_companies(database: Session = Depends(get_db)):
    pending = (
        database.query(
            Company.id,
            Company.nameCompany.label("companyName"),
            Company.CompanyNIT.label("companyNIT"),
            Users.email.label("email")
        )
        .join(Users, Users.id == Company.user_id)
        .filter(Users.verified.is_(False))
        .all()
    )
    return [
        {"id": str(r.id), "companyName": r.companyName, "companyNIT": r.companyNIT, "email": r.email}
        for r in pending
    ]

@router.get("/approved-companies")
def get_approved_companies(database: Session = Depends(get_db)):
    approved = (
        database.query(
            Company.id,
            Company.nameCompany.label("companyName"),
            Company.CompanyNIT.label("companyNIT"),
            Users.email.label("email")
        )
        .join(Users, Users.id == Company.user_id)
        .filter(Users.verified.is_(True))
        .all()
    )
    return [
        {"id": str(r.id), "companyName": r.companyName, "companyNIT": r.companyNIT, "email": r.email}
        for r in approved
    ]

# Activa/verifica la empresa
@router.post("/approve-company/{company_id}")
def approve_company(company_id: str, database: Session = Depends(get_db)):
    try:
        cid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    company = database.query(Company).filter(Company.id == cid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Marcamos al usuario asociado a la empresa como verificado
    user = database.query(Users).filter(Users.id == company.user_id).first()
    if user:
        user.verified = True
        user.isActive = True
    
    database.commit()
    return {"message": "Empresa aprobada exitosamente"}