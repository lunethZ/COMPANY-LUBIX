from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ModelUser import Users
from app.models.ModelProduct import Product
from app.models.ModelReview import Review
from app.models.ModelOrder import Order, OrderItem
from app.models.ModelCompany import Company
from fastapi import HTTPException
from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest, UpdateBannerAndLogoRequest
from datetime import datetime, timedelta


def _get_company_metrics(company_id, database: Session):
    total_reviews = database.query(func.count(Review.id)).join(Product).filter(
        Product.company_id == company_id
    ).scalar() or 0

    avg_rating_result = database.query(func.avg(Review.rating)).join(Product).filter(
        Product.company_id == company_id
    ).scalar()
    avg_rating = round(float(avg_rating_result), 1) if avg_rating_result else 0.0

    product_ids = [p.id for p in database.query(Product.id).filter(Product.company_id == company_id).all()]

    complete_sales = 0
    total_revenue = 0
    if product_ids:
        sales_result = database.query(
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.price * OrderItem.quantity), 0),
        ).join(Order).filter(
            OrderItem.product_id.in_(product_ids),
            Order.status != "pending",
        ).first()
        complete_sales = int(sales_result[0]) if sales_result else 0
        total_revenue = float(sales_result[1]) if sales_result else 0

    if complete_sales >= 500:
        seller_level = "Diamond"
    elif complete_sales >= 200:
        seller_level = "Platinum"
    elif complete_sales >= 50:
        seller_level = "Gold"
    elif complete_sales >= 10:
        seller_level = "Silver"
    else:
        seller_level = "Bronze"

    return {
        "totalReviews": total_reviews,
        "averageRating": avg_rating,
        "completeSales": complete_sales,
        "totalRevenue": total_revenue,
        "sellerLevel": seller_level,
    }


def company_dashboard_me_service(user_id, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    company = user.company
    role = user.role
    metrics = _get_company_metrics(company.id, database)

    return {
        "nameCompany": company.nameCompany,
        "addressCompany": company.addressCompany,
        "emailCompany": user.email,
        "tellCompany": user.tell,
        "memberAT": user.created_at,
        "role": role.name,
        "sales": metrics["completeSales"],
        "totalRevenue": metrics["totalRevenue"],
        "stars": metrics["averageRating"],
        "reviews": metrics["totalReviews"],
    }


def company_dashboard_my_profile_service(user_id: str, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    company = user.company
    metrics = _get_company_metrics(company.id, database)

    return {
        "nameCompany": company.nameCompany,
        "emailCompany": user.email,
        "addressCompany": company.addressCompany,
        "tellCompany": user.tell,
        "memberAT": user.created_at,
        "averageRating": metrics["averageRating"],
        "totalReviews": metrics["totalReviews"],
        "completeSales": metrics["completeSales"],
        "totalRevenue": metrics["totalRevenue"],
        "sellerLevel": metrics["sellerLevel"],
    }


def company_dashboard_upgrade_my_profile_service(user_id: str, CompanyRequest:UpdateInformationCompanyRequest,database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if CompanyRequest.emailCompany and CompanyRequest.emailCompany != user.email:
        existing_email = database.query(Users).filter(Users.email == CompanyRequest.emailCompany).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="El correo ya esta en uso")
    
    
    company = user.company

    try:

        if CompanyRequest.nameCompany is not None:
            company.nameCompany = CompanyRequest.nameCompany

        if CompanyRequest.emailCompany is not None:
            user.email = CompanyRequest.emailCompany
        
        if CompanyRequest.tellCompany is not None:
            user.tell = CompanyRequest.tellCompany
        
        if CompanyRequest.addressCompany is not None:
            company.addressCompany = CompanyRequest.addressCompany
        
        database.commit()
        database.refresh(user)
        database.refresh(company)

    except Exception as e:
        database.rollback()

        print("ERROR:",e)
        raise HTTPException(status_code=500, detail="En actualizar datos")
    
    return {
        "messaje": "Perfil actualizado correctamente"
    }


def company_orders_service(user_id: str, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user or not user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    company_id = user.company.id

    product_ids = [p.id for p in database.query(Product.id).filter(Product.company_id == company_id).all()]

    if not product_ids:
        return []

    order_ids_q = database.query(OrderItem.order_id).filter(
        OrderItem.product_id.in_(product_ids)
    ).distinct().subquery()

    orders = database.query(Order).filter(Order.id.in_(order_ids_q)).order_by(Order.created_at.desc()).all()

    status_progress = {
        "pending": 15,
        "confirmed": 35,
        "shipped": 65,
        "delivered": 100,
        "cancelled": 0,
    }

    result = []
    for order in orders:
        items = []
        for item in order.items:
            if item.product_id in product_ids:
                items.append({
                    "id": str(item.id),
                    "product_id": str(item.product_id) if item.product_id else None,
                    "name": item.name,
                    "price": float(item.price),
                    "quantity": item.quantity,
                })

        created = order.created_at
        if isinstance(created, datetime):
            estimated_delivery = created + timedelta(days=5)
            estimated_str = estimated_delivery.strftime("%Y-%m-%d")
            created_str = created.strftime("%Y-%m-%dT%H:%M:%S")
        else:
            estimated_str = ""
            created_str = str(created)

        buyer_user = database.query(Users).filter(Users.id == order.user_id).first()

        result.append({
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
            "buyer_email": buyer_user.email if buyer_user else "",
            "buyer_name": buyer_user.fullName if buyer_user else "",
            "items": items,
        })

    return result


def company_update_order_status_service(user_id: str, order_id: str, new_status: str, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user or not user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    valid_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["shipped", "cancelled"],
        "shipped": ["delivered"],
    }

    order = database.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    allowed = valid_transitions.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede cambiar de '{order.status}' a '{new_status}'"
        )

    company_id = user.company.id
    product_ids = [p.id for p in database.query(Product.id).filter(Product.company_id == company_id).all()]

    has_company_items = any(item.product_id in product_ids for item in order.items)
    if not has_company_items:
        raise HTTPException(status_code=403, detail="Este pedido no contiene productos de tu empresa")

    try:
        order.status = new_status
        database.commit()
    except Exception as e:
        database.rollback()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Error al actualizar el pedido")

    status_progress = {
        "pending": 15,
        "confirmed": 35,
        "shipped": 65,
        "delivered": 100,
        "cancelled": 0,
    }

    return {
        "message": "Estado del pedido actualizado correctamente",
        "status": order.status,
        "delivery_progress": status_progress.get(order.status, 0),
    }


def company_upload_logo_service(user_id: str, file, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user or not user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    from app.services.NasService import subir

    result = subir.upload_stream(file)
    if not result or not result.get("success"):
        raise HTTPException(status_code=500, detail="Error al subir la imagen")

    company = user.company
    company.CompanyLogo = result["path"]
    database.commit()
    database.refresh(company)

    return {
        "message": "Logo actualizado correctamente",
        "logo": company.CompanyLogo,
    }


def company_upload_banner_service(user_id: str, file, database: Session):
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user or not user.company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    from app.services.NasService import subir

    result = subir.upload_stream(file)
    if not result or not result.get("success"):
        raise HTTPException(status_code=500, detail="Error al subir la imagen")

    company = user.company
    company.CompanyBanner = result["path"]
    database.commit()
    database.refresh(company)

    return {
        "message": "Banner actualizado correctamente",
        "banner": company.CompanyBanner,
    }
