from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.models.ModelUser import Users
from app.models.ModelAddress import Address
from app.models.ModelOrder import Order, OrderItem
from app.models.ModelProduct import Product
from app.services.NasService import subir
from app.schemas.SchemaUser import (
    UpdateUserProfileRequest,
    ChangePasswordRequest,
    CreateAddressRequest,
    UpdateAddressRequest,
    CreateOrderRequest
)
from app.utils.Security import hash_password, verify_password

router = APIRouter(
    prefix="/user",
    tags=["user"]
)

@router.get("/dashboard/me")
def user_dashboard_me(request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    from app.models.ModelFavorite import Favorite
    from sqlalchemy import func

    total_orders = database.query(func.count(Order.id)).filter(Order.user_id == user.id).scalar() or 0
    total_spent = database.query(func.coalesce(func.sum(Order.total), 0)).filter(Order.user_id == user.id).scalar() or 0
    saved_products = database.query(func.count(Favorite.id)).filter(Favorite.user_id == user.id).scalar() or 0

    return {
        "fullName": user.fullName,
        "email": user.email,
        "tell": user.tell,
        "memberSince": user.created_at,
        "role": user.role.name,
        "totalOrders": total_orders,
        "totalSpent": float(total_spent),
        "savedProducts": saved_products,
        "addresses": len(user.addresses),
        "avatar": user.avatar,
        "banner": user.banner,
    }

@router.patch("/profile")
def update_profile(request: Request, data: UpdateUserProfileRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    try:
        if data.fullName is not None:
            user.fullName = data.fullName

        if data.tell is not None:
            user.tell = data.tell

        database.commit()
        database.refresh(user)
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al actualizar el perfil")

    return {
        "message": "Perfil actualizado correctamente",
        "fullName": user.fullName,
        "email": user.email,
        "tell": user.tell
    }

@router.patch("/change-password")
def change_password(request: Request, data: ChangePasswordRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    user.hashed_password = hash_password(data.new_password)
    database.commit()

    return {
        "message": "Contraseña actualizada correctamente"
    }

@router.delete("/account")
def delete_account(request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    try:
        database.delete(user)
        database.commit()
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al eliminar la cuenta")

    return {
        "message": "Cuenta eliminada correctamente"
    }

@router.get("/export")
def export_user_data(request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "fullName": user.fullName,
        "email": user.email,
        "tell": user.tell,
        "role": user.role.name,
        "verified": user.verified,
        "memberSince": user.created_at,
        "addresses": [
            {
                "label": a.label,
                "address": a.address,
                "city": a.city,
                "department": a.department,
                "postal_code": a.postal_code,
                "is_default": a.is_default,
            }
            for a in user.addresses
        ]
    }

@router.get("/addresses")
def list_addresses(request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return [
        {
            "id": str(a.id),
            "label": a.label,
            "address": a.address,
            "city": a.city,
            "department": a.department,
            "postal_code": a.postal_code,
            "is_default": a.is_default,
        }
        for a in user.addresses
    ]

@router.post("/addresses")
def create_address(request: Request, data: CreateAddressRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.is_default:
        database.query(Address).filter(Address.user_id == user.id).update({"is_default": False})

    new_address = Address(
        user_id=user.id,
        label=data.label,
        address=data.address,
        city=data.city,
        department=data.department,
        postal_code=data.postal_code,
        is_default=data.is_default,
    )
    database.add(new_address)
    database.commit()
    database.refresh(new_address)

    return {
        "message": "Dirección agregada correctamente",
        "id": str(new_address.id)
    }

@router.patch("/addresses/{address_id}")
def update_address(address_id: str, request: Request, data: UpdateAddressRequest, database: Session = Depends(get_db)):
    address = database.query(Address).filter(
        Address.id == address_id,
        Address.user_id == request.state.user_id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")

    if data.is_default:
        database.query(Address).filter(Address.user_id == request.state.user_id).update({"is_default": False})

    if data.label is not None:
        address.label = data.label
    if data.address is not None:
        address.address = data.address
    if data.city is not None:
        address.city = data.city
    if data.department is not None:
        address.department = data.department
    if data.postal_code is not None:
        address.postal_code = data.postal_code
    if data.is_default is not None:
        address.is_default = data.is_default

    database.commit()

    return {
        "message": "Dirección actualizada correctamente"
    }

@router.delete("/addresses/{address_id}")
def delete_address(address_id: str, request: Request, database: Session = Depends(get_db)):
    address = database.query(Address).filter(
        Address.id == address_id,
        Address.user_id == request.state.user_id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")

    database.delete(address)
    database.commit()

    return {
        "message": "Dirección eliminada correctamente"
    }

@router.post("/avatar/upload")
def upload_avatar(request: Request, file: UploadFile = File(...), database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    result = subir.upload_file(file, "avatars/")
    if not result or not result.get("success"):
        raise HTTPException(status_code=500, detail="Error al subir avatar")
    user.avatar = result["object_name"]
    database.commit()
    database.refresh(user)
    return {"success": True, "avatar": user.avatar, "url": f"/files/{user.avatar}"}

@router.post("/banner/upload")
def upload_banner(request: Request, file: UploadFile = File(...), database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    result = subir.upload_file(file, "banners/")
    if not result or not result.get("success"):
        raise HTTPException(status_code=500, detail="Error al subir banner")
    user.banner = result["object_name"]
    database.commit()
    database.refresh(user)
    return {"success": True, "banner": user.banner, "url": f"/files/{user.banner}"}

def _order_to_dict(order: Order):
    from datetime import datetime, timedelta
    created = order.created_at
    if isinstance(created, datetime):
        estimated_delivery = created + timedelta(days=5)
        estimated_str = estimated_delivery.strftime("%Y-%m-%d")
        created_str = created.strftime("%Y-%m-%dT%H:%M:%S")
    else:
        estimated_str = ""
        created_str = str(created)

    status_progress = {
        "pending": 15,
        "confirmed": 35,
        "shipped": 65,
        "delivered": 100,
        "cancelled": 0,
    }

    return {
        "id": str(order.id),
        "status": order.status,
        "subtotal": float(order.subtotal),
        "discount": float(order.discount),
        "shipping": float(order.shipping),
        "total": float(order.total),
        "payment_method": order.payment_method,
        "recipient": order.recipient,
        "address": order.address,
        "city": order.city,
        "department": order.department,
        "postal_code": order.postal_code,
        "created_at": created_str,
        "estimated_delivery": estimated_str,
        "delivery_progress": status_progress.get(order.status, 0),
        "items": [
            {
                "id": str(i.id),
                "product_id": str(i.product_id) if i.product_id else None,
                "name": i.name,
                "price": float(i.price),
                "quantity": i.quantity
            }
            for i in order.items
        ]
    }

@router.post("/orders")
def create_order(request: Request, data: CreateOrderRequest, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not data.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")

    for item in data.items:
        if item.product_id:
            product = database.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")
            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{product.name}'. Disponible: {product.stock}")

    try:
        new_order = Order(
            user_id=user.id,
            status="pending",
            subtotal=data.subtotal,
            discount=data.discount,
            shipping=data.shipping,
            total=data.total,
            payment_method=data.payment_method,
            recipient=data.recipient,
            address=data.address,
            city=data.city,
            department=data.department,
            postal_code=data.postal_code
        )

        for item in data.items:
            new_order.items.append(OrderItem(
                name=item.name,
                price=item.price,
                quantity=item.quantity,
                product_id=item.product_id
            ))

        for item in data.items:
            if item.product_id:
                product = database.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock -= item.quantity

        database.add(new_order)
        database.commit()
        database.refresh(new_order)
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al crear el pedido")

    return {
        "message": "Pedido creado correctamente",
        "id": str(new_order.id),
        "status": new_order.status
    }

@router.get("/orders")
def list_orders(request: Request, database: Session = Depends(get_db)):
    user = database.query(Users).filter(Users.id == request.state.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    orders = database.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()

    return [_order_to_dict(o) for o in orders]

@router.get("/orders/{order_id}")
def get_order(order_id: str, request: Request, database: Session = Depends(get_db)):
    order = database.query(Order).filter(
        Order.id == order_id,
        Order.user_id == request.state.user_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    return _order_to_dict(order)

@router.patch("/orders/{order_id}/cancel")
def cancel_order(order_id: str, request: Request, database: Session = Depends(get_db)):
    order = database.query(Order).filter(
        Order.id == order_id,
        Order.user_id == request.state.user_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if order.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="El pedido ya no puede cancelarse")

    for item in order.items:
        if item.product_id:
            product = database.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    order.status = "cancelled"
    database.commit()

    return {
        "message": "Pedido cancelado correctamente",
        "status": order.status
    }

@router.get("/orders/{order_id}/invoice")
def order_invoice(order_id: str, request: Request, database: Session = Depends(get_db)):
    order = database.query(Order).filter(
        Order.id == order_id,
        Order.user_id == request.state.user_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    return {
        "invoice_number": f"INV-{str(order.id)[:8].upper()}",
        "date": order.created_at,
        "company": {
            "name": "LUBIX S.A.S",
            "nit": "900000000-0"
        },
        "customer": {
            "name": order.recipient,
            "address": order.address,
            "city": order.city,
            "department": order.department,
            "postal_code": order.postal_code
        },
        "items": [
            {
                "name": i.name,
                "price": float(i.price),
                "quantity": i.quantity,
                "total": float(i.price) * i.quantity
            }
            for i in order.items
        ],
        "subtotal": float(order.subtotal),
        "discount": float(order.discount),
        "shipping": float(order.shipping),
        "total": float(order.total),
        "payment_method": order.payment_method,
        "status": order.status
    }