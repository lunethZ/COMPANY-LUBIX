"""Tests de los endpoints de usuario (/user)."""

from app.models.ModelAddress import Address
from app.models.ModelUser import Users


def _order_payload(product, *, quantity=2, price=1500.0):
    total = price * quantity
    return {
        "items": [
            {"product_id": str(product.id), "name": product.name, "price": price, "quantity": quantity}
        ],
        "subtotal": total,
        "discount": 0,
        "shipping": 0,
        "total": total,
        "payment_method": "efectivo",
        "recipient": "Persona Receptora",
        "address": "Calle 1 # 2-3",
        "city": "Bogotá",
        "department": "Cundinamarca",
        "postal_code": "110111",
    }


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
def test_dashboard_me_devuelve_200_y_su_forma(client, seed):
    user = seed.user()

    response = client.get("/user/dashboard/me", headers=seed.headers(user))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "fullName",
        "email",
        "tell",
        "memberSince",
        "role",
        "totalOrders",
        "totalSpent",
        "savedProducts",
        "addresses",
        "avatar",
        "banner",
    }
    assert body["role"] == "user"
    assert body["email"] == "usuario@lubix.com"
    assert body["totalOrders"] == 0
    assert body["totalSpent"] == 0.0


def test_dashboard_me_usuario_inexistente_devuelve_404(client, seed):
    user = seed.user()
    headers = seed.headers(user)
    # Se borra el usuario pero el token sigue siendo válido.
    with seed.session() as session:
        session.delete(session.get(Users, user.id))

    response = client.get("/user/dashboard/me", headers=headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Usuario no encontrado"}


def test_dashboard_me_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    assert client.get("/user/dashboard/me").status_code == 401


# --------------------------------------------------------------------------- #
# Perfil y contraseña
# --------------------------------------------------------------------------- #
def test_update_profile_devuelve_200(client, seed):
    user = seed.user()

    response = client.patch(
        "/user/profile",
        json={"fullName": "Nombre Actualizado", "tell": "3005554433"},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "fullName", "email", "tell"}
    assert body["fullName"] == "Nombre Actualizado"
    assert body["tell"] == "3005554433"


def test_update_profile_usuario_inexistente_devuelve_404(client, seed):
    user = seed.user()
    headers = seed.headers(user)
    with seed.session() as session:
        session.delete(session.get(Users, user.id))

    response = client.patch(
        "/user/profile", json={"fullName": "Nombre Nuevo"}, headers=headers
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Usuario no encontrado"}


def test_update_profile_nombre_corto_devuelve_422(client, seed):
    user = seed.user()

    response = client.patch(
        "/user/profile", json={"fullName": "ab"}, headers=seed.headers(user)
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "fullName"


def test_change_password_devuelve_200(client, seed):
    user = seed.user()

    response = client.patch(
        "/user/change-password",
        json={"current_password": "Secreta1!", "new_password": "NuevaClave1"},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Contraseña actualizada correctamente"}


def test_change_password_actual_incorrecta_devuelve_400(client, seed):
    user = seed.user()

    response = client.patch(
        "/user/change-password",
        json={"current_password": "OtraClave1", "new_password": "NuevaClave1"},
        headers=seed.headers(user),
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Contraseña actual incorrecta"}


def test_change_password_nueva_debil_devuelve_422(client, seed):
    user = seed.user()

    response = client.patch(
        "/user/change-password",
        json={"current_password": "Secreta1!", "new_password": "123"},
        headers=seed.headers(user),
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "new_password"


def test_delete_account_devuelve_200_y_luego_404(client, seed):
    user = seed.user()
    headers = seed.headers(user)

    response = client.delete("/user/account", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"message": "Cuenta eliminada correctamente"}

    after = client.get("/user/dashboard/me", headers=headers)
    assert after.status_code == 404


def test_export_devuelve_200_y_su_forma(client, seed):
    user = seed.user()

    response = client.get("/user/export", headers=seed.headers(user))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "fullName",
        "email",
        "tell",
        "role",
        "verified",
        "memberSince",
        "addresses",
    }
    assert isinstance(body["addresses"], list)


# --------------------------------------------------------------------------- #
# Direcciones
# --------------------------------------------------------------------------- #
def test_list_addresses_devuelve_lista_vacia(client, seed):
    user = seed.user()

    response = client.get("/user/addresses", headers=seed.headers(user))

    assert response.status_code == 200
    assert response.json() == []


def test_create_address_devuelve_200(client, seed):
    user = seed.user()

    response = client.post(
        "/user/addresses",
        json={
            "label": "Casa",
            "address": "Calle 1 # 2-3",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111",
            "is_default": True,
        },
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id"}
    assert body["id"]


def test_create_address_sin_ciudad_devuelve_422(client, seed):
    user = seed.user()

    response = client.post(
        "/user/addresses",
        json={"address": "Calle 1", "department": "Cundinamarca"},
        headers=seed.headers(user),
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "city"


def test_update_address_devuelve_200_y_404(client, seed):
    user = seed.user()
    headers = seed.headers(user)
    created = client.post(
        "/user/addresses",
        json={"address": "Calle 1", "city": "Bogotá", "department": "Cundinamarca"},
        headers=headers,
    ).json()

    ok = client.patch(
        f"/user/addresses/{created['id']}",
        json={"address": "Carrera 9 # 8-7"},
        headers=headers,
    )
    assert ok.status_code == 200
    assert ok.json() == {"message": "Dirección actualizada correctamente"}

    missing = client.patch(
        "/user/addresses/00000000-0000-0000-0000-000000000000",
        json={"address": "Otra"},
        headers=headers,
    )
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Dirección no encontrada"}


def test_delete_address_devuelve_200_y_404(client, seed):
    user = seed.user()
    headers = seed.headers(user)
    created = client.post(
        "/user/addresses",
        json={"address": "Calle 1", "city": "Bogotá", "department": "Cundinamarca"},
        headers=headers,
    ).json()

    ok = client.delete(f"/user/addresses/{created['id']}", headers=headers)
    assert ok.status_code == 200
    assert ok.json() == {"message": "Dirección eliminada correctamente"}

    with seed.session() as session:
        assert session.query(Address).count() == 0

    missing = client.delete(
        "/user/addresses/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert missing.status_code == 404


# --------------------------------------------------------------------------- #
# Pedidos
# --------------------------------------------------------------------------- #
def test_create_order_devuelve_200_y_su_forma(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company, stock=10)

    response = client.post(
        "/user/orders", json=_order_payload(product), headers=seed.headers(buyer)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id", "status"}
    assert body["status"] == "pending"

    with seed.session() as session:
        stored = session.get(type(product), product.id)
        assert stored.stock == 8  # se descontaron las 2 unidades


def test_create_order_sin_items_devuelve_400(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    payload = _order_payload(type("P", (), {"id": "x", "name": "n"})())
    payload["items"] = []

    response = client.post("/user/orders", json=payload, headers=seed.headers(buyer))

    assert response.status_code == 400
    assert response.json() == {"detail": "El pedido debe tener al menos un producto"}


def test_create_order_producto_inexistente_devuelve_404(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    payload = _order_payload(type("P", (), {"id": "00000000-0000-0000-0000-000000000000", "name": "n"})())

    response = client.post("/user/orders", json=payload, headers=seed.headers(buyer))

    assert response.status_code == 404
    assert "no encontrado" in response.json()["detail"]


def test_create_order_sin_stock_devuelve_400(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company, stock=1)

    response = client.post(
        "/user/orders", json=_order_payload(product, quantity=5), headers=seed.headers(buyer)
    )

    assert response.status_code == 400
    assert "Stock insuficiente" in response.json()["detail"]


def test_create_order_devuelve_500_si_falla_el_guardado(client, seed, monkeypatch):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company)

    def boom(self):
        raise RuntimeError("base de datos caída")

    monkeypatch.setattr("sqlalchemy.orm.Session.commit", boom)

    response = client.post(
        "/user/orders", json=_order_payload(product), headers=seed.headers(buyer)
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al crear el pedido"}


def test_list_orders_devuelve_200_y_lista(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company)
    client.post("/user/orders", json=_order_payload(product), headers=seed.headers(buyer))

    response = client.get("/user/orders", headers=seed.headers(buyer))

    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list) and len(orders) == 1
    assert set(orders[0]) >= {"id", "status", "items", "total", "created_at"}
    assert orders[0]["items"][0]["quantity"] == 2


def test_get_order_devuelve_200_y_404(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company)
    created = client.post(
        "/user/orders", json=_order_payload(product), headers=seed.headers(buyer)
    ).json()

    ok = client.get(f"/user/orders/{created['id']}", headers=seed.headers(buyer))
    assert ok.status_code == 200
    assert ok.json()["id"] == created["id"]

    missing = client.get(
        "/user/orders/00000000-0000-0000-0000-000000000000", headers=seed.headers(buyer)
    )
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Pedido no encontrado"}


def test_cancel_order_devuelve_200_y_reponde_stock(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company, stock=5)
    created = client.post(
        "/user/orders", json=_order_payload(product, quantity=2), headers=seed.headers(buyer)
    ).json()

    response = client.patch(
        f"/user/orders/{created['id']}/cancel", headers=seed.headers(buyer)
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Pedido cancelado correctamente", "status": "cancelled"}

    with seed.session() as session:
        stored = session.get(type(product), product.id)
        assert stored.stock == 5


def test_cancel_order_ya_entregado_devuelve_400(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company)
    created = client.post(
        "/user/orders", json=_order_payload(product), headers=seed.headers(buyer)
    ).json()

    with seed.session() as session:
        from app.models.ModelOrder import Order

        session.get(Order, created["id"]).status = "delivered"

    response = client.patch(
        f"/user/orders/{created['id']}/cancel", headers=seed.headers(buyer)
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "El pedido ya no puede cancelarse"}


def test_cancel_order_inexistente_devuelve_404(client, seed):
    buyer = seed.user(email="comprador@lubix.com")

    response = client.patch(
        "/user/orders/00000000-0000-0000-0000-000000000000/cancel",
        headers=seed.headers(buyer),
    )

    assert response.status_code == 404


def test_order_invoice_devuelve_200_y_su_forma(client, seed):
    buyer = seed.user(email="comprador@lubix.com")
    company = seed.company()
    product = seed.product(company)
    created = client.post(
        "/user/orders", json=_order_payload(product), headers=seed.headers(buyer)
    ).json()

    response = client.get(
        f"/user/orders/{created['id']}/invoice", headers=seed.headers(buyer)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "invoice_number",
        "date",
        "company",
        "customer",
        "items",
        "subtotal",
        "discount",
        "shipping",
        "total",
        "payment_method",
        "status",
    }
    assert body["invoice_number"].startswith("INV-")
    assert body["company"]["name"] == "LUBIX S.A.S"


def test_order_invoice_inexistente_devuelve_404(client, seed):
    buyer = seed.user(email="comprador@lubix.com")

    response = client.get(
        "/user/orders/00000000-0000-0000-0000-000000000000/invoice",
        headers=seed.headers(buyer),
    )

    assert response.status_code == 404


# --------------------------------------------------------------------------- #
# Avatar / banner
# --------------------------------------------------------------------------- #
def test_upload_avatar_devuelve_200(client, seed):
    user = seed.user()

    response = client.post(
        "/user/avatar/upload",
        files={"file": ("avatar.png", b"contenido", "image/png")},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"success", "avatar", "url"}
    assert body["success"] is True
    assert body["url"].startswith("/files/")


def test_upload_avatar_fallo_de_almacenamiento_devuelve_500(client, seed, monkeypatch):
    user = seed.user()

    def boom(*args, **kwargs):
        raise RuntimeError("minio caído")

    monkeypatch.setattr("minio.Minio.put_object", boom)

    response = client.post(
        "/user/avatar/upload",
        files={"file": ("avatar.png", b"contenido", "image/png")},
        headers=seed.headers(user),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir avatar"}
