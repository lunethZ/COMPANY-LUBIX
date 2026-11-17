import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.ModelCode import typeCode


def test_code_repository_crud_and_queries(factories, repositories):
    repository = repositories["CodeRepository"]
    user = factories.user()
    now = datetime.utcnow()

    old_code = repository.create(
        code="111111",
        type=typeCode.verifyEmail,
        created_at=now - timedelta(minutes=10),
        expires_at=now + timedelta(minutes=5),
        user_id=user.id,
    )
    latest_code = repository.create(
        code="222222",
        type=typeCode.resetPassword,
        created_at=now,
        expires_at=now + timedelta(minutes=15),
        user_id=user.id,
    )

    assert repository.get_by_id(old_code.id) is old_code
    assert repository.get_by(code="222222").id == latest_code.id
    assert repository.list_by_user(user.id) == [old_code, latest_code]
    assert repository.get_latest_by_user(user.id).id == latest_code.id
    assert repository.get_latest_by_user(user.id, typeCode.verifyEmail).id == old_code.id
    assert repository.get_latest_by_user(user.id, typeCode.resetPassword).id == latest_code.id
    assert repository.count(user_id=user.id) == 2
    assert repository.get_by_id(latest_code.id).user.id == user.id

    repository.update(old_code, code="333333")
    assert repository.get_by_id(old_code.id).code == "333333"

    repository.delete(old_code)
    assert repository.get_by_id(old_code.id) is None
    assert repository.count(user_id=user.id) == 1


def test_code_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["CodeRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            code="999999",
            type=typeCode.verifyEmail,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=15),
            user_id=uuid.uuid4(),
        )
    pg_session.rollback()
