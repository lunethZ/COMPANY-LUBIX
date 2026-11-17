import uuid
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError


def test_order_repository_crud_and_queries(factories, repositories):
    repository = repositories["OrderRepository"]
    user = factories.user()
    other_user = factories.user()

    order = repository.create(
        status="pending",
        subtotal=Decimal("200.00"),
        discount=Decimal("10.00"),
        shipping=Decimal("15.00"),
        total=Decimal("205.00"),
        payment_method="tarjeta",
        recipient="Destinatario S6",
        address="Calle 7 # 8-9",
        city="Bogotá",
        department="Cundinamarca",
        postal_code="110111",
        user_id=user.id,
    )
    item = factories.order_item(order=order)
    delivered = factories.order(user=other_user, status="delivered")

    assert repository.get_by_id(order.id) is order
    assert repository.list_by_user(user.id) == [order]
    assert repository.list_by_status("pending") == [order]
    assert repository.get_with_items(order.id).id == order.id
    assert [row.id for row in repository.get_with_items(order.id).items] == [item.id]
    assert repository.count(user_id=user.id) == 1
    assert repository.get_by_id(order.id).user.id == user.id
    assert delivered not in repository.list_by_user(user.id)

    repository.update(order, status="paid", total=Decimal("210.00"))
    assert repository.get_by_id(order.id).status == "paid"
    assert repository.list_by_status("pending") == []

    repository.delete(order)
    assert repository.get_by_id(order.id) is None
    assert repository.get_with_items(order.id) is None


def test_order_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["OrderRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            recipient="Sin Usuario",
            address="Calle 1 # 1-1",
            city="Bogotá",
            department="Cundinamarca",
            user_id=uuid.uuid4(),
        )
    pg_session.rollback()
