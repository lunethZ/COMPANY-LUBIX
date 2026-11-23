import uuid
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError


def test_order_item_repository_crud_and_queries(factories, repositories):
    repository = repositories["OrderItemRepository"]
    order = factories.order()
    product = factories.product()
    other_order = factories.order()

    item = repository.create(
        name="Item S6",
        price=Decimal("1500.00"),
        quantity=2,
        order_id=order.id,
        product_id=product.id,
    )
    other = factories.order_item(order=other_order)

    assert repository.get_by_id(item.id) is item
    assert repository.list_by_order(order.id) == [item]
    assert repository.count(order_id=order.id) == 1
    assert item.order.id == order.id
    assert item.product.id == product.id
    assert other not in repository.list_by_order(order.id)

    repository.update(item, name="Item Actualizado", quantity=4)
    assert repository.get_by_id(item.id).name == "Item Actualizado"
    assert repository.get_by_id(item.id).quantity == 4

    repository.delete(item)
    assert repository.get_by_id(item.id) is None
    assert repository.list_by_order(order.id) == []


def test_order_item_repository_foreign_key_constraint(pg_session, factories, repositories):
    repository = repositories["OrderItemRepository"]
    order = factories.order()

    with pytest.raises(IntegrityError):
        repository.create(
            name="Item Huérfano",
            price=Decimal("100.00"),
            quantity=1,
            order_id=uuid.uuid4(),
        )
    pg_session.rollback()
