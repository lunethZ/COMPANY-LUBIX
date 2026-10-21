from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ModelUser import Users
from app.models.ModelProduct import Product, Catalog
from app.models.ModelOrder import Order, OrderItem
from app.schemas.SchemaProduct import CreateProductRequest, UpdateProductRequest
import uuid

def _get_company_by_user(user_id, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.company:
        raise HTTPException(status_code=403, detail="No tienes una empresa registrada")

    return user, user.company


def _get_sold_by_product(product_ids, database: Session):
    sold_map = {}
    if not product_ids:
        return sold_map

    rows = database.query(
        OrderItem.product_id, func.coalesce(func.sum(OrderItem.quantity), 0)
    ).join(Order).filter(
        OrderItem.product_id.in_(product_ids),
        Order.status != "pending",
    ).group_by(OrderItem.product_id).all()

    for product_id, quantity in rows:
        sold_map[str(product_id)] = int(quantity or 0)

    return sold_map

def create_product_service(user_id: str, data: CreateProductRequest, database: Session):
    user, company = _get_company_by_user(user_id, database)

    if database.query(Product).filter(Product.name == data.name).first():
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese nombre")

    catalog_id = data.catalog_id
    if not catalog_id and data.catalog_name:
        catalog = database.query(Catalog).filter(Catalog.name == data.catalog_name).first()
        if not catalog:
            catalog = Catalog(name=data.catalog_name)
            database.add(catalog)
            database.flush()
        catalog_id = str(catalog.id)
    elif catalog_id:
        catalog = database.query(Catalog).filter(Catalog.id == catalog_id).first()
        if not catalog:
            raise HTTPException(status_code=404, detail="Catálogo no encontrado")

    try:
        new_product = Product(
            name=data.name,
            price=data.price,
            images=data.images or None,
            discount_enable=data.discount_enable,
            discount_value=data.discount_value,
            stock=data.stock,
            descripcion=data.descripcion,
            technical_spec=data.technical_spec or None,
            company_id=company.id,
            catalog_id=catalog_id
        )

        database.add(new_product)
        database.commit()
        database.refresh(new_product)
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al crear el producto")

    return {
        "message": "Producto creado correctamente",
        "id": str(new_product.id),
        "name": new_product.name
    }

def list_products_service(user_id: str, database: Session):
    user, company = _get_company_by_user(user_id, database)

    products = database.query(Product).filter(Product.company_id == company.id).all()

    sold_map = _get_sold_by_product([p.id for p in products], database)

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": float(p.price),
            "images": p.images,
            "discount_enable": p.discount_enable,
            "discount_value": float(p.discount_value),
            "stock": p.stock,
            "descripcion": p.descripcion,
            "technical_spec": p.technical_spec,
            "catalog_id": str(p.catalog_id) if p.catalog_id else None,
            "catalog_name": p.catalog.name if p.catalog else None,
            "company_id": str(p.company_id),
            "status": p.status,
            "sold": sold_map.get(str(p.id), 0)
        }
        for p in products
    ]

def get_product_service(user_id: str, product_id: str, database: Session):
    user, company = _get_company_by_user(user_id, database)

    product = database.query(Product).filter(
        Product.id == product_id,
        Product.company_id == company.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {
        "id": str(product.id),
        "name": product.name,
        "price": float(product.price),
        "images": product.images,
        "discount_enable": product.discount_enable,
        "discount_value": float(product.discount_value),
        "stock": product.stock,
        "descripcion": product.descripcion,
        "technical_spec": product.technical_spec,
        "catalog_id": str(product.catalog_id) if product.catalog_id else None,
        "catalog_name": product.catalog.name if product.catalog else None,
        "company_id": str(product.company_id),
        "status": product.status
    }

def update_product_service(user_id: str, product_id: str, data: UpdateProductRequest, database: Session):
    user, company = _get_company_by_user(user_id, database)

    product = database.query(Product).filter(
        Product.id == product_id,
        Product.company_id == company.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    try:
        if data.name is not None:
            if database.query(Product).filter(
                Product.name == data.name,
                Product.id != product.id
            ).first():
                raise HTTPException(status_code=400, detail="Ya existe un producto con ese nombre")
            product.name = data.name

        if data.price is not None:
            product.price = data.price

        if data.images is not None:
            product.images = data.images

        if data.discount_enable is not None:
            product.discount_enable = data.discount_enable

        if data.discount_value is not None:
            product.discount_value = data.discount_value

        if data.stock is not None:
            product.stock = data.stock

        if data.descripcion is not None:
            product.descripcion = data.descripcion

        if data.technical_spec is not None:
            product.technical_spec = data.technical_spec

        if data.catalog_id is not None:
            catalog = database.query(Catalog).filter(Catalog.id == data.catalog_id).first()
            if not catalog:
                raise HTTPException(status_code=404, detail="Catálogo no encontrado")
            product.catalog_id = data.catalog_id

        database.commit()
        database.refresh(product)
    except HTTPException:
        database.rollback()
        raise
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al actualizar el producto")

    return {
        "message": "Producto actualizado correctamente",
        "id": str(product.id)
    }

def delete_product_service(user_id: str, product_id: str, database: Session):
    user, company = _get_company_by_user(user_id, database)

    product = database.query(Product).filter(
        Product.id == product_id,
        Product.company_id == company.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    try:
        database.delete(product)
        database.commit()
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al eliminar el producto")

    return {
        "message": "Producto eliminado correctamente"
    }

def toggle_product_status_service(user_id: str, product_id: str, database: Session):
    user, company = _get_company_by_user(user_id, database)

    product = database.query(Product).filter(
        Product.id == product_id,
        Product.company_id == company.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    new_status = "inactive" if product.status == "active" else "active"
    product.status = new_status
    database.commit()

    return {
        "message": "El producto cambió su visibilidad correctamente",
        "id": str(product.id),
        "status": new_status
    }