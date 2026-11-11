"""Tests del carrito (/cart)."""

from app.models.ModelCart import CartItem


def _add(client, seed, user, product, *, quantity=1):
    response = client.post(
        "/cart/items",
        json={"product_id": str(product.id), "quantity": quantity},
        headers=seed.headers(user),
    )
    return response


# --------------------------------------------------------------------------- #
# Lectura
# --------------------------------------------------------------------------- #
def test_get_cart_vacio_devuelve_estructura(client, seed):
    user = seed.user()

    response = client.get("/cart", headers=seed.headers(user))

    assert response.status_code == 200
    assert response.json() == {"items": [], "subtotal": 0, "total_items": 0}


def test_get_cart_con_items_devuelve_totales(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, price=100.0, stock=10)
    assert _add(client, seed, user, product, quantity=3).status_code == 200

    response = client.get("/cart", headers=seed.headers(user))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"items", "subtotal", "total_items"}
    assert body["total_items"] == 3
    assert body["subtotal"] == 300.0
    assert set(body["items"][0]) == {
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


def test_get_cart_omite_productos_inactivos(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, status="inactive")
    assert _add(client, seed, user, product).status_code == 400

    # Se inserta directamente para simular un producto desactivado después
    # de haberse agregado al carrito.
    with seed.session() as session:
        from app.models.ModelCart import Cart
        from app.models.ModelUser import Users

        db_user = session.get(Users, user.id)
        cart = Cart(user_id=db_user.id)
        session.add(cart)
        session.flush()
        session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))

    response = client.get("/cart", headers=seed.headers(user))

    assert response.status_code == 200
    assert response.json() == {"items": [], "subtotal": 0, "total_items": 0}


def test_get_cart_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    response = client.get("/cart")

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


# --------------------------------------------------------------------------- #
# Agregar
# --------------------------------------------------------------------------- #
def test_add_item_devuelve_200_y_su_forma(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, price=200.0, stock=5)

    response = _add(client, seed, user, product, quantity=2)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "item"}
    assert body["message"] == "Producto agregado al carrito"
    assert body["item"]["quantity"] == 2
    assert body["item"]["line_total"] == 400.0


