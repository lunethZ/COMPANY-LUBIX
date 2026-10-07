from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.database.Connection import get_db
from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from app.models.ModelCompany import Company
from app.models.ModelFavorite import Favorite

router = APIRouter(
    prefix="/user",
    tags=["user-favorites"]
)


@router.get("/favorites")
def list_favorites(request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    favorites = (
        database.query(Favorite, Product, Company, Users)
        .join(Product, Favorite.product_id == Product.id)
        .join(Company, Product.company_id == Company.id)
        .join(Users, Company.user_id == Users.id)
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

    result = []
    for fav, product, company, seller in favorites:
        images = product.images if product.images else []
        result.append({
            "id": str(fav.id),
            "product": {
                "id": str(product.id),
                "name": product.name,
                "price": float(product.price),
                "images": images,
                "descripcion": product.descripcion,
                "stock": product.stock,
                "discount_enable": product.discount_enable,
                "discount_value": float(product.discount_value),
                "company_name": company.nameCompany,
            },
            "created_at": fav.created_at,
        })

    return result


@router.post("/favorites/{product_id}")
def toggle_favorite(product_id: str, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    product = database.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = database.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first()

    if existing:
        database.delete(existing)
        database.commit()
        return {"message": "Favorito eliminado", "is_favorite": False}
    else:
        fav = Favorite(user_id=user_id, product_id=product_id)
        database.add(fav)
        database.commit()
        return {"message": "Favorito agregado", "is_favorite": True}
