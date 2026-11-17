import uuid
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError


def test_product_repository_crud_and_queries(factories, repositories):
    repository = repositories["ProductRepository"]
    company = factories.company()
    catalog = factories.catalog(name="Celulares")
    other_company = factories.company()
    other_catalog = factories.catalog(name="Tablets")

    product = repository.create(
        name="Celular S6",
        price=Decimal("1500.00"),
        discount_value=Decimal("0.00"),
        stock=2,
        status="active",
        descripcion="Producto de prueba",
        images=["/files/image.png"],
        technical_spec={"brand": "Lubix"},
        company_id=company.id,
        catalog_id=catalog.id,
    )
    inactive = factories.product(
        company=other_company,
        catalog=other_catalog,
        status="inactive",
        stock=50,
    )

    assert repository.get_by_id(product.id) is product
    assert repository.get_by_name("Celular S6").id == product.id
    assert repository.list_by_company(company.id) == [product]
    assert repository.list_by_catalog(catalog.id) == [product]
    assert repository.list_active() == [product]
    assert [item.id for item in repository.list_low_stock(5)] == [product.id]
    assert repository.count(status="active") == 1
    assert repository.get_by_id(product.id).catalog.name == "Celulares"
    assert repository.get_by_id(product.id).company.id == company.id
    assert inactive not in repository.list_active()

    repository.update(product, stock=25, price=Decimal("1400.00"))
    assert repository.get_by_id(product.id).stock == 25
    assert repository.list_low_stock(5) == []

    repository.delete(product)
    assert repository.get_by_id(product.id) is None


def test_product_repository_unique_name_constraint(pg_session, factories, repositories):
    repository = repositories["ProductRepository"]
    existing = factories.product()

    with pytest.raises(IntegrityError):
        repository.create(
            name=existing.name,
            price=Decimal("100.00"),
            discount_value=Decimal("0.00"),
            stock=1,
            descripcion="Duplicado",
            company_id=existing.company_id,
        )
    pg_session.rollback()


def test_product_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["ProductRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            name="Producto Sin Empresa",
            price=Decimal("100.00"),
            discount_value=Decimal("0.00"),
            stock=1,
            descripcion="Sin empresa",
            company_id=uuid.uuid4(),
        )
    pg_session.rollback()
