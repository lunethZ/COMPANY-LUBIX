import uuid

import pytest
from fastapi.testclient import TestClient

from app.database.Connection import get_db
from app.main import app
from app.models.ModelCompany import Company
from app.models.ModelOrder import Order, OrderItem
from app.models.ModelProduct import Catalog, Product
from app.models.ModelReview import Review


pytestmark = pytest.mark.api


@pytest.fixture
def prod_company(api_fake_company, api_db_session):
    return (
        api_db_session.query(Company)
        .filter(Company.user_id == api_fake_company.id)
        .first()
    )


@pytest.fixture
def prod_catalog(api_db_session):
    catalog = Catalog(name="Herramientas de prueba")
    api_db_session.add(catalog)
    api_db_session.commit()
    api_db_session.refresh(catalog)
    return catalog


@pytest.fixture
def prod_product(prod_company, api_db_session):
    product = Product(
        name="Taladro Percutor",
        price=120.0,
        images=["/files/taladro.jpg"],
        discount_enable=False,
        discount_value=0,
        stock=10,
        descripcion="Taladro de prueba",
        technical_spec={"voltaje": "110V"},
        company_id=prod_company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def prod_other_product(prod_company, api_db_session):
    product = Product(
        name="Sierra Circular",
        price=200.0,
        images=[],
        discount_enable=True,
        discount_value=10,
        stock=5,
        descripcion="Sierra de prueba",
        technical_spec={},
        company_id=prod_company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def prod_purchased_order(api_fake_user, prod_product, api_db_session):
    order = Order(
        status="delivered",
        subtotal=120.0,
        discount=0,
        shipping=0,
        total=120.0,
        payment_method="efectivo",
        recipient="Usuario de Prueba",
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
            name=prod_product.name,
            price=120.0,
            quantity=1,
            product_id=prod_product.id,
            order_id=order.id,
        )
    )
    api_db_session.commit()
    api_db_session.refresh(order)
    return order


@pytest.fixture
def prod_client_500(api_db_session):
    def _get_db_de_prueba():
        yield api_db_session

    app.dependency_overrides[get_db] = _get_db_de_prueba
    client = TestClient(app, raise_server_exceptions=False)
    try:
        yield client
    finally:
        app.dependency_overrides.pop(get_db, None)


class TestProductRouter:
    """Tests para /products."""

    def test_list_catalogs_incluye_catalogo_con_producto_activo(
        self, api_client, prod_catalog, prod_product, api_db_session
    ):
        prod_product.catalog_id = prod_catalog.id
        api_db_session.commit()

        response = api_client.get("/products/catalogs")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        item = next(c for c in data if c["id"] == str(prod_catalog.id))
        assert set(item) == {"id", "name", "product_count"}
        assert item["name"] == prod_catalog.name
        assert item["product_count"] == 1

    def test_hallazgo_h2_catalogs_excluye_catalogo_sin_productos_activos(
        self, api_client, prod_catalog
    ):
        # HALLAZGO H2: el outerjoin se anula con el filtro Product.status == "active";
        # un catálogo sin productos activos no aparece en la respuesta.
        response = api_client.get("/products/catalogs")

        assert response.status_code == 200
        ids = [c["id"] for c in response.json()]
        assert str(prod_catalog.id) not in ids

    def test_search_devuelve_producto_con_claves_del_contrato(
        self, api_client, prod_product
    ):
        response = api_client.get("/products/search", params={"q": "Taladro"})

        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) >= 1
        product = data["products"][0]
        assert set(product) == {
            "id",
            "name",
            "price",
            "images",
            "descripcion",
            "stock",
            "discount_enable",
            "discount_value",
            "company_id",
            "company_name",
            "technical_spec",
            "catalog_name",
            "avg_rating",
            "review_count",
        }

    def test_search_parametro_invalido_devuelve_422(self, api_client):
        response = api_client.get("/products/search", params={"min": "no-numero"})

        assert response.status_code == 422
        assert "detail" in response.json()

    def test_get_product_devuelve_claves_del_contrato(self, api_client, prod_product):
        response = api_client.get(f"/products/{prod_product.id}")

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {
            "id",
            "name",
            "price",
            "images",
            "descripcion",
            "stock",
            "discount_enable",
            "discount_value",
            "company_id",
            "company_name",
            "technical_spec",
            "catalog_id",
            "catalog_name",
            "avg_rating",
            "review_count",
        }
        assert data["id"] == str(prod_product.id)

    def test_get_product_inexistente_devuelve_404(self, api_client):
        response = api_client.get(f"/products/{uuid.uuid4()}")

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_get_reviews_devuelve_lista_con_claves(
        self, api_client, api_fake_user, prod_product, api_db_session
    ):
        api_db_session.add(
            Review(
                user_id=api_fake_user.id,
                product_id=prod_product.id,
                rating=5,
                title="Excelente",
                comment="Muy buen producto",
            )
        )
        api_db_session.commit()

        response = api_client.get(f"/products/{prod_product.id}/reviews")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert set(data[0]) == {
            "id",
            "rating",
            "title",
            "comment",
            "created_at",
            "user_name",
        }
        assert data[0]["user_name"] == api_fake_user.fullName

    def test_get_reviews_producto_inexistente_devuelve_404(self, api_client):
        response = api_client.get(f"/products/{uuid.uuid4()}/reviews")

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_create_review_exitoso(
        self,
        api_client,
        api_auth_headers_user,
        prod_product,
        prod_purchased_order,
    ):
        response = api_client.post(
            f"/products/{prod_product.id}/reviews",
            json={"rating": 5, "title": "Bueno", "comment": "Muy buen producto"},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {"message", "id"}
        assert data["message"] == "Reseña creada correctamente"

    def test_create_review_sin_token_devuelve_401(self, api_client, prod_product):
        response = api_client.post(
            f"/products/{prod_product.id}/reviews",
            json={"rating": 5, "comment": "Muy buen producto"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token requerido"

    def test_create_review_rol_company_devuelve_403(
        self, api_client, api_auth_headers_company, prod_product
    ):
        response = api_client.post(
            f"/products/{prod_product.id}/reviews",
            json={"rating": 5, "comment": "Muy buen producto"},
            headers=api_auth_headers_company,
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Solo usuarios pueden crear reseñas"

    def test_create_review_duplicada_devuelve_400(
        self, api_client, api_auth_headers_user, api_fake_user, prod_product, api_db_session
    ):
        api_db_session.add(
            Review(
                user_id=api_fake_user.id,
                product_id=prod_product.id,
                rating=4,
                comment="Ya calificado",
            )
        )
        api_db_session.commit()

        response = api_client.post(
            f"/products/{prod_product.id}/reviews",
            json={"rating": 5, "comment": "Otra reseña"},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Ya has calificado este producto"

    def test_create_review_sin_compra_devuelve_403(
        self, api_client, api_auth_headers_user, prod_product
    ):
        response = api_client.post(
            f"/products/{prod_product.id}/reviews",
            json={"rating": 5, "comment": "Muy buen producto"},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 403
        assert (
            response.json()["detail"]
            == "Solo puedes reseñar productos que hayas comprado"
        )

    def test_create_review_producto_inexistente_devuelve_404(
        self, api_client, api_auth_headers_user
    ):
        response = api_client.post(
            f"/products/{uuid.uuid4()}/reviews",
            json={"rating": 5, "comment": "Muy buen producto"},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_hallazgo_h1_review_body_invalido_devuelve_401_por_middleware(
        self, api_client, api_auth_headers_user
    ):
        # HALLAZGO H1: el ValidationError de CreateReviewRequest es capturado por
        # AuthMiddleware, que devuelve 401 "Token invalido"; no llega a 422 ni a 500.
        response = api_client.post(
            f"/products/{uuid.uuid4()}/reviews",
            json={"rating": 99, "comment": "x"},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"

    def test_get_product_error_interno_devuelve_500(
        self, prod_client_500, prod_product, monkeypatch
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(
            "app.routers.ProductsRouter._get_product_rating", _fallar
        )

        response = prod_client_500.get(f"/products/{prod_product.id}")

        assert response.status_code == 500

    def test_get_related_devuelve_productos_de_la_misma_empresa(
        self, api_client, prod_product, prod_other_product
    ):
        response = api_client.get(f"/products/{prod_product.id}/related")

        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) == 1
        assert set(data["products"][0]) == {
            "id",
            "name",
            "price",
            "images",
            "descripcion",
            "stock",
            "discount_enable",
            "discount_value",
            "company_name",
            "catalog_name",
            "avg_rating",
            "review_count",
        }
        assert data["products"][0]["id"] == str(prod_other_product.id)

    def test_get_related_producto_inexistente_devuelve_404(self, api_client):
        response = api_client.get(f"/products/{uuid.uuid4()}/related")

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_company_profile_devuelve_claves_del_contrato(
        self, api_client, prod_company
    ):
        response = api_client.get(f"/products/company/{prod_company.id}/profile")

        assert response.status_code == 200
        data = response.json()
        assert set(data) == {
            "id",
            "name",
            "address",
            "logo",
            "banner",
            "member_at",
            "total_sales",
            "avg_rating",
            "total_reviews",
            "total_products",
        }
        assert data["id"] == str(prod_company.id)

    def test_company_profile_uuid_invalido_devuelve_400(self, api_client):
        response = api_client.get("/products/company/no-es-uuid/profile")

        assert response.status_code == 400
        assert response.json()["detail"] == "ID de empresa inválido"

    def test_company_profile_empresa_inexistente_devuelve_404(self, api_client):
        response = api_client.get(f"/products/company/{uuid.uuid4()}/profile")

        assert response.status_code == 404
        assert response.json()["detail"] == "Empresa no encontrada"
