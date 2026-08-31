from fastapi import APIRouter, Query, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from app.database.Connection import get_db
from app.models.ModelProduct import Product, Catalog
from app.models.ModelCompany import Company
from app.models.ModelUser import Users
from app.models.ModelReview import Review
from app.models.ModelFavorite import Favorite
from app.models.ModelOrder import Order, OrderItem

router = APIRouter(
    prefix="/products",
    tags=["products"]
)


def _get_product_rating(product_id, database):
    result = database.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("review_count")
    ).filter(Review.product_id == product_id).first()
    return float(result.avg_rating or 0), int(result.review_count or 0)


@router.get("/catalogs")
def list_catalogs(database: Session = Depends(get_db)):
    rows = (
        database.query(Catalog, func.count(Product.id))
        .outerjoin(Product, Product.catalog_id == Catalog.id)
        .filter(Product.status == "active")
        .group_by(Catalog.id)
        .order_by(Catalog.name.asc())
        .all()
    )

    return [
        {
            "id": str(catalog.id),
            "name": catalog.name,
            "product_count": count,
        }
        for catalog, count in rows
    ]


@router.get("/search")
def search_products(
    q: str = Query("", description="Texto de busqueda"),
    categoria: str = Query("", description="Filtrar por categoria"),
    orden: str = Query("relevance", description="Orden de resultados"),
    min: float = Query(0, alias="min", description="Precio minimo"),
    max: float = Query(0, alias="max", description="Precio maximo"),
    database: Session = Depends(get_db),
):
    query = (
        database.query(Product, Company, Users)
        .join(Company, Product.company_id == Company.id)
        .join(Users, Company.user_id == Users.id)
        .outerjoin(Catalog, Product.catalog_id == Catalog.id)
        .filter(Product.status == "active")
    )

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.descripcion.ilike(search_term),
            )
        )

    if categoria:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{categoria}%"),
                Catalog.name.ilike(f"%{categoria}%"),
            )
        )

    if min > 0:
        query = query.filter(Product.price >= min)

    if max > 0:
        query = query.filter(Product.price <= max)

    if orden == "price_asc":
        query = query.order_by(Product.price.asc())
    elif orden == "price_desc":
        query = query.order_by(Product.price.desc())
    elif orden == "name_asc":
        query = query.order_by(Product.name.asc())
    elif orden == "name_desc":
        query = query.order_by(Product.name.desc())
    else:
        query = query.order_by(Product.name.asc())

    results = query.all()

    products = []
    for product, company, user in results:
        images = product.images if product.images else []
        avg_rating, review_count = _get_product_rating(product.id, database)
        catalog_name = None
        if product.catalog_id:
            catalog = database.query(Catalog).filter(Catalog.id == product.catalog_id).first()
            catalog_name = catalog.name if catalog else None
        products.append({
            "id": str(product.id),
            "name": product.name,
            "price": float(product.price),
            "images": images,
            "descripcion": product.descripcion,
            "stock": product.stock,
            "discount_enable": product.discount_enable,
            "discount_value": float(product.discount_value),
            "company_id": str(company.id),
            "company_name": user.fullName,
            "technical_spec": product.technical_spec,
            "catalog_name": catalog_name,
            "avg_rating": round(avg_rating, 1),
            "review_count": review_count,
        })

    return {"products": products}


@router.get("/{product_id}")
def get_product(product_id: str, database: Session = Depends(get_db)):
    result = (
        database.query(Product, Company, Users)
        .join(Company, Product.company_id == Company.id)
        .join(Users, Company.user_id == Users.id)
        .filter(Product.id == product_id, Product.status == "active")
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    product, company, user = result
    images = product.images if product.images else []
    avg_rating, review_count = _get_product_rating(product.id, database)
    catalog_name = None
    if product.catalog_id:
        catalog = database.query(Catalog).filter(Catalog.id == product.catalog_id).first()
        catalog_name = catalog.name if catalog else None

    return {
        "id": str(product.id),
        "name": product.name,
        "price": float(product.price),
        "images": images,
        "descripcion": product.descripcion,
        "stock": product.stock,
        "discount_enable": product.discount_enable,
        "discount_value": float(product.discount_value),
        "company_id": str(company.id),
        "company_name": user.fullName,
        "technical_spec": product.technical_spec,
        "catalog_id": str(product.catalog_id) if product.catalog_id else None,
        "catalog_name": catalog_name,
        "avg_rating": round(avg_rating, 1),
        "review_count": review_count,
    }


@router.get("/{product_id}/reviews")
def get_product_reviews(product_id: str, database: Session = Depends(get_db)):
    product = database.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    reviews = (
        database.query(Review, Users)
        .join(Users, Review.user_id == Users.id)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(review.id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "created_at": review.created_at,
            "user_name": user.fullName,
        }
        for review, user in reviews
    ]


@router.post("/{product_id}/reviews")
def create_review(
    product_id: str,
    request: Request,
    data: dict,
    database: Session = Depends(get_db),
):
    from app.schemas.SchemaReview import CreateReviewRequest
    validated = CreateReviewRequest(**data)

    user_id = request.state.user_id
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    product = database.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = database.query(Review).filter(
        Review.user_id == user_id,
        Review.product_id == product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya has calificado este producto")

    has_purchased = (
        database.query(Order)
        .join(OrderItem, Order.id == OrderItem.order_id)
        .filter(
            Order.user_id == user_id,
            OrderItem.product_id == product_id,
            Order.status.in_(["delivered", "confirmed", "shipped"])
        )
        .first()
    )
    if not has_purchased:
        raise HTTPException(status_code=403, detail="Solo puedes reseñar productos que hayas comprado")

    review = Review(
        user_id=user_id,
        product_id=product_id,
        rating=validated.rating,
        title=validated.title,
        comment=validated.comment,
    )
    database.add(review)
    database.commit()
    database.refresh(review)

    return {
        "message": "Reseña creada correctamente",
        "id": str(review.id),
    }


@router.get("/{product_id}/related")
def get_related_products(product_id: str, database: Session = Depends(get_db)):
    product = database.query(Product).filter(
        Product.id == product_id,
        Product.status == "active"
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    related = (
        database.query(Product, Company, Users)
        .join(Company, Product.company_id == Company.id)
        .join(Users, Company.user_id == Users.id)
        .filter(
            Product.id != product_id,
            Product.status == "active",
            Product.company_id == product.company_id
        )
        .limit(4)
        .all()
    )

    products = []
    for p, company, user in related:
        images = p.images if p.images else []
        avg_rating, review_count = _get_product_rating(p.id, database)
        catalog_name = None
        if p.catalog_id:
            catalog = database.query(Catalog).filter(Catalog.id == p.catalog_id).first()
            catalog_name = catalog.name if catalog else None
        products.append({
            "id": str(p.id),
            "name": p.name,
            "price": float(p.price),
            "images": images,
            "descripcion": p.descripcion,
            "stock": p.stock,
            "discount_enable": p.discount_enable,
            "discount_value": float(p.discount_value),
            "company_name": user.fullName,
            "catalog_name": catalog_name,
            "avg_rating": round(avg_rating, 1),
            "review_count": review_count,
        })

    return {"products": products}
