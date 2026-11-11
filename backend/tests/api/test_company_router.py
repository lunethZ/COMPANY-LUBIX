import uuid

import pytest

from app.models.ModelCompany import Company
from app.models.ModelOrder import Order, OrderItem
from app.models.ModelProduct import Catalog, Product
from app.models.ModelReview import Review
from app.models.ModelRole import Role
from app.models.ModelUser import Users
from app.services.authentication.JWTService import create_access_token
from app.utils.Security import hash_password


pytestmark = pytest.mark.api


def _crear_venta(api_db_session, product, buyer, quantity, status="delivered"):
    order = Order(
        status=status,
        subtotal=product.price * quantity,
        discount=0,
        shipping=0,
        total=product.price * quantity,
        payment_method="efectivo",
        recipient=buyer.fullName,
        address="Calle 1",
        city="Bogota",
        department="Cundinamarca",
        postal_code="110111",
        user_id=buyer.id,
    )
    api_db_session.add(order)
    api_db_session.flush()
    api_db_session.add(
        OrderItem(
            name=product.name,
            price=product.price,
            quantity=quantity,
            product_id=product.id,
            order_id=order.id,
        )
    )
    api_db_session.commit()
    api_db_session.refresh(order)
    return order


@pytest.fixture
def company_company(api_fake_company, api_db_session):
    return (
        api_db_session.query(Company)
        .filter(Company.user_id == api_fake_company.id)
        .first()
    )


