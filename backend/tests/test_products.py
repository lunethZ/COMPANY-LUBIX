"""Tests del catálogo público (/products) y de las reseñas.

`GET /products/*` es ruta pública (la middleware deja pasar los GET); las
escrituras exigen token con rol "user" y, para reseñar, haber comprado el
producto.
"""

from app.models.ModelOrder import Order


def _buy(client, seed, buyer, product, *, status="delivered"):
    """Crea un pedido del comprador y lo deja en un estado que permite reseñar."""
    total = float(product.price)
    payload = {
        "items": [
            {
                "product_id": str(product.id),
                "name": product.name,
                "price": float(product.price),
                "quantity": 1,
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

    with seed.session() as session:
        session.get(Order, response.json()["id"]).status = status
    return response.json()


# --------------------------------------------------------------------------- #
# Catálogo
# --------------------------------------------------------------------------- #
def test_catalogs_devuelve_200_y_lista(client, seed):
    company = seed.company()
    catalog = seed.catalog("Celulares")
    seed.product(company, catalog=catalog)

    response = client.get("/products/catalogs")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert set(body[0]) == {"id", "name", "product_count"}
    assert body[0]["name"] == "Celulares"
    assert body[0]["product_count"] == 1


def test_catalogs_sin_productos_devuelve_lista_vacia(client, seed):
    seed.roles("user")

    response = client.get("/products/catalogs")

    assert response.status_code == 200
    assert response.json() == []


def test_search_devuelve_200_y_su_forma(client, seed):
    company = seed.company()
    seed.product(company, name="Laptop Gamer")

    response = client.get("/products/search")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"products"}
    assert len(body["products"]) == 1
    assert set(body["products"][0]) >= {
        "id",
        "name",
        "price",
        "images",
        "stock",
        "company_name",
        "avg_rating",
        "review_count",
    }
    assert body["products"][0]["avg_rating"] == 0.0


def test_search_filtra_por_texto(client, seed):
    company = seed.company()
    seed.product(company, name="Laptop Gamer")
    seed.product(company, name="Audífonos Bluetooth")

    ok = client.get("/products/search", params={"q": "laptop"})
    assert ok.status_code == 200
    assert len(ok.json()["products"]) == 1

    empty = client.get("/products/search", params={"q": "televisor"})
    assert empty.status_code == 200
    assert empty.json() == {"products": []}


def test_search_filtra_por_precio_y_ordena(client, seed):
    company = seed.company()
    seed.product(company, name="Barato", price=100.0)
    seed.product(company, name="Caro", price=900.0)

    rango = client.get("/products/search", params={"min": 50, "max": 200})
    assert rango.status_code == 200
    assert [p["name"] for p in rango.json()["products"]] == ["Barato"]

    ordenado = client.get("/products/search", params={"orden": "price_desc"})
    assert [p["name"] for p in ordenado.json()["products"]] == ["Caro", "Barato"]


def test_search_ignora_productos_inactivos(client, seed):
    company = seed.company()
    seed.product(company, name="Oculto", status="inactive")

    response = client.get("/products/search")

    assert response.status_code == 200
    assert response.json() == {"products": []}


# --------------------------------------------------------------------------- #
# Detalle de producto
# --------------------------------------------------------------------------- #
def test_get_product_devuelve_200_y_su_forma(client, seed):
    company = seed.company()
    product = seed.product(company)

    response = client.get(f"/products/{product.id}")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
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
    assert body["company_name"] == company.nameCompany


def test_get_product_inexistente_devuelve_404(client, seed):
    seed.roles("user")

    response = client.get("/products/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
    assert response.json() == {"detail": "Producto no encontrado"}


def test_get_product_inactivo_devuelve_404(client, seed):
    company = seed.company()
    product = seed.product(company, status="inactive")

    response = client.get(f"/products/{product.id}")

    assert response.status_code == 404


# --------------------------------------------------------------------------- #
# Reseñas (lectura)
# --------------------------------------------------------------------------- #
def test_reviews_devuelve_lista_con_forma(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    _buy(client, seed, buyer, product)
    headers = seed.headers(buyer)
    client.post(
        f"/products/{product.id}/reviews",
        json={"rating": 5, "title": "Excelente", "comment": "Muy buen producto"},
        headers=headers,
    )

    response = client.get(f"/products/{product.id}/reviews")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list) and len(body) == 1
    assert set(body[0]) == {
        "id",
        "rating",
        "title",
        "comment",
        "created_at",
        "user_name",
    }
    assert body[0]["rating"] == 5
    assert body[0]["user_name"] == buyer.fullName


def test_reviews_producto_inexistente_devuelve_404(client, seed):
    seed.roles("user")

    response = client.get("/products/00000000-0000-0000-0000-000000000000/reviews")

    assert response.status_code == 404
    assert response.json() == {"detail": "Producto no encontrado"}


# --------------------------------------------------------------------------- #
# Reseñas (escritura)
# --------------------------------------------------------------------------- #
def test_create_review_devuelve_200(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    _buy(client, seed, buyer, product)

    response = client.post(
        f"/products/{product.id}/reviews",
        json={"rating": 4, "title": "Buena", "comment": "Cumple lo esperado"},
        headers=seed.headers(buyer),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"message", "id"}
    assert body["message"] == "Reseña creada correctamente"


def test_create_review_sin_compra_devuelve_403(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")

    response = client.post(
        f"/products/{product.id}/reviews",
        json={"rating": 5, "title": "Ok", "comment": "Sin haber comprado"},
        headers=seed.headers(buyer),
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Solo puedes reseñar productos que hayas comprado"
    }


def test_create_review_duplicada_devuelve_400(client, seed):
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    _buy(client, seed, buyer, product)
    headers = seed.headers(buyer)
    payload = {"rating": 5, "title": "Ok", "comment": "Primera reseña"}
    assert (
        client.post(f"/products/{product.id}/reviews", json=payload, headers=headers).status_code
        == 200
    )

    response = client.post(
        f"/products/{product.id}/reviews", json=payload, headers=headers
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Ya has calificado este producto"}


def test_create_review_producto_inexistente_devuelve_404(client, seed):
    buyer = seed.user(email="comprador@lubix.com")

    response = client.post(
        "/products/00000000-0000-0000-0000-000000000000/reviews",
        json={"rating": 5, "title": "Ok", "comment": "Producto fantasma"},
        headers=seed.headers(buyer),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Producto no encontrado"}


def test_create_review_rating_invalido_devuelve_401(client, seed):
    """Validación fallida reportada como 401.

    El router valida a mano con `CreateReviewRequest(**data)` (sin FastAPI),
    así que la `ValidationError` de Pydantic se escapa del endpoint y el
    `except Exception` de `auth_middleware` la convierte en 401 "Token
    invalido" en lugar de un 422/500. Se deja documentado el comportamiento
    actual: es un falso negativo de autenticación.
    """
    company = seed.company()
    product = seed.product(company)
    buyer = seed.user(email="comprador@lubix.com")
    _buy(client, seed, buyer, product)

    response = client.post(
        f"/products/{product.id}/reviews",
        json={"rating": 9, "title": "Ok", "comment": "Calificación fuera de rango"},
        headers=seed.headers(buyer),
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Token invalido"}


def test_create_review_sin_token_devuelve_401(client, seed):
    company = seed.company()
    product = seed.product(company)

    response = client.post(
        f"/products/{product.id}/reviews",
        json={"rating": 5, "title": "Ok", "comment": "Sin identificar"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_create_review_rol_company_devuelve_403(client, seed):
    company = seed.company()
    product = seed.product(company)

    response = client.post(
        f"/products/{product.id}/reviews",
        json={"rating": 5, "title": "Ok", "comment": "Auto-reseña"},
        headers=seed.headers(company),
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Solo usuarios pueden crear reseñas"}


# --------------------------------------------------------------------------- #
# Relacionados y perfil de empresa
# --------------------------------------------------------------------------- #
def test_related_products_devuelve_lista(client, seed):
    company = seed.company()
    product = seed.product(company, name="Principal")
    seed.product(company, name="Complemento")

    response = client.get(f"/products/{product.id}/related")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"products"}
    assert len(body["products"]) == 1
    assert body["products"][0]["name"] == "Complemento"


def test_related_products_inexistente_devuelve_404(client, seed):
    seed.roles("user")

    response = client.get("/products/00000000-0000-0000-0000-000000000000/related")

    assert response.status_code == 404


def test_company_profile_devuelve_200_y_su_forma(client, seed):
    company = seed.company()

    response = client.get(f"/products/company/{company.id}/profile")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
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
    assert body["name"] == company.nameCompany


def test_company_profile_id_invalido_devuelve_400(client, seed):
    seed.roles("user")

    response = client.get("/products/company/no-es-uuid/profile")

    assert response.status_code == 400
    assert response.json() == {"detail": "ID de empresa inválido"}


def test_company_profile_inexistente_devuelve_404(client, seed):
    seed.roles("user")

    response = client.get(
        "/products/company/00000000-0000-0000-0000-000000000000/profile"
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Empresa no encontrada"}