def test_add_item_suma_si_ya_estaba(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, stock=10)
    headers = seed.headers(user)
    _add(client, seed, user, product, quantity=2)

    response = client.post(
        "/cart/items",
        json={"product_id": str(product.id), "quantity": 3},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["item"]["quantity"] == 5


def test_add_item_producto_inexistente_devuelve_404(client, seed):
    user = seed.user()

    response = client.post(
        "/cart/items",
        json={"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1},
        headers=seed.headers(user),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Producto no encontrado"}


def test_add_item_producto_inactivo_devuelve_400(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, status="inactive")

    response = _add(client, seed, user, product)

    assert response.status_code == 400
    assert response.json() == {"detail": "El producto no está disponible"}


def test_add_item_sin_stock_devuelve_400(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, stock=2)

    response = _add(client, seed, user, product, quantity=5)

    assert response.status_code == 400
    assert response.json()["detail"].startswith("Stock insuficiente")


def test_add_item_sin_token_devuelve_401(client, seed):
    company = seed.company()
    product = seed.product(company)

    response = client.post(
        "/cart/items", json={"product_id": str(product.id), "quantity": 1}
    )

    assert response.status_code == 401


# --------------------------------------------------------------------------- #
# Actualizar / eliminar
# --------------------------------------------------------------------------- #
def test_update_item_devuelve_200(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, stock=10)
    _add(client, seed, user, product, quantity=1)

    response = client.patch(
        f"/cart/items/{product.id}",
        json={"quantity": 4},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "item"}
    assert body["item"]["quantity"] == 4


def test_update_item_cantidad_cero_elimina(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company)
    _add(client, seed, user, product)

    response = client.patch(
        f"/cart/items/{product.id}",
        json={"quantity": 0},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Producto eliminado del carrito"}

    with seed.session() as session:
        assert session.query(CartItem).count() == 0


def test_update_item_supera_stock_devuelve_400(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, stock=3)
    _add(client, seed, user, product)

    response = client.patch(
        f"/cart/items/{product.id}",
        json={"quantity": 9},
        headers=seed.headers(user),
    )

    assert response.status_code == 400
    assert response.json()["detail"].startswith("Stock insuficiente")


def test_update_item_no_esta_en_el_carrito_devuelve_404(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company)

    response = client.patch(
        f"/cart/items/{product.id}",
        json={"quantity": 2},
        headers=seed.headers(user),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Carrito no encontrado"}


def test_remove_item_devuelve_200_y_404(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company)
    _add(client, seed, user, product)
    headers = seed.headers(user)

    ok = client.delete(f"/cart/items/{product.id}", headers=headers)
    assert ok.status_code == 200
    assert ok.json() == {"message": "Producto eliminado del carrito"}

    # El carrito existe pero el producto ya no está dentro.
    missing = client.delete(f"/cart/items/{product.id}", headers=headers)
    assert missing.status_code == 404
    assert missing.json() == {"detail": "El producto no está en el carrito"}


def test_clear_cart_devuelve_200(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company)
    _add(client, seed, user, product)

    response = client.delete("/cart", headers=seed.headers(user))

    assert response.status_code == 200
    assert response.json() == {"message": "Carrito vaciado correctamente"}

    with seed.session() as session:
        assert session.query(CartItem).count() == 0


def test_clear_cart_sin_carrito_devuelve_200(client, seed):
    user = seed.user()

    response = client.delete("/cart", headers=seed.headers(user))

    assert response.status_code == 200


# --------------------------------------------------------------------------- #
# Merge (carrito local -> servidor)
# --------------------------------------------------------------------------- #
def test_merge_cart_devuelve_200_y_persiste_los_items(client, seed):
    """El merge guarda los items, pero su propia respuesta sale vacía.

    `merge_cart` crea el carrito con `Cart(user_id=...)` sin refrescar la
    relación `user.cart`, que ya quedó cacheada como `None` al entrar en
    `_get_or_create_cart`; así que el `get_cart()` final devuelve
    `items: []`. Los datos sí se persisten: un GET posterior los
    muestra. Se documenta el comportamiento actual en lugar de corregirlo
    (la lógica de producción no se toca en esta rama).
    """
    user = seed.user()
    company = seed.company()
    product = seed.product(company, price=100.0, stock=10)

    response = client.post(
        "/cart/merge",
        json={"items": [{"product_id": str(product.id), "quantity": 2}]},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"items", "subtotal", "total_items"}
    assert body == {"items": [], "subtotal": 0, "total_items": 0}

    # Lo importante: los items quedaron guardados.
    after = client.get("/cart", headers=seed.headers(user))
    assert after.status_code == 200
    assert after.json()["total_items"] == 2
    assert after.json()["subtotal"] == 200.0


def test_merge_cart_ignora_productos_invalidos(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, stock=5)
    headers = seed.headers(user)

    response = client.post(
        "/cart/merge",
        json={
            "items": [
                {"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1},
                {"product_id": str(product.id), "quantity": 1},
            ]
        },
        headers=headers,
    )

    assert response.status_code == 200

    after = client.get("/cart", headers=headers)
    assert after.json()["total_items"] == 1


def test_merge_cart_respeta_stock(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company, stock=2)
    headers = seed.headers(user)

    response = client.post(
        "/cart/merge",
        json={"items": [{"product_id": str(product.id), "quantity": 50}]},
        headers=headers,
    )

    assert response.status_code == 200

    after = client.get("/cart", headers=headers)
    assert after.json()["items"][0]["quantity"] == 2


def test_cart_rol_company_devuelve_401(client, seed):
    company = seed.company()

    response = client.get("/cart", headers=seed.headers(company))

    assert response.status_code == 401
    assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}
