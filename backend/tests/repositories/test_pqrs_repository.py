import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_pqrs_repository_crud_and_queries(factories, repositories):
    repository = repositories["PQRSRepository"]
    user = factories.user()
    other_user = factories.user()

    pqrs = repository.create(
        type="queja",
        subject="Queja S6",
        description="Descripción de la queja",
        status="pending",
        user_id=user.id,
        user_role="user",
    )
    other = factories.pqrs(user=other_user, status="resolved", user_role="company")

    assert repository.get_by_id(pqrs.id) is pqrs
    assert repository.list_by_user(user.id) == [pqrs]
    assert repository.list_by_status("pending") == [pqrs]
    assert repository.list_by_user_role("user") == [pqrs]
    assert repository.count(status="pending") == 1
    assert repository.get_by_id(pqrs.id).user.id == user.id
    assert other not in repository.list_by_user(user.id)

    repository.update(pqrs, status="in_review", subject="Queja revisada")
    assert repository.get_by_id(pqrs.id).status == "in_review"
    assert repository.list_by_status("pending") == []

    repository.delete(pqrs)
    assert repository.get_by_id(pqrs.id) is None
    assert repository.list_by_user(user.id) == []


def test_pqrs_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["PQRSRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            type="queja",
            subject="Sin usuario",
            description="Descripción",
            status="pending",
            user_id=uuid.uuid4(),
            user_role="user",
        )
    pg_session.rollback()