@pytest.fixture
def company_product(company_company, api_db_session):
    product = Product(
        name="Producto dashboard",
        price=100.0,
        images=["/files/dashboard.jpg"],
        discount_enable=False,
        discount_value=0,
        stock=20,
        descripcion="Producto para el dashboard",
        technical_spec={},
        company_id=company_company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def company_review(company_product, api_fake_user, api_db_session):
    review = Review(
        user_id=api_fake_user.id,
        product_id=company_product.id,
        rating=4,
        title="Buen producto",
        comment="Comentario de prueba",
    )
    api_db_session.add(review)
    api_db_session.commit()
    api_db_session.refresh(review)
    return review


@pytest.fixture
def company_user_without_company(api_db_session):
    role = api_db_session.query(Role).filter(Role.name == "company").first()
    user = Users(
        fullName="Company Without Record",
        email="company-without-record@example.com",
        hashed_password=hash_password("CompanyPass123"),
        tell="1234567890",
        role_id=role.id,
        verified=True,
        isActive=True,
    )
    api_db_session.add(user)
    api_db_session.commit()
    api_db_session.refresh(user)
    return user


@pytest.fixture
def company_headers_without_company(company_user_without_company):
    token = create_access_token(
        user_id=str(company_user_without_company.id), role="company"
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def company_unknown_user_headers():
    token = create_access_token(user_id=str(uuid.uuid4()), role="company")
    return {"Authorization": f"Bearer {token}"}


class TestCompanyRouterTanda1:
    """Tests para la tanda 1 de /company."""

    def test_dashboard_me_sin_productos_devuelve_metricas_en_cero(
        self, api_client, api_auth_headers_company, api_fake_company, company_company
    ):
        response = api_client.get(
            "/company/dashboard/me", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {
            "nameCompany",
            "addressCompany",
            "emailCompany",
            "tellCompany",
            "memberAT",
            "role",
            "sales",
            "totalRevenue",
            "stars",
            "reviews",
        }
        assert data["nameCompany"] == company_company.nameCompany
        assert data["addressCompany"] == company_company.addressCompany
        assert data["emailCompany"] == api_fake_company.email
        assert data["tellCompany"] == api_fake_company.tell
        assert data["role"] == "company"
        assert data["sales"] == 0
        assert data["totalRevenue"] == 0
        assert data["stars"] == 0
        assert data["reviews"] == 0

    def test_dashboard_me_con_ventas_y_reviews(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_user,
        company_product,
        company_review,
        api_db_session,
    ):
        _crear_venta(api_db_session, company_product, api_fake_user, 2)

        response = api_client.get(
            "/company/dashboard/me", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        data = response.json()
        assert data["sales"] == 2
        assert data["totalRevenue"] == 200.0
        assert data["stars"] == 4.0
        assert data["reviews"] == 1

    def test_dashboard_me_sin_token_devuelve_401(self, api_client):
        response = api_client.get("/company/dashboard/me")

        assert response.status_code == 401
        assert response.json()["detail"] == "Token requerido"

    def test_dashboard_me_rol_user_devuelve_401(
        self, api_client, api_auth_headers_user
    ):
        response = api_client.get(
            "/company/dashboard/me", headers=api_auth_headers_user
        )

        assert response.status_code == 401
        assert (
            response.json()["detail"]
            == "no tienes permiso para acceder a este recurso"
        )

    def test_dashboard_me_usuario_inexistente_devuelve_404(
        self, api_client, company_unknown_user_headers
    ):
        # Token company valido para un UUID que no existe en la BD: AuthMiddleware
        # solo valida el JWT; el servicio devuelve 404 al no encontrar el usuario.
        response = api_client.get(
            "/company/dashboard/me", headers=company_unknown_user_headers
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_hallazgo_h4_company_sin_registro_dashboard_devuelve_401(
        self, api_client, company_headers_without_company
    ):
        # HALLAZGO H4: company_dashboard_me_service accede a company.id con company
        # None; el AttributeError es capturado por AuthMiddleware y devuelve 401,
        # no el 500 que sugeria el hallazgo preliminar.
        response = api_client.get(
            "/company/dashboard/me", headers=company_headers_without_company
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"

    def test_my_profile_devuelve_claves_y_metricas(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_company,
        company_company,
        api_fake_user,
        company_product,
        company_review,
        api_db_session,
    ):
        _crear_venta(api_db_session, company_product, api_fake_user, 2)

        response = api_client.get(
            "/company/dashboard/my-profile", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {
            "nameCompany",
            "emailCompany",
            "addressCompany",
            "tellCompany",
            "memberAT",
            "averageRating",
            "totalReviews",
            "completeSales",
            "totalRevenue",
            "sellerLevel",
            "logo",
            "banner",
        }
        assert data["nameCompany"] == company_company.nameCompany
        assert data["emailCompany"] == api_fake_company.email
        assert data["addressCompany"] == company_company.addressCompany
        assert data["tellCompany"] == api_fake_company.tell
        assert data["averageRating"] == 4.0
        assert data["totalReviews"] == 1
        assert data["completeSales"] == 2
        assert data["totalRevenue"] == 200.0
        assert data["sellerLevel"] == "Bronze"
        assert data["logo"] is None
        assert data["banner"] is None

    @pytest.mark.parametrize(
        ("quantity", "expected_level"),
        [
            (0, "Bronze"),
            (10, "Silver"),
            (50, "Gold"),
            (200, "Platinum"),
            (500, "Diamond"),
        ],
    )
    def test_my_profile_nivel_vendedor(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_user,
        company_product,
        api_db_session,
        quantity,
        expected_level,
    ):
        _crear_venta(api_db_session, company_product, api_fake_user, quantity)

        response = api_client.get(
            "/company/dashboard/my-profile", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        assert response.json()["sellerLevel"] == expected_level

    def test_my_profile_usuario_inexistente_devuelve_404(
        self, api_client, company_unknown_user_headers
    ):
        # Token company valido para un UUID que no existe en la BD: AuthMiddleware
        # solo valida el JWT; el servicio devuelve 404 al no encontrar el usuario.
        response = api_client.get(
            "/company/dashboard/my-profile", headers=company_unknown_user_headers
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_upgrade_my_profile_exitoso_y_hallazgo_h5(
        self, api_client, api_auth_headers_company, api_fake_company, company_company, api_db_session
    ):
        # HALLAZGO H5: la respuesta usa la clave "messaje" (typo), no "message".
        response = api_client.patch(
            "/company/dashboard/upgrade-my-profile",
            json={
                "nameCompany": "Company Actualizada",
                "emailCompany": "company-updated@example.com",
                "tellCompany": "999888777",
                "addressCompany": "Calle Actualizada 789",
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {"messaje"}
        assert data["messaje"] == "Perfil actualizado correctamente"
        assert "message" not in data

        api_db_session.refresh(api_fake_company)
        api_db_session.refresh(company_company)
        assert company_company.nameCompany == "Company Actualizada"
        assert company_company.addressCompany == "Calle Actualizada 789"
        assert api_fake_company.email == "company-updated@example.com"
        assert api_fake_company.tell == "999888777"

    def test_upgrade_my_profile_email_en_uso_devuelve_400(
        self, api_client, api_auth_headers_company, api_db_session
    ):
        role = api_db_session.query(Role).filter(Role.name == "user").first()
        other_user = Users(
            fullName="Other User",
            email="used-email@example.com",
            hashed_password=hash_password("OtherPass123"),
            tell="1234567890",
            role_id=role.id,
            verified=True,
            isActive=True,
        )
        api_db_session.add(other_user)
        api_db_session.commit()

        response = api_client.patch(
            "/company/dashboard/upgrade-my-profile",
            json={"emailCompany": "used-email@example.com"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "El correo ya esta en uso"

    def test_upgrade_my_profile_usuario_inexistente_devuelve_404(
        self, api_client, company_unknown_user_headers
    ):
        # Token company valido para un UUID que no existe en la BD: AuthMiddleware
        # solo valida el JWT; el servicio devuelve 404 al no encontrar el usuario.
        response = api_client.patch(
            "/company/dashboard/upgrade-my-profile",
            json={"nameCompany": "Nueva Empresa"},
            headers=company_unknown_user_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_upgrade_my_profile_sin_empresa_devuelve_500(
        self, api_client, company_headers_without_company
    ):
        # HALLAZGO H4/H6: el dashboard sin empresa devuelve 401 porque el
        # AttributeError escapa del servicio y AuthMiddleware lo captura. En
        # upgrade-my-profile el servicio atrapa la excepcion y lanza una
        # HTTPException(500) explicita, que FastAPI responde como 500 antes de
        # que el middleware pueda disfrazarla de 401.
        response = api_client.patch(
            "/company/dashboard/upgrade-my-profile",
            json={"nameCompany": "Nueva Empresa"},
            headers=company_headers_without_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "En actualizar datos"

    def test_upgrade_my_profile_error_al_guardar_devuelve_500(
        self, api_client, api_auth_headers_company, api_db_session, monkeypatch
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.patch(
            "/company/dashboard/upgrade-my-profile",
            json={"nameCompany": "Nueva Empresa"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "En actualizar datos"

    def test_upload_logo_exitoso(
        self, api_client, api_auth_headers_company, company_company, api_db_session
    ):
        response = api_client.patch(
            "/company/dashboard/upload-logo",
            files={"file": ("logo.png", b"contenido", "image/png")},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "Logo actualizado correctamente",
            "logo": "test.jpg",
        }

        api_db_session.refresh(company_company)
        assert company_company.CompanyLogo == "test.jpg"

    def test_upload_logo_fallo_devuelve_500(
        self, api_client, api_auth_headers_company, monkeypatch
    ):
        monkeypatch.setattr(
            "app.services.NasService.subir.upload_file",
            lambda *args, **kwargs: {"success": False},
        )

        response = api_client.patch(
            "/company/dashboard/upload-logo",
            files={"file": ("logo.png", b"contenido", "image/png")},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al subir la imagen"

    def test_upload_logo_sin_empresa_devuelve_404(
        self, api_client, company_headers_without_company
    ):
        response = api_client.patch(
            "/company/dashboard/upload-logo",
            files={"file": ("logo.png", b"contenido", "image/png")},
            headers=company_headers_without_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"

    def test_upload_banner_exitoso(
        self, api_client, api_auth_headers_company, company_company, api_db_session
    ):
        response = api_client.patch(
            "/company/dashboard/upload-banner",
            files={"file": ("banner.png", b"contenido", "image/png")},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "Banner actualizado correctamente",
            "banner": "test.jpg",
        }

        api_db_session.refresh(company_company)
        assert company_company.CompanyBanner == "test.jpg"

    def test_upload_banner_fallo_devuelve_500(
        self, api_client, api_auth_headers_company, monkeypatch
    ):
        monkeypatch.setattr(
            "app.services.NasService.subir.upload_file",
            lambda *args, **kwargs: {"success": False},
        )

        response = api_client.patch(
            "/company/dashboard/upload-banner",
            files={"file": ("banner.png", b"contenido", "image/png")},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al subir la imagen"

    def test_upload_banner_sin_empresa_devuelve_404(
        self, api_client, company_headers_without_company
    ):
        response = api_client.patch(
            "/company/dashboard/upload-banner",
            files={"file": ("banner.png", b"contenido", "image/png")},
            headers=company_headers_without_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"

    def test_upload_image_exitoso(self, api_client, api_auth_headers_company):
        response = api_client.post(
            "/company/products/upload-image",
            files={"file": ("producto.png", b"contenido", "image/png")},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        assert response.json() == {
            "success": True,
            "path": "test.jpg",
            "url": "/files/test.jpg",
            "object_name": "test.jpg",
        }

    def test_upload_image_fallo_devuelve_500(
        self, api_client, api_auth_headers_company, monkeypatch
    ):
        monkeypatch.setattr(
            "app.services.NasService.subir.upload_file",
            lambda *args, **kwargs: {"success": False},
        )

        response = api_client.post(
            "/company/products/upload-image",
            files={"file": ("producto.png", b"contenido", "image/png")},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al subir la imagen"

    def test_upload_image_sin_empresa_devuelve_403(
        self, api_client, company_headers_without_company
    ):
        response = api_client.post(
            "/company/products/upload-image",
            files={"file": ("producto.png", b"contenido", "image/png")},
            headers=company_headers_without_company,
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "No tienes una empresa registrada"

    def test_hallazgo_h6_error_interno_en_ruta_protegida_devuelve_401(
        self, api_client, api_auth_headers_company, monkeypatch
    ):
        # HALLAZGO H6: AuthMiddleware captura la excepcion interna y la devuelve
        # como 401 "Token invalido" en rutas protegidas; el endpoint no llega a 500.
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(
            "app.services.DashboardService.company.Dasboard._get_company_metrics",
            _fallar,
        )

        response = api_client.get(
            "/company/dashboard/my-profile", headers=api_auth_headers_company
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"


PRODUCT_LIST_KEYS = {
    "id",
    "name",
    "price",
    "images",
    "discount_enable",
    "discount_value",
    "stock",
    "descripcion",
    "technical_spec",
    "catalog_id",
    "catalog_name",
    "company_id",
    "status",
    "sold",
}

PRODUCT_DETAIL_KEYS = {
    "id",
    "name",
    "price",
    "images",
    "discount_enable",
    "discount_value",
    "stock",
    "descripcion",
    "technical_spec",
    "catalog_id",
    "catalog_name",
    "company_id",
    "status",
}

COMPANY_ORDER_KEYS = {
    "id",
    "status",
    "subtotal",
    "discount",
    "shipping",
    "total",
    "payment_method",
    "recipient",
    "address",
    "city",
    "department",
    "postal_code",
    "created_at",
    "estimated_delivery",
    "delivery_progress",
    "buyer_email",
    "buyer_name",
    "items",
}

COMPANY_ORDER_ITEM_KEYS = {
    "id",
    "product_id",
    "name",
    "price",
    "quantity",
}


@pytest.fixture
def company_catalog(api_db_session):
    catalog = Catalog(name="Catalogo dashboard")
    api_db_session.add(catalog)
    api_db_session.commit()
    api_db_session.refresh(catalog)
    return catalog


@pytest.fixture
def company_foreign_product(api_db_session):
    role = api_db_session.query(Role).filter(Role.name == "company").first()
    user = Users(
        fullName="Foreign Company",
        email="foreign-company@example.com",
        hashed_password=hash_password("ForeignPass123"),
        tell="1234567890",
        role_id=role.id,
        verified=True,
        isActive=True,
    )
    api_db_session.add(user)
    api_db_session.flush()

    company = Company(
        user_id=user.id,
        nameCompany="Foreign Company S.A.S",
        addressCompany="Calle Externa",
        CompanyNIT="900555444",
        CompanyNITDV="2",
        CompanyCertificate=None,
    )
    api_db_session.add(company)
    api_db_session.flush()

    product = Product(
        name="Producto ajeno",
        price=50.0,
        images=[],
        discount_enable=False,
        discount_value=0,
        stock=5,
        descripcion="Producto de otra empresa",
        technical_spec={},
        company_id=company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def company_foreign_order(api_fake_user, company_foreign_product, api_db_session):
    order = Order(
        status="pending",
        subtotal=50.0,
        discount=0,
        shipping=0,
        total=50.0,
        payment_method="efectivo",
        recipient=api_fake_user.fullName,
        address="Calle 1",
        city="Bogota",
        department="Cundinamarca",
        postal_code="110111",
        user_id=api_fake_user.id,
    )
    api_db_session.add(order)
    api_db_session.flush()
    api_db_session.add(
        OrderItem(
            name=company_foreign_product.name,
            price=company_foreign_product.price,
            quantity=1,
            product_id=company_foreign_product.id,
            order_id=order.id,
        )
    )
    api_db_session.commit()
    api_db_session.refresh(order)
    return order


class TestCompanyRouterTanda2:
    """Tests para productos y pedidos de /company."""

    def test_create_product_con_catalog_name_exitoso(
        self, api_client, api_auth_headers_company, company_company, api_db_session
    ):
        response = api_client.post(
            "/company/products",
            json={
                "name": "Producto creado",
                "price": 150.0,
                "images": ["/files/creado.jpg"],
                "discount_enable": False,
                "discount_value": 0,
                "stock": 4,
                "descripcion": "Descripcion creada",
                "technical_spec": {"color": "rojo"},
                "catalog_name": "Catalogo creado",
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {"message", "id", "name"}
        assert data["message"] == "Producto creado correctamente"
        assert data["name"] == "Producto creado"
        product = (
            api_db_session.query(Product)
            .filter(Product.name == "Producto creado")
            .first()
        )
        assert product.company_id == company_company.id
        assert product.catalog.name == "Catalogo creado"

    def test_create_product_con_catalog_id_existente_exitoso(
        self, api_client, api_auth_headers_company, company_catalog, api_db_session
    ):
        response = api_client.post(
            "/company/products",
            json={
                "name": "Producto con catalogo",
                "price": 80.0,
                "stock": 3,
                "descripcion": "Producto con catalogo existente",
                "catalog_id": str(company_catalog.id),
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        product = (
            api_db_session.query(Product)
            .filter(Product.name == "Producto con catalogo")
            .first()
        )
        assert product.catalog_id == company_catalog.id

    def test_create_product_duplicado_devuelve_400(
        self, api_client, api_auth_headers_company, company_product
    ):
        response = api_client.post(
            "/company/products",
            json={
                "name": company_product.name,
                "price": 10.0,
                "stock": 1,
                "descripcion": "Duplicado",
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Ya existe un producto con ese nombre"

    def test_create_product_catalogo_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.post(
            "/company/products",
            json={
                "name": "Producto sin catalogo",
                "price": 10.0,
                "stock": 1,
                "descripcion": "Catalogo inexistente",
                "catalog_id": str(uuid.uuid4()),
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Catálogo no encontrado"

    def test_create_product_error_al_guardar_devuelve_500(
        self, api_client, api_auth_headers_company, api_db_session, monkeypatch
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.post(
            "/company/products",
            json={
                "name": "Producto no guardado",
                "price": 10.0,
                "stock": 1,
                "descripcion": "Error al guardar",
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al crear el producto"

    def test_list_products_devuelve_claves_y_vendidos(
        self,
        api_client,
        api_auth_headers_company,
        company_company,
        company_catalog,
        company_product,
        api_fake_user,
        api_db_session,
    ):
        company_product.catalog_id = company_catalog.id
        api_db_session.commit()
        _crear_venta(api_db_session, company_product, api_fake_user, 3)

        response = api_client.get(
            "/company/products", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert set(item) == PRODUCT_LIST_KEYS
        assert item["id"] == str(company_product.id)
        assert item["name"] == company_product.name
        assert item["price"] == 100.0
        assert item["catalog_id"] == str(company_catalog.id)
        assert item["catalog_name"] == company_catalog.name
        assert item["company_id"] == str(company_company.id)
        assert item["status"] == "active"
        assert item["sold"] == 3

    def test_list_products_sin_productos_devuelve_lista_vacia(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.get(
            "/company/products", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_list_products_sin_empresa_devuelve_403(
        self, api_client, company_headers_without_company
    ):
        response = api_client.get(
            "/company/products", headers=company_headers_without_company
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "No tienes una empresa registrada"

    def test_list_products_usuario_inexistente_devuelve_404(
        self, api_client, company_unknown_user_headers
    ):
        # Token company valido para un UUID que no existe en la BD: el servicio
        # devuelve 404 al no encontrar el usuario.
        response = api_client.get(
            "/company/products", headers=company_unknown_user_headers
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_get_product_devuelve_claves(
        self, api_client, api_auth_headers_company, company_product
    ):
        response = api_client.get(
            f"/company/products/{company_product.id}",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        data = response.json()
        assert set(data) == PRODUCT_DETAIL_KEYS
        assert data["id"] == str(company_product.id)
        assert data["name"] == company_product.name
        assert data["status"] == "active"

    def test_get_product_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.get(
            f"/company/products/{uuid.uuid4()}",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_get_product_ajeno_devuelve_404(
        self, api_client, api_auth_headers_company, company_foreign_product
    ):
        response = api_client.get(
            f"/company/products/{company_foreign_product.id}",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_update_product_exitoso(
        self, api_client, api_auth_headers_company, company_product, company_catalog, api_db_session
    ):
        response = api_client.patch(
            f"/company/products/{company_product.id}",
            json={
                "name": "Producto actualizado",
                "price": 150.0,
                "images": ["/files/actualizado.jpg"],
                "discount_enable": True,
                "discount_value": 5,
                "stock": 7,
                "descripcion": "Descripcion actualizada",
                "technical_spec": {"color": "azul"},
                "catalog_id": str(company_catalog.id),
            },
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        assert set(response.json()) == {"message", "id"}
        assert response.json()["message"] == "Producto actualizado correctamente"

        api_db_session.refresh(company_product)
        assert company_product.name == "Producto actualizado"
        assert company_product.price == 150.0
        assert company_product.images == ["/files/actualizado.jpg"]
        assert company_product.discount_enable is True
        assert company_product.discount_value == 5
        assert company_product.stock == 7
        assert company_product.descripcion == "Descripcion actualizada"
        assert company_product.technical_spec == {"color": "azul"}
        assert company_product.catalog_id == company_catalog.id

    def test_update_product_nombre_duplicado_devuelve_400(
        self, api_client, api_auth_headers_company, company_company, company_product, api_db_session
    ):
        other = Product(
            name="Producto secundario",
            price=20.0,
            images=[],
            discount_enable=False,
            discount_value=0,
            stock=2,
            descripcion="Otro producto",
            technical_spec={},
            company_id=company_company.id,
            catalog_id=None,
            status="active",
        )
        api_db_session.add(other)
        api_db_session.commit()

        response = api_client.patch(
            f"/company/products/{company_product.id}",
            json={"name": "Producto secundario"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Ya existe un producto con ese nombre"

    def test_update_product_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.patch(
            f"/company/products/{uuid.uuid4()}",
            json={"name": "No existe"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_update_product_catalogo_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company, company_product
    ):
        response = api_client.patch(
            f"/company/products/{company_product.id}",
            json={"catalog_id": str(uuid.uuid4())},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Catálogo no encontrado"

    def test_update_product_error_al_guardar_devuelve_500(
        self, api_client, api_auth_headers_company, company_product, api_db_session, monkeypatch
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.patch(
            f"/company/products/{company_product.id}",
            json={"name": "Producto no actualizado"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al actualizar el producto"

    def test_toggle_product_status_exitoso(
        self, api_client, api_auth_headers_company, company_product, api_db_session
    ):
        first = api_client.patch(
            f"/company/products/{company_product.id}/status",
            headers=api_auth_headers_company,
        )

        assert first.status_code == 200
        assert set(first.json()) == {"message", "id", "status"}
        assert first.json()["status"] == "inactive"
        assert first.json()["id"] == str(company_product.id)

        second = api_client.patch(
            f"/company/products/{company_product.id}/status",
            headers=api_auth_headers_company,
        )

        assert second.status_code == 200
        assert second.json()["status"] == "active"
        api_db_session.refresh(company_product)
        assert company_product.status == "active"

    def test_toggle_product_status_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.patch(
            f"/company/products/{uuid.uuid4()}/status",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_delete_product_exitoso(
        self, api_client, api_auth_headers_company, company_product, api_db_session
    ):
        response = api_client.delete(
            f"/company/products/{company_product.id}",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        assert response.json() == {"message": "Producto eliminado correctamente"}
        assert (
            api_db_session.query(Product)
            .filter(Product.id == company_product.id)
            .first()
            is None
        )

    def test_delete_product_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.delete(
            f"/company/products/{uuid.uuid4()}",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_delete_product_error_al_guardar_devuelve_500(
        self, api_client, api_auth_headers_company, company_product, api_db_session, monkeypatch
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.delete(
            f"/company/products/{company_product.id}",
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al eliminar el producto"

    def test_list_orders_devuelve_claves(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_user,
        company_product,
        api_db_session,
    ):
        order = _crear_venta(
            api_db_session, company_product, api_fake_user, 2, status="pending"
        )

        response = api_client.get(
            "/company/orders", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        item = data[0]
        assert set(item) == COMPANY_ORDER_KEYS
        assert item["id"] == str(order.id)
        assert item["status"] == "pending"
        assert item["subtotal"] == 200.0
        assert item["total"] == 200.0
        assert item["delivery_progress"] == 15
        assert item["buyer_email"] == api_fake_user.email
        assert item["buyer_name"] == api_fake_user.fullName
        assert len(item["items"]) == 1
        assert set(item["items"][0]) == COMPANY_ORDER_ITEM_KEYS
        assert item["items"][0]["product_id"] == str(company_product.id)
        assert item["items"][0]["quantity"] == 2

    def test_list_orders_sin_productos_devuelve_lista_vacia(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.get(
            "/company/orders", headers=api_auth_headers_company
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_list_orders_sin_empresa_devuelve_404(
        self, api_client, company_headers_without_company
    ):
        response = api_client.get(
            "/company/orders", headers=company_headers_without_company
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"

    def test_update_order_status_exitoso(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_user,
        company_product,
        api_db_session,
    ):
        order = _crear_venta(
            api_db_session, company_product, api_fake_user, 1, status="pending"
        )

        response = api_client.patch(
            f"/company/orders/{order.id}/status",
            json={"status": "confirmed"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "Estado del pedido actualizado correctamente",
            "status": "confirmed",
            "delivery_progress": 35,
        }

        api_db_session.refresh(order)
        assert order.status == "confirmed"

    def test_update_order_status_transicion_invalida_devuelve_400(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_user,
        company_product,
        api_db_session,
    ):
        order = _crear_venta(
            api_db_session, company_product, api_fake_user, 1, status="delivered"
        )

        response = api_client.patch(
            f"/company/orders/{order.id}/status",
            json={"status": "pending"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 400
        assert (
            response.json()["detail"]
            == "No se puede cambiar de 'delivered' a 'pending'"
        )

    def test_update_order_status_pedido_inexistente_devuelve_404(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.patch(
            f"/company/orders/{uuid.uuid4()}/status",
            json={"status": "confirmed"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Pedido no encontrado"

    def test_update_order_status_pedido_ajeno_devuelve_403(
        self, api_client, api_auth_headers_company, company_foreign_order
    ):
        response = api_client.patch(
            f"/company/orders/{company_foreign_order.id}/status",
            json={"status": "confirmed"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 403
        assert (
            response.json()["detail"]
            == "Este pedido no contiene productos de tu empresa"
        )

    def test_update_order_status_sin_empresa_devuelve_404(
        self, api_client, company_headers_without_company, company_foreign_order
    ):
        response = api_client.patch(
            f"/company/orders/{company_foreign_order.id}/status",
            json={"status": "confirmed"},
            headers=company_headers_without_company,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"

    def test_update_order_status_error_al_guardar_devuelve_500(
        self,
        api_client,
        api_auth_headers_company,
        api_fake_user,
        company_product,
        api_db_session,
        monkeypatch,
    ):
        order = _crear_venta(
            api_db_session, company_product, api_fake_user, 1, status="pending"
        )

        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.patch(
            f"/company/orders/{order.id}/status",
            json={"status": "confirmed"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Error al actualizar el pedido"
