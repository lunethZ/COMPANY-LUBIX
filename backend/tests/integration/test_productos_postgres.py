"""Creación de productos contra PostgreSQL real."""
from decimal import Decimal
import uuid

import pytest

from app.models.ModelProduct import Catalog, Product

pytestmark = pytest.mark.integration

PAYLOAD = {
    "name": "Celular Postgres",
    "price": 1200000,
    "images": [],
    "discount_enable": False,
    "discount_value": 0,
    "stock": 5,
    "descripcion": "Un celular de prueba",
    "technical_spec": {"brand": "Marca"},
    "catalog_name": "Celulares Postgres",
}


def test_crear_producto_lo_guarda_en_postgres(client, db_session, empresa, headers_empresa):
    _, company = empresa

    response = client.post("/company/products", json=PAYLOAD, headers=headers_empresa)

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == PAYLOAD["name"]

    product = db_session.get(Product, uuid.UUID(body["id"]))
    assert product is not None
    assert product.company_id == company.id
    assert product.price == Decimal("1200000.00")
    assert product.stock == PAYLOAD["stock"]
    assert product.status == "active"
    assert product.descripcion == PAYLOAD["descripcion"]

    catalog = (
        db_session.query(Catalog)
        .filter(Catalog.name == PAYLOAD["catalog_name"])
        .one()
    )
    assert product.catalog_id == catalog.id


def test_crear_producto_con_nombre_repetido_devuelve_400(
    client, db_session, headers_empresa
):
    first = client.post("/company/products", json=PAYLOAD, headers=headers_empresa)
    assert first.status_code == 200

    second = client.post("/company/products", json=PAYLOAD, headers=headers_empresa)

    assert second.status_code == 400
    assert second.json() == {"detail": "Ya existe un producto con ese nombre"}
    assert db_session.query(Product).filter(Product.name == PAYLOAD["name"]).count() == 1


def test_nombre_de_51_caracteres_devuelve_500_y_no_guarda(
    client, db_session, headers_empresa
):
    """Hallazgo: `CreateProductRequest.name` no limita a 50 caracteres.

    La columna es VARCHAR(50); PostgreSQL lanza DataError y el servicio lo
    convierte en 500. Lo correcto sería validar en el esquema y devolver 422.
    """
    payload = {**PAYLOAD, "name": "x" * 51}

    response = client.post("/company/products", json=payload, headers=headers_empresa)

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al crear el producto"}
    assert db_session.query(Product).filter(Product.name == payload["name"]).count() == 0
