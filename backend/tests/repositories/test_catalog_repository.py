import pytest
from sqlalchemy.exc import IntegrityError


def test_catalog_repository_crud_and_queries(factories, repositories):
    repository = repositories["CatalogRepository"]

    catalog = repository.create(name="Celulares")
    other = factories.catalog(name="Computadores")

    assert repository.get_by_id(catalog.id) is catalog
    assert repository.get_by_name("Celulares").id == catalog.id
    assert repository.list() == [catalog, other]
    assert repository.count() == 2

    repository.update(catalog, name="Telefonía")
    assert repository.get_by_id(catalog.id).name == "Telefonía"
    assert repository.get_by_name("Celulares") is None

    repository.delete(catalog)
    assert repository.get_by_id(catalog.id) is None
    assert repository.list() == [other]


def test_catalog_repository_unique_name_constraint(pg_session, factories, repositories):
    repository = repositories["CatalogRepository"]
    factories.catalog(name="Duplicado")

    with pytest.raises(IntegrityError):
        repository.create(name="Duplicado")
    pg_session.rollback()
