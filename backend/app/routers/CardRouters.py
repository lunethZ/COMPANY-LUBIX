from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.models.ModelUser import Users
from app.models.ModelCart import Cart, CartItem
from app.models.ModelProduct import Product
from app.models.ModelCompany import Company

router = APIRouter(
    prefix="/cart",
    tags=["cart"]
)


class AddItemRequest(BaseModel):
    product_id: str
    quantity: int = 1


class UpdateItemRequest(BaseModel):
    quantity: int


class CartItemEntry(BaseModel):
    product_id: str
    quantity: int = 1


class MergeCartRequest(BaseModel):
    items: list[CartItemEntry]


def _get_or_create_cart(user: Users, database: Session) -> Cart:
    cart = user.cart
    if not cart:
        cart = Cart(user_id=user.id)
        database.add(cart)
        database.flush()
    return cart


def _item_to_dict(item: CartItem) -> dict:
    product = item.product
    image = ""
    if product.images:
        image = product.images[0] if isinstance(product.images, list) else str(product.images)
    price = float(product.price)
    discount_value = float(product.discount_value or 0)
    effective = price
    if product.discount_enable and discount_value > 0:
        effective = price - (price * discount_value / 100)
    return {
        "id": str(item.id),
        "product_id": str(product.id),
        "name": product.name,
        "price": price,
        "discount_enable": product.discount_enable,
        "discount_value": discount_value,
        "unit_price": round(effective, 2),
        "image": image,
        "stock": product.stock,
        "quantity": item.quantity,
        "line_total": round(effective * item.quantity, 2),
    }


@router.get("")
def get_cart(request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cart = user.cart
    items = []
    subtotal = 0
    total_items = 0
    if cart:
        for item in cart.items:
            if not item.product or item.product.status != "active":
                continue
            d = _item_to_dict(item)
            items.append(d)
            subtotal += d["line_total"]
            total_items += item.quantity

    return {
        "items": items,
        "subtotal": round(subtotal, 2),
        "total_items": total_items,
    }


@router.post("/items")
def add_item(request: Request, data: AddItemRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    product = database.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.status != "active":
        raise HTTPException(status_code=400, detail="El producto no está disponible")

    quantity = max(1, data.quantity)
    if product.stock < quantity:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Disponible: {product.stock}")

    cart = _get_or_create_cart(user, database)

    existing = database.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id
    ).first()

    if existing:
        new_qty = existing.quantity + quantity
        if product.stock < new_qty:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente. Disponible: {product.stock}")
        existing.quantity = new_qty
    else:
        existing = CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity)
        database.add(existing)

    cart.updated_at = func.now()
    database.commit()
    database.refresh(existing)

    return {"message": "Producto agregado al carrito", "item": _item_to_dict(existing)}


@router.patch("/items/{product_id}")
def update_item(product_id: str, request: Request, data: UpdateItemRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user or not user.cart:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")

    existing = database.query(CartItem).filter(
        CartItem.cart_id == user.cart.id,
        CartItem.product_id == product_id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="El producto no está en el carrito")

    if data.quantity <= 0:
        database.delete(existing)
        database.commit()
        return {"message": "Producto eliminado del carrito"}

    product = existing.product
    if product and data.quantity > product.stock:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Disponible: {product.stock}")

    existing.quantity = data.quantity
    user.cart.updated_at = func.now()
    database.commit()

    return {"message": "Cantidad actualizada", "item": _item_to_dict(existing)}


@router.delete("/items/{product_id}")
def remove_item(product_id: str, request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user or not user.cart:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")

    existing = database.query(CartItem).filter(
        CartItem.cart_id == user.cart.id,
        CartItem.product_id == product_id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="El producto no está en el carrito")

    database.delete(existing)
    database.commit()
    return {"message": "Producto eliminado del carrito"}


@router.delete("")
def clear_cart(request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.cart:
        database.query(CartItem).filter(CartItem.cart_id == user.cart.id).delete()
        database.commit()

    return {"message": "Carrito vaciado correctamente"}


@router.post("/merge")
def merge_cart(request: Request, data: MergeCartRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cart = _get_or_create_cart(user, database)

    for entry in data.items:
        product = database.query(Product).filter(Product.id == entry.product_id).first()
        if not product or product.status != "active":
            continue

        quantity = max(1, entry.quantity)
        existing = database.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product.id
        ).first()

        if existing:
            existing.quantity = min(existing.quantity + quantity, product.stock)
        else:
            database.add(CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=min(quantity, product.stock)
            ))

    cart.updated_at = func.now()
    database.commit()

    return get_cart(request, database)