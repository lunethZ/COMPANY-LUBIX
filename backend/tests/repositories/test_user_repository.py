import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_user_repository_crud_and_queries(factories, repositories):
    repository = repositories["UserRepository"]
    role = factories.role(name="company")
    other_role = factories.role(name="buyer")

    user = repository.create(
        fullName="Ana Repository",
        email="ana.repo@lubix.com",
        hashed_password="hashed",
        tell="3001112233",
        verified=True,
        isActive=True,
        role_id=role.id,
    )
    inactive = factories.user(role=other_role, isActive=False)

    assert repository.get_by_id(user.id) is user
    assert repository.get_by_email("ana.repo@lubix.com").id == user.id
    assert repository.list_by_role("company") == [user]
    assert repository.list_active() == [user]
    assert repository.count(isActive=False) == 1
    assert inactive not in repository.list_active()

    repository.update(user, fullName="Ana Actualizada")
    assert repository.get_by_id(user.id).fullName == "Ana Actualizada"

    repository.delete(user)
    assert repository.get_by_id(user.id) is None


def test_user_repository_unique_email_constraint(pg_session, factories, repositories):
    repository = repositories["UserRepository"]
    existing = factories.user()

    with pytest.raises(IntegrityError):
        repository.create(
            fullName="Duplicado",
            email=existing.email,
            hashed_password="hashed",
            tell="3000000000",
            role_id=existing.role_id,
        )
    pg_session.rollback()


def test_user_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["UserRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            fullName="Sin Rol",
            email="sin.rol@lubix.com",
            hashed_password="hashed",
            tell="3000000000",
            role_id=uuid.uuid4(),
        )
    pg_session.rollback()
