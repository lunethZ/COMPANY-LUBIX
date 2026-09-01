from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.models.ModelUser import Users
from app.models.ModelCompany import Company
from app.models.ModelRole import Role
from app.models.ModelProduct import Product
from app.models.ModelReview import Review
from app.models.ModelFavorite import Favorite
from app.models.ModelCart import Cart, CartItem
from app.models.ModelOrder import Order, OrderItem
from app.models.ModelAddress import Address
from app.models.ModelCode import Codes
from app.models.ModelRefreshToken import RefreshToken
from app.models.ModelPQRS import PQRS

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

def _get_role_id(database: Session, name: str):
    role = database.query(Role).filter(Role.name == name).first()
    return role.id if role else None

@router.get("/dashboard/me")
def admin_dashboard_me(request: Request, database: Session = Depends(get_db)):
    role_user = _get_role_id(database, "user")
    role_company = _get_role_id(database, "company")

    total_users = database.query(Users).filter(Users.role_id == role_user).count() if role_user else 0
    total_companies = database.query(Users).filter(Users.role_id == role_company).count() if role_company else 0
    pending_companies = (
        database.query(Users).filter(Users.role_id == role_company, Users.verified == False).count()
        if role_company else 0
    )
    active_users = database.query(Users).filter(Users.isActive == True).count()
    inactive_users = database.query(Users).filter(Users.isActive == False).count()

    return {
        "totalUsers": total_users,
        "totalCompanies": total_companies,
        "pendingCompanies": pending_companies,
        "activeUsers": active_users,
        "inactiveUsers": inactive_users
    }

@router.get("/users")
def list_users(request: Request, database: Session = Depends(get_db)):
    users = database.query(Users).order_by(Users.created_at.desc()).all()

    return [
        {
            "id": str(u.id),
            "fullName": u.fullName,
            "email": u.email,
            "tell": u.tell,
            "role": u.role.name if u.role else None,
            "verified": u.verified,
            "isActive": u.isActive,
            "memberSince": u.created_at,
        }
        for u in users
    ]

@router.get("/companies")
def list_companies(request: Request, database: Session = Depends(get_db)):
    companies = (
        database.query(Company, Users)
        .join(Users, Company.user_id == Users.id)
        .order_by(Users.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(company.id),
            "userId": str(user.id),
            "nameCompany": company.nameCompany,
            "nit": company.CompanyNIT,
            "nitDV": company.CompanyNITDV,
            "addressCompany": company.addressCompany,
            "email": user.email,
            "ownerName": user.fullName,
            "ownerTell": user.tell,
            "verified": user.verified,
            "isActive": user.isActive,
            "certificate": company.CompanyCertificate,
            "memberSince": user.created_at,
        }
        for company, user in companies
    ]

@router.delete("/users/{user_id}")
def delete_user(user_id: str, request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    role_admin = _get_role_id(database, "admin")
    if user.role_id == role_admin:
        raise HTTPException(status_code=400, detail="No se puede eliminar un administrador")

    company = database.query(Company).filter(Company.user_id == user.id).first()
    if company:
        database.delete(company)

    database.delete(user)
    database.commit()

    return {"message": "Usuario eliminado correctamente", "id": user_id}


@router.delete("/companies/{company_id}")
def delete_company(company_id: str, request: Request, database: Session = Depends(get_db)):
    company = database.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    user = database.query(Users).filter(Users.id == company.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario de la empresa no encontrado")

    role_admin = _get_role_id(database, "admin")
    if user.role_id == role_admin:
        raise HTTPException(status_code=400, detail="No se puede eliminar un administrador")

    try:
        product_ids = [
            p.id for p in database.query(Product.id).filter(Product.company_id == company.id).all()
        ]

        if product_ids:
            database.query(OrderItem).filter(OrderItem.product_id.in_(product_ids)).delete(synchronize_session=False)
            database.query(CartItem).filter(CartItem.product_id.in_(product_ids)).delete(synchronize_session=False)
            database.query(Favorite).filter(Favorite.product_id.in_(product_ids)).delete(synchronize_session=False)
            database.query(Review).filter(Review.product_id.in_(product_ids)).delete(synchronize_session=False)
            database.query(Product).filter(Product.id.in_(product_ids)).delete(synchronize_session=False)

        order_ids = [
            o.id for o in database.query(Order.id).filter(Order.user_id == user.id).all()
        ]
        if order_ids:
            database.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
            database.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)

        database.query(Cart).filter(Cart.user_id == user.id).delete(synchronize_session=False)
        database.query(Address).filter(Address.user_id == user.id).delete(synchronize_session=False)
        database.query(Codes).filter(Codes.user_id == user.id).delete(synchronize_session=False)
        database.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete(synchronize_session=False)
        database.query(PQRS).filter(PQRS.user_id == user.id).delete(synchronize_session=False)

        database.delete(user)
        database.delete(company)
        database.commit()
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al eliminar la empresa")

    return {"message": "Empresa eliminada correctamente", "id": company_id}


@router.patch("/companies/{company_id}/validate")
def validate_company(company_id: str, request: Request, database: Session = Depends(get_db)):
    company = database.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    user = database.query(Users).filter(Users.id == company.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario de la empresa no encontrado")

    user.verified = True
    user.isActive = True
    database.commit()

    return {
        "message": "Empresa validada correctamente",
        "id": str(company.id),
        "nameCompany": company.nameCompany,
        "verified": user.verified,
        "isActive": user.isActive
    }

@router.get("/pqrs")
def list_pqrs_admin(request: Request, database: Session = Depends(get_db)):
    pqrs_list = database.query(PQRS).order_by(PQRS.created_at.desc()).all()
    # Para enriquecer con datos de usuario
    result = []
    for p in pqrs_list:
        u = database.query(Users).filter(Users.id == p.user_id).first()
        result.append({
            "id": str(p.id),
            "type": p.type,
            "subject": p.subject,
            "description": p.description,
            "status": p.status,
            "user_role": p.user_role,
            "user_name": u.fullName if u else "Desconocido",
            "user_email": u.email if u else "",
            "created_at": p.created_at,
        })
    return result

@router.patch("/pqrs/{pqrs_id}/status")
def resolve_pqrs(pqrs_id: str, request: Request, database: Session = Depends(get_db)):
    pqrs = database.query(PQRS).filter(PQRS.id == pqrs_id).first()
    if not pqrs:
        raise HTTPException(status_code=404, detail="PQRS no encontrada")
    pqrs.status = "resolved"
    database.commit()
    return {"message": "PQRS marcada como resuelta", "id": str(pqrs.id), "status": pqrs.status}