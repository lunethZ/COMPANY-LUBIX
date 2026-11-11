"""Tests de los endpoints de empresa (/company)."""

PRODUCT_PAYLOAD = {
    "name": "Celular de Prueba",
    "price": 1200000,
    "images": [],
    "discount_enable": False,
    "discount_value": 0,
    "stock": 5,
    "descripcion": "Un celular de prueba",
    "technical_spec": {"brand": "Marca"},
    "catalog_name": "Celulares",
}


def _create_order(client, seed, buyer, product, *, quantity=1):
    total = float(product.price) * quantity
    payload = {
        "items": [
            {
                "product_id": str(product.id),
                "name": product.name,
                "price": float(product.price),
                "quantity": quantity,
            }
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
    response = client.post("/user/orders", json=payload, headers=seed.headers(buyer))
    assert response.status_code == 200
    return response.json()


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
def test_dashboard_me_devuelve_200_y_su_forma(client, seed):
    company = seed.company()

    response = client.get("/company/dashboard/me", headers=seed.headers(company))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
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
    assert body["role"] == "company"
    assert body["nameCompany"] == "Empresa Prueba"


def test_my_profile_devuelve_200_y_su_forma(client, seed):
    company = seed.company()

    response = client.get("/company/dashboard/my-profile", headers=seed.headers(company))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
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
    assert body["sellerLevel"] == "Bronze"


def test_upgrade_profile_devuelve_200(client, seed):
    company = seed.company()

    response = client.patch(
        " /company/dashboard/upgrade-my-profile".strip(),
        json={"nameCompany": "Empresa Renombrada"},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    assert response.json() == {"messaje": "Perfil actualizado correctamente"}


def test_upgrade_profile_email_en_uso_devuelve_400(client, seed):
    company = seed.company()
    seed.user(email="ocupado@lubix.com")

    response = client.patch(
        "/company/dashboard/upgrade-my-profile",
        json={"emailCompany": "ocupado@lubix.com"},
        headers=seed.headers(company),
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "El correo ya esta en uso"}


def test_upgrade_profile_email_invalido_devuelve_422(client, seed):
    company = seed.company()

    response = client.patch(
        "/company/dashboard/upgrade-my-profile",
        json={"emailCompany": "no-es-correo"},
        headers=seed.headers(company),
    )

    assert response.status_code == 422


# --------------------------------------------------------------------------- #
# Productos
# --------------------------------------------------------------------------- #
def test_list_products_devuelve_200_y_lista(client, seed):
    company = seed.company()
    seed.product(company)

    response = client.get("/company/products", headers=seed.headers(company))

    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list) and len(products) == 1
    assert set(products[0]) >= {
        "id",
        "name",
        "price",
        "stock",
        "status",
        "descripcion",
        "company_id",
        "sold",
    }


def test_create_product_devuelve_200(client, seed):
    company = seed.company()

    response = client.post(
        "/company/products", json=PRODUCT_PAYLOAD, headers=seed.headers(company)
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id", "name"}
    assert body["name"] == PRODUCT_PAYLOAD["name"]


def test_create_product_precio_negativo_devuelve_422(client, seed):
    company = seed.company()
    payload = {**PRODUCT_PAYLOAD, "name": "Precio negativo", "price": -100}

    response = client.post("/company/products", json=payload, headers=seed.headers(company))

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"][-1] == "price"
    assert "precio" in detail["msg"]


def test_create_product_precio_cero_devuelve_422(client, seed):
    company = seed.company()
    payload = {**PRODUCT_PAYLOAD, "name": "Precio cero", "price": 0}

    response = client.post("/company/products", json=payload, headers=seed.headers(company))

    assert response.status_code == 422


def test_create_product_stock_negativo_devuelve_422(client, seed):
    company = seed.company()
    payload = {**PRODUCT_PAYLOAD, "name": "Stock negativo", "stock": -3}

    response = client.post("/company/products", json=payload, headers=seed.headers(company))

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"][-1] == "stock"
    assert "stock" in detail["msg"]


def test_create_product_descuento_invalido_devuelve_422(client, seed):
    company = seed.company()
    payload = {**PRODUCT_PAYLOAD, "name": "Descuento raro", "discount_value": 150}

    response = client.post("/company/products", json=payload, headers=seed.headers(company))

    assert response.status_code == 422


def test_create_product_nombre_duplicado_devuelve_400(client, seed):
    company = seed.company()
    seed.product(company, name="Ya Existe")

    payload = {**PRODUCT_PAYLOAD, "name": "Ya Existe"}
    response = client.post("/company/products", json=payload, headers=seed.headers(company))

    assert response.status_code == 400
    assert response.json() == {"detail": "Ya existe un producto con ese nombre"}


def test_get_product_devuelve_200_y_404(client, seed):
    company = seed.company()
    product = seed.product(company)
    headers = seed.headers(company)

    ok = client.get(f"/company/products/{product.id}", headers=headers)
    assert ok.status_code == 200
    assert set(ok.json()) >= {"id", "name", "price", "stock", "status"}

    missing = client.get(
        "/company/products/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Producto no encontrado"}


def test_update_product_devuelve_200(client, seed):
    company = seed.company()
    product = seed.product(company)

    response = client.patch(
        f"/company/products/{product.id}",
        json={"price": 999.0, "stock": 7},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Producto actualizado correctamente"


def test_update_product_precio_negativo_sin_validacion_server(client, seed):
    """Documenta una brecha: `UpdateProductRequest` no valida `price`.

    A diferencia de `CreateProductRequest` (que sí rechaza precios <= 0 con
    422), el endpoint de actualización acepta valores negativos. Se deja
    registrado el comportamiento actual; el bloqueo en el cliente se cubre
    con `validators.ts` en el formulario del dashboard.
    """
    company = seed.company()
    product = seed.product(company)

    response = client.patch(
        f"/company/products/{product.id}",
        json={"price": -50},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Producto actualizado correctamente"


def test_update_product_stock_negativo_sin_validacion_server(client, seed):
    """Igual que el anterior: el stock negativo no se rechaza al actualizar."""
    company = seed.company()
    product = seed.product(company)

    response = client.patch(
        f"/company/products/{product.id}",
        json={"stock": -1},
        headers=seed.headers(company),
    )

    assert response.status_code == 200


def test_update_product_inexistente_devuelve_404(client, seed):
    company = seed.company()

    response = client.patch(
        "/company/products/00000000-0000-0000-0000-000000000000",
        json={"price": 10},
        headers=seed.headers(company),
    )

    assert response.status_code == 404


def test_toggle_status_devuelve_200(client, seed):
    company = seed.company()
    product = seed.product(company)

    response = client.patch(
        f"/company/products/{product.id}/status", headers=seed.headers(company)
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "inactive"
    assert "message" in body


def test_delete_product_devuelve_200_y_404(client, seed):
    company = seed.company()
    product = seed.product(company)
    headers = seed.headers(company)

    ok = client.delete(f"/company/products/{product.id}", headers=headers)
    assert ok.status_code == 200
    assert ok.json() == {"message": "Producto eliminado correctamente"}

    missing = client.delete(
        "/company/products/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert missing.status_code == 404


# --------------------------------------------------------------------------- #
# Pedidos de la empresa
# --------------------------------------------------------------------------- #
def test_company_orders_devuelve_lista(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    _create_order(client, seed, buyer, product)

    response = client.get("/company/orders", headers=seed.headers(company))

    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list) and len(orders) == 1
    assert set(orders[0]) >= {
        "id",
        "status",
        "items",
        "buyer_email",
        "buyer_name",
        "delivery_progress",
    }
    assert orders[0]["buyer_email"] == "comprador@lubix.com"


def test_update_order_status_devuelve_200(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    order = _create_order(client, seed, buyer, product)

    response = client.patch(
        f"/company/orders/{order['id']}/status",
        json={"status": "confirmed"},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "status", "delivery_progress"}
    assert body["status"] == "confirmed"


def test_update_order_status_transicion_invalida_devuelve_400(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    order = _create_order(client, seed, buyer, product)

    response = client.patch(
        f"/company/orders/{order['id']}/status",
        json={"status": "delivered"},
        headers=seed.headers(company),
    )

    assert response.status_code == 400
    assert "No se puede cambiar" in response.json()["detail"]


def test_update_order_status_pedido_inexistente_devuelve_404(client, seed):
    company = seed.company()

    response = client.patch(
        "/company/orders/00000000-0000-0000-0000-000000000000/status",
        json={"status": "confirmed"},
        headers=seed.headers(company),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Pedido no encontrado"}


def test_update_order_status_sin_productos_propios_devuelve_403(client, seed):
    empresa_propia = seed.company(email="propia@lubix.com", nit="900111222")
    empresa_ajena = seed.company(email="ajena@lubix.com", nit="900333444")
    product = seed.product(empresa_ajena)
    buyer = seed.user(email="comprador@lubix.com")
    order = _create_order(client, seed, buyer, product)

    response = client.patch(
        f"/company/orders/{order['id']}/status",
        json={"status": "confirmed"},
        headers=seed.headers(empresa_propia),
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Este pedido no contiene productos de tu empresa"}


# --------------------------------------------------------------------------- #
# Subida de archivos
# --------------------------------------------------------------------------- #
def test_upload_logo_devuelve_200(client, seed):
    company = seed.company()

    response = client.patch(
        "/company/dashboard/upload-logo",
        files={"file": ("logo.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "logo"}
    assert body["logo"]


def test_upload_logo_fallo_devuelve_500(client, seed, monkeypatch):
    company = seed.company()

    monkeypatch.setattr(
        "app.services.NasService.subir.upload_file",
        lambda *args, **kwargs: {"success": False},
    )

    response = client.patch(
        "/company/dashboard/upload-logo",
        files={"file": ("logo.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir la imagen"}


def test_upload_banner_devuelve_200(client, seed):
    company = seed.company()

    response = client.patch(
        "/company/dashboard/upload-banner",
        files={"file": ("banner.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    assert set(response.json()) == {"message", "banner"}


def test_upload_product_image_devuelve_200(client, seed):
    company = seed.company()

    response = client.post(
        "/company/products/upload-image",
        files={"file": ("producto.jpg", b"contenido", "image/jpeg")},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"success", "path", "url", "object_name"}
    assert body["success"] is True


def test_upload_product_image_fallo_devuelve_500(client, seed, monkeypatch):
    company = seed.company()

    monkeypatch.setattr(
        "app.services.NasService.subir.upload_file",
        lambda *args, **kwargs: {"success": False},
    )

    response = client.post(
        "/company/products/upload-image",
        files={"file": ("producto.jpg", b"contenido", "image/jpeg")},
        headers=seed.headers(company),
    )

    assert response.status_code == 500


# --------------------------------------------------------------------------- #
# Permisos
# --------------------------------------------------------------------------- #
def test_usuario_normal_no_puede_usar_rutas_de_empresa(client, seed):
    user = seed.user()

    response = client.get("/company/dashboard/me", headers=seed.headers(user))

    assert response.status_code == 401
    assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}


def test_rutas_de_empresa_sin_token_devuelve_401(client, seed):
    seed.roles("company")

    response = client.get("/company/products")

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}
