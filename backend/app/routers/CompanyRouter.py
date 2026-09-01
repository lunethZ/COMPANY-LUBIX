from fastapi import APIRouter, Request,Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.Connection import get_db
from app.services.NasService import subir

from app.services.DashboardService.company.Products import (
    create_product_service,
    list_products_service,
    get_product_service,
    update_product_service,
    delete_product_service,
    toggle_product_status_service
)

from app.services.DashboardService.company.Dasboard import (
    company_dashboard_me_service, 
    company_dashboard_my_profile_service,
    company_dashboard_upgrade_my_profile_service,
    company_orders_service,
    company_update_order_status_service,
    company_upload_logo_service,
    company_upload_banner_service,
)

from app.schemas.SchemaDashboard.ShemaCompany import UpdateInformationCompanyRequest, UpdateBannerAndLogoRequest
from app.schemas.SchemaProduct import CreateProductRequest, UpdateProductRequest


router = APIRouter(
    prefix=("/company"),
    tags=["company"]
)

@router.get("/dashboard/me")
def dashboard(request: Request, database: Session = Depends(get_db)):

    user_id = request.state.user_id
    
    return company_dashboard_me_service(
        user_id, 
        database
    )

@router.get("/dashboard/my-profile")
def get_info_company(request:Request, database: Session =Depends(get_db)):
    user_id = request.state.user_id
    return company_dashboard_my_profile_service(user_id, database)

@router.patch("/dashboard/upgrade-my-profile")
def upgrade_info_company_profile(request: Request, upgrade_profile: UpdateInformationCompanyRequest,database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return company_dashboard_upgrade_my_profile_service(user_id, upgrade_profile, database)

@router.get("/products")
def list_products(request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return list_products_service(user_id, database)

@router.get("/products/{product_id}")
def get_product(product_id: str, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return get_product_service(user_id, product_id, database)

@router.post("/products")
def create_product(product: CreateProductRequest, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return create_product_service(user_id, product, database)

@router.patch("/products/{product_id}")
def update_product(product_id: str, product: UpdateProductRequest, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return update_product_service(user_id, product_id, product, database)

@router.patch("/products/{product_id}/status")
def toggle_status(product_id: str, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return toggle_product_status_service(user_id, product_id, database)

@router.delete("/products/{product_id}")
def delete_product(product_id: str, request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return delete_product_service(user_id, product_id, database)

@router.get("/orders")
def list_company_orders(request: Request, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return company_orders_service(user_id, database)

@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, request: Request, data: dict, database: Session = Depends(get_db)):
    user_id = request.state.user_id
    new_status = data.get("status", "")
    return company_update_order_status_service(user_id, order_id, new_status, database)

@router.patch("/dashboard/upload-logo")
def upload_logo(request: Request, file: UploadFile = File(...), database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return company_upload_logo_service(user_id, file, database)

@router.patch("/dashboard/upload-banner")
def upload_banner(request: Request, file: UploadFile = File(...), database: Session = Depends(get_db)):
    user_id = request.state.user_id
    return company_upload_banner_service(user_id, file, database)

@router.post("/products/upload-image")
def upload_product_image(request: Request, file: UploadFile = File(...), database: Session = Depends(get_db)):
    user_id = request.state.user_id
    from app.models.ModelUser import Users
    from fastapi import HTTPException
    user = database.query(Users).filter(Users.id == user_id).first()
    if not user or not user.company:
        raise HTTPException(status_code=403, detail="No tienes una empresa registrada")
    result = subir.upload_file(file, "products/")
    if not result or not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message", "Error al subir la imagen") if result else "Error al subir la imagen")
    object_name = result["object_name"]
    return {"success": True, "path": object_name, "url": f"/files/{object_name}", "object_name": object_name}
