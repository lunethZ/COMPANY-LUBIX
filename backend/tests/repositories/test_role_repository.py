import pytest
from sqlalchemy.exc import IntegrityError


def test_role_repository_crud_and_queries(pg_session, factories, repositories):
    repository = repositories["RoleRepository"]
    assert repository.count() == 0

    role = repository.create(name="admin-s6")
    assert repository.get_by_id(role.id) is role
    assert repository.get_by_name("admin-s6").name == "admin-s6"
    assert repository.list() == [role]
    assert repository.get_by(name="admin-s6") is role

    updated = repository.update(role, name="admin-s6-updated")
    assert updated.name == "admin-s6-updated"
    assert repository.count(name="admin-s6-updated") == 1

    repository.delete(role)
    assert repository.get_by_id(role.id) is None
    assert repository.count() == 0


def test_role_repository_unique_name_constraint(pg_session, factories, repositories):
    repository = repositories["RoleRepository"]
    factories.role(name="duplicate-role")

    with pytest.raises(IntegrityError):
        repository.create(name="duplicate-role")
    pg_session.rollback()
