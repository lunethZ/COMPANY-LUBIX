import uuid

import pytest

from app.models.ModelCart import Cart, CartItem
from app.models.ModelCompany import Company
from app.models.ModelProduct import Product
from app.services.authentication.JWTService import create_access_token


pytestmark = pytest.mark.api


CARD_ITEM_KEYS = {
    "id",
    "product_id",
    "name",
    "price",
    "discount_enable",
    "discount_value",
    "unit_price",
    "image",
    "stock",
    "quantity",
    "line_total",
}


@pytest.fixture
def card_company(api_fake_company, api_db_session):
    return (
        api_db_session.query(Company)
        .filter(Company.user_id == api_fake_company.id)
        .first()
    )


@pytest.fixture
def card_product(card_company, api_db_session):
    product = Product(
        name="Producto de carrito",
        price=100.0,
        images=["/files/card.jpg"],
        discount_enable=False,
        discount_value=0,
        stock=10,
        descripcion="Producto para probar el carrito",
        technical_spec={},
        company_id=card_company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def card_discount_product(card_company, api_db_session):
    product = Product(
        name="Producto con descuento",
        price=100.0,
        images=[],
        discount_enable=True,
        discount_value=10,
        stock=5,
        descripcion="Producto con descuento para el carrito",
        technical_spec={},
        company_id=card_company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def card_inactive_product(card_company, api_db_session):
    product = Product(
        name="Producto inactivo de carrito",
        price=50.0,
        images=[],
        discount_enable=False,
        discount_value=0,
        stock=5,
        descripcion="Producto inactivo para el carrito",
        technical_spec={},
        company_id=card_company.id,
        catalog_id=None,
        status="inactive",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def card_cart(api_fake_user, api_db_session):
    cart = Cart(user_id=api_fake_user.id)
    api_db_session.add(cart)
    api_db_session.commit()
    api_db_session.refresh(cart)
    return cart


@pytest.fixture
def card_item(card_cart, card_product, api_db_session):
    item = CartItem(
        cart_id=card_cart.id,
        product_id=card_product.id,
        quantity=2,
    )
    api_db_session.add(item)
    api_db_session.commit()
    api_db_session.refresh(item)
    return item


@pytest.fixture
def card_discount_item(card_cart, card_discount_product, api_db_session):
    item = CartItem(
        cart_id=card_cart.id,
        product_id=card_discount_product.id,
        quantity=2,
    )
    api_db_session.add(item)
    api_db_session.commit()
    api_db_session.refresh(item)
    return item


@pytest.fixture
def card_unknown_user_headers():
    token = create_access_token(user_id=str(uuid.uuid4()), role="user")
    return {"Authorization": f"Bearer {token}"}


class TestCardRouter:
    """Tests para /cart."""

    def test_get_cart_vacio_devuelve_estructura(self, api_client, api_auth_headers_user):
        response = api_client.get("/cart", headers=api_auth_headers_user)

        assert response.status_code == 200
        assert response.json() == {"items": [], "subtotal": 0, "total_items": 0}

    def test_get_cart_con_item_devuelve_item_y_totales(
        self, api_client, api_auth_headers_user, card_item, card_product
    ):
        response = api_client.get("/cart", headers=api_auth_headers_user)

        assert response.status_code == 200
        data = response.json()
        assert data["subtotal"] == 200.0
        assert data["total_items"] == 2
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert set(item) == CARD_ITEM_KEYS
        assert item["id"] == str(card_item.id)
        assert item["product_id"] == str(card_product.id)
        assert item["name"] == card_product.name
        assert item["price"] == 100.0
        assert item["unit_price"] == 100.0
        assert item["line_total"] == 200.0
        assert item["image"] == "/files/card.jpg"
        assert item["stock"] == 10
        assert item["quantity"] == 2

    def test_get_cart_aplica_descuento(
        self, api_client, api_auth_headers_user, card_discount_item
    ):
        response = api_client.get("/cart", headers=api_auth_headers_user)

        assert response.status_code == 200
        data = response.json()
        item = data["items"][0]
        assert item["discount_enable"] is True
        assert item["discount_value"] == 10.0
        assert item["unit_price"] == 90.0
        assert item["line_total"] == 180.0
        assert data["subtotal"] == 180.0

    def test_get_cart_ignora_producto_inactivo(
        self, api_client, api_auth_headers_user, card_cart, card_inactive_product, api_db_session
    ):
        api_db_session.add(
            CartItem(
                cart_id=card_cart.id,
                product_id=card_inactive_product.id,
                quantity=1,
            )
        )
        api_db_session.commit()

        response = api_client.get("/cart", headers=api_auth_headers_user)

        assert response.status_code == 200
        assert response.json() == {"items": [], "subtotal": 0, "total_items": 0}

    def test_get_cart_usuario_inexistente_devuelve_404(
        self, api_client, card_unknown_user_headers
    ):
        response = api_client.get("/cart", headers=card_unknown_user_headers)

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_get_cart_sin_token_devuelve_401(self, api_client):
        response = api_client.get("/cart")

        assert response.status_code == 401
        assert response.json()["detail"] == "Token requerido"

    def test_get_cart_rol_company_devuelve_401(
        self, api_client, api_auth_headers_company
    ):
        response = api_client.get("/cart", headers=api_auth_headers_company)

        assert response.status_code == 401
        assert (
            response.json()["detail"]
            == "no tienes permiso para acceder a este recurso"
        )

    def test_add_item_crea_carrito_y_item(
        self, api_client, api_auth_headers_user, api_fake_user, card_product, api_db_session
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 2},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Producto agregado al carrito"
        assert set(data["item"]) == CARD_ITEM_KEYS
        assert data["item"]["product_id"] == str(card_product.id)
        assert data["item"]["quantity"] == 2
        assert data["item"]["line_total"] == 200.0

        cart = (
            api_db_session.query(Cart)
            .filter(Cart.user_id == api_fake_user.id)
            .first()
        )
        assert cart is not None
        item = (
            api_db_session.query(CartItem)
            .filter(
                CartItem.cart_id == cart.id,
                CartItem.product_id == card_product.id,
            )
            .first()
        )
        assert item.quantity == 2

    def test_add_item_sin_quantity_usa_uno(
        self, api_client, api_auth_headers_user, card_product
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id)},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["item"]["quantity"] == 1

    def test_add_item_quantity_cero_se_normaliza_a_uno(
        self, api_client, api_auth_headers_user, card_product
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 0},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["item"]["quantity"] == 1

    def test_add_item_existente_acumula_cantidad(
        self, api_client, api_auth_headers_user, card_item, card_product
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 3},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["item"]["quantity"] == 5

    def test_add_item_stock_insuficiente_devuelve_400(
        self, api_client, api_auth_headers_user, card_product
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 11},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Stock insuficiente. Disponible: 10"

    def test_add_item_existente_supera_stock_devuelve_400(
        self, api_client, api_auth_headers_user, card_cart, card_product, api_db_session
    ):
        api_db_session.add(
            CartItem(
                cart_id=card_cart.id,
                product_id=card_product.id,
                quantity=8,
            )
        )
        api_db_session.commit()

        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 3},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Stock insuficiente. Disponible: 10"

    def test_add_item_producto_inexistente_devuelve_404(
        self, api_client, api_auth_headers_user
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(uuid.uuid4()), "quantity": 1},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_add_item_producto_inactivo_devuelve_400(
        self, api_client, api_auth_headers_user, card_inactive_product
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_inactive_product.id), "quantity": 1},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "El producto no está disponible"

    def test_add_item_usuario_inexistente_devuelve_404(
        self, api_client, card_unknown_user_headers, card_product
    ):
        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 1},
            headers=card_unknown_user_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_update_item_cantidad_exitosa(
        self, api_client, api_auth_headers_user, card_item, card_product, api_db_session
    ):
        response = api_client.patch(
            f"/cart/items/{card_product.id}",
            json={"quantity": 5},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Cantidad actualizada"
        assert data["item"]["quantity"] == 5
        assert data["item"]["line_total"] == 500.0

        api_db_session.refresh(card_item)
        assert card_item.quantity == 5

    def test_update_item_cantidad_cero_elimina(
        self, api_client, api_auth_headers_user, card_item, card_product, api_db_session
    ):
        response = api_client.patch(
            f"/cart/items/{card_product.id}",
            json={"quantity": 0},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Producto eliminado del carrito"
        assert (
            api_db_session.query(CartItem)
            .filter(CartItem.id == card_item.id)
            .first()
            is None
        )

    def test_update_item_sin_carrito_devuelve_404(
        self, api_client, api_auth_headers_user, card_product
    ):
        response = api_client.patch(
            f"/cart/items/{card_product.id}",
            json={"quantity": 2},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Carrito no encontrado"

    def test_update_item_no_en_carrito_devuelve_404(
        self, api_client, api_auth_headers_user, card_cart, card_product
    ):
        response = api_client.patch(
            f"/cart/items/{card_product.id}",
            json={"quantity": 2},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "El producto no está en el carrito"

    def test_update_item_stock_insuficiente_devuelve_400(
        self, api_client, api_auth_headers_user, card_item, card_product
    ):
        response = api_client.patch(
            f"/cart/items/{card_product.id}",
            json={"quantity": 11},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Stock insuficiente. Disponible: 10"

    def test_remove_item_exitoso(
        self, api_client, api_auth_headers_user, card_item, card_product, api_db_session
    ):
        response = api_client.delete(
            f"/cart/items/{card_product.id}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Producto eliminado del carrito"
        assert (
            api_db_session.query(CartItem)
            .filter(CartItem.id == card_item.id)
            .first()
            is None
        )

    def test_remove_item_sin_carrito_devuelve_404(
        self, api_client, api_auth_headers_user, card_product
    ):
        response = api_client.delete(
            f"/cart/items/{card_product.id}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Carrito no encontrado"

    def test_remove_item_no_en_carrito_devuelve_404(
        self, api_client, api_auth_headers_user, card_cart, card_product
    ):
        response = api_client.delete(
            f"/cart/items/{card_product.id}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "El producto no está en el carrito"

    def test_clear_cart_con_items(
        self, api_client, api_auth_headers_user, card_item, card_cart, api_db_session
    ):
        response = api_client.delete("/cart", headers=api_auth_headers_user)

        assert response.status_code == 200
        assert response.json()["message"] == "Carrito vaciado correctamente"
        assert (
            api_db_session.query(CartItem)
            .filter(CartItem.cart_id == card_cart.id)
            .count()
            == 0
        )

    def test_clear_cart_sin_carrito_devuelve_200(
        self, api_client, api_auth_headers_user
    ):
        response = api_client.delete("/cart", headers=api_auth_headers_user)

        assert response.status_code == 200
        assert response.json()["message"] == "Carrito vaciado correctamente"

    def test_clear_cart_usuario_inexistente_devuelve_404(
        self, api_client, card_unknown_user_headers
    ):
        response = api_client.delete("/cart", headers=card_unknown_user_headers)

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_merge_cart_agrega_validos_y_omite_invalidos(
        self,
        api_client,
        api_auth_headers_user,
        card_product,
        card_inactive_product,
    ):
        response = api_client.post(
            "/cart/merge",
            json={
                "items": [
                    {"product_id": str(card_product.id), "quantity": 2},
                    {"product_id": str(card_inactive_product.id), "quantity": 5},
                    {"product_id": str(uuid.uuid4()), "quantity": 1},
                ]
            },
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == str(card_product.id)
        assert data["items"][0]["quantity"] == 2
        assert data["total_items"] == 2

    def test_merge_cart_respeta_stock_en_producto_nuevo(
        self, api_client, api_auth_headers_user, card_product
    ):
        response = api_client.post(
            "/cart/merge",
            json={"items": [{"product_id": str(card_product.id), "quantity": 50}]},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["items"][0]["quantity"] == 10

    def test_merge_cart_acumula_sin_superar_stock(
        self, api_client, api_auth_headers_user, card_item, card_product
    ):
        response = api_client.post(
            "/cart/merge",
            json={"items": [{"product_id": str(card_product.id), "quantity": 50}]},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json()["items"][0]["quantity"] == 10

    def test_merge_cart_usuario_inexistente_devuelve_404(
        self, api_client, card_unknown_user_headers
    ):
        response = api_client.post(
            "/cart/merge",
            json={"items": []},
            headers=card_unknown_user_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_hallazgo_h6_error_interno_en_ruta_protegida_devuelve_401(
        self, api_client, api_auth_headers_user, card_product, monkeypatch
    ):
        # HALLAZGO H6: AuthMiddleware captura la excepcion interna y la devuelve
        # como 401 "Token invalido" en rutas protegidas; el endpoint no llega a 500.
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(
            "app.routers.CardRouters._get_or_create_cart", _fallar
        )

        response = api_client.post(
            "/cart/items",
            json={"product_id": str(card_product.id), "quantity": 1},
            headers=api_auth_headers_user,
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"
