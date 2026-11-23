import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_cart_item_repository_crud_and_queries(factories, repositories):
    repository = repositories["CartItemRepository"]
    cart = factories.cart()
    product = factories.product()
    other_cart = factories.cart()

    item = repository.create(quantity=3, cart_id=cart.id, product_id=product.id)
    other = factories.cart_item(cart=other_cart)

    assert repository.get_by_id(item.id) is item
    assert repository.list_by_cart(cart.id) == [item]
    assert repository.get_by_cart_and_product(cart.id, product.id).id == item.id
    assert repository.count(cart_id=cart.id) == 1
    assert item.cart.id == cart.id
    assert item.product.id == product.id
    assert other not in repository.list_by_cart(cart.id)

    repository.update(item, quantity=5)
    assert repository.get_by_id(item.id).quantity == 5

    repository.delete(item)
    assert repository.get_by_id(item.id) is None
    assert repository.list_by_cart(cart.id) == []


def test_cart_item_repository_unique_cart_product_constraint(
    pg_session, factories, repositories
):
    repository = repositories["CartItemRepository"]
    existing = factories.cart_item()

    with pytest.raises(IntegrityError):
        repository.create(
            quantity=1, cart_id=existing.cart_id, product_id=existing.product_id
        )
    pg_session.rollback()


def test_cart_item_repository_foreign_key_constraint(pg_session, factories, repositories):
    repository = repositories["CartItemRepository"]
    cart = factories.cart()

    with pytest.raises(IntegrityError):
        repository.create(quantity=1, cart_id=cart.id, product_id=uuid.uuid4())
    pg_session.rollback()
