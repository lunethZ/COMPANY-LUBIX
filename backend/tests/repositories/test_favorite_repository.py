import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_favorite_repository_crud_and_queries(factories, repositories):
    repository = repositories["FavoriteRepository"]
    user = factories.user()
    product = factories.product()
    other_user = factories.user()

    favorite = repository.create(user_id=user.id, product_id=product.id)
    other = factories.favorite(user=other_user)

    assert repository.get_by_id(favorite.id) is favorite
    assert repository.list_by_user(user.id) == [favorite]
    assert repository.get_by_user_and_product(user.id, product.id).id == favorite.id
    assert repository.count(user_id=user.id) == 1
    assert favorite.product.id == product.id
    assert other not in repository.list_by_user(user.id)

    repository.update(favorite, user_id=favorite.user_id)
    assert repository.get_by_id(favorite.id).user.id == user.id

    repository.delete(favorite)
    assert repository.get_by_id(favorite.id) is None
    assert repository.get_by_user_and_product(user.id, product.id) is None


def test_favorite_repository_unique_user_product_constraint(
    pg_session, factories, repositories
):
    repository = repositories["FavoriteRepository"]
    existing = factories.favorite()

    with pytest.raises(IntegrityError):
        repository.create(user_id=existing.user_id, product_id=existing.product_id)
    pg_session.rollback()


def test_favorite_repository_foreign_key_constraint(pg_session, factories, repositories):
    repository = repositories["FavoriteRepository"]
    user = factories.user()

    with pytest.raises(IntegrityError):
        repository.create(user_id=user.id, product_id=uuid.uuid4())
    pg_session.rollback()
