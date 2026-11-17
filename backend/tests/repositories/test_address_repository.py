import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_address_repository_crud_and_queries(factories, repositories):
    repository = repositories["AddressRepository"]
    user = factories.user()
    other_user = factories.user()

    address = repository.create(
        label="Casa",
        address="Calle 5 # 6-7",
        city="Medellín",
        department="Antioquia",
        postal_code="050001",
        is_default=True,
        user_id=user.id,
    )
    other = factories.address(user=other_user)

    assert repository.get_by_id(address.id) is address
    assert repository.list_by_user(user.id) == [address]
    assert repository.list_default_by_user(user.id) == [address]
    assert repository.get_by(label="Casa") is address
    assert repository.count() == 2
    assert repository.get_by_id(address.id).user.id == user.id
    assert other not in repository.list_by_user(user.id)

    repository.update(address, city="Cali", is_default=False)
    assert repository.get_by_id(address.id).city == "Cali"
    assert repository.list_default_by_user(user.id) == []

    repository.delete(address)
    assert repository.get_by_id(address.id) is None
    assert repository.list_by_user(user.id) == []


def test_address_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["AddressRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            address="Calle 9 # 9-9",
            city="Bogotá",
            department="Cundinamarca",
            user_id=uuid.uuid4(),
        )
    pg_session.rollback()
