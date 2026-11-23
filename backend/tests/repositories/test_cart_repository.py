import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_cart_repository_crud_and_queries(factories, repositories):
    repository = repositories["CartRepository"]
    user = factories.user()

    cart = repository.create(user_id=user.id)
    item = factories.cart_item(cart=cart)

    assert repository.get_by_id(cart.id) is cart
    assert repository.get_by_user(user.id).id == cart.id
    assert repository.get_with_items(user.id).id == cart.id
    assert [row.id for row in repository.get_with_items(user.id).items] == [item.id]
    assert repository.list() == [cart]
    assert repository.count(user_id=user.id) == 1

    repository.update(cart, user_id=cart.user_id)
    assert repository.get_by_id(cart.id).user.id == user.id

    repository.delete(cart)
    assert repository.get_by_id(cart.id) is None
    assert repository.get_by_user(user.id) is None


def test_cart_repository_unique_user_constraint(pg_session, factories, repositories):
    repository = repositories["CartRepository"]
    user = factories.user()
    factories.cart(user=user)

    with pytest.raises(IntegrityError):
        repository.create(user_id=user.id)
    pg_session.rollback()


def test_cart_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["CartRepository"]

    with pytest.raises(IntegrityError):
        repository.create(user_id=uuid.uuid4())
    pg_session.rollback()
