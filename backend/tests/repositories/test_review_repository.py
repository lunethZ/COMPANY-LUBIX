import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_review_repository_crud_and_queries(factories, repositories):
    repository = repositories["ReviewRepository"]
    user = factories.user()
    product = factories.product()
    other_product = factories.product()

    review = repository.create(
        rating=4,
        title="Buena compra",
        comment="Producto conforme",
        user_id=user.id,
        product_id=product.id,
    )
    other = factories.review(product=other_product)

    assert repository.get_by_id(review.id) is review
    assert repository.list_by_user(user.id) == [review]
    assert repository.list_by_product(product.id) == [review]
    assert repository.get_by_user_and_product(user.id, product.id).id == review.id
    assert repository.count(product_id=product.id) == 1
    assert review.user.id == user.id
    assert other not in repository.list_by_product(product.id)

    repository.update(review, rating=5, comment="Excelente")
    assert repository.get_by_id(review.id).rating == 5
    assert repository.get_by_id(review.id).comment == "Excelente"

    repository.delete(review)
    assert repository.get_by_id(review.id) is None
    assert repository.get_by_user_and_product(user.id, product.id) is None


def test_review_repository_unique_user_product_constraint(
    pg_session, factories, repositories
):
    repository = repositories["ReviewRepository"]
    existing = factories.review()

    with pytest.raises(IntegrityError):
        repository.create(
            rating=3,
            comment="Duplicado",
            user_id=existing.user_id,
            product_id=existing.product_id,
        )
    pg_session.rollback()


def test_review_repository_foreign_key_constraint(pg_session, factories, repositories):
    repository = repositories["ReviewRepository"]
    product = factories.product()

    with pytest.raises(IntegrityError):
        repository.create(
            rating=3,
            comment="Sin usuario",
            user_id=uuid.uuid4(),
            product_id=product.id,
        )
    pg_session.rollback()
