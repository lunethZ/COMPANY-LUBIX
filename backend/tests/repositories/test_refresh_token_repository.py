import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError


def test_refresh_token_repository_crud_and_queries(factories, repositories):
    repository = repositories["RefreshTokenRepository"]
    user = factories.user()
    now = datetime.utcnow()

    token = repository.create(
        token="token-s6-activo",
        revoked=False,
        created_at=now,
        expires_at=now + timedelta(days=7),
        user_id=user.id,
    )
    revoked = factories.refresh_token(user=user, revoked=True)

    assert repository.get_by_id(token.id) is token
    assert repository.get_by_token("token-s6-activo").id == token.id
    assert repository.list_by_user(user.id) == [token, revoked]
    assert repository.list_active() == [token]
    assert repository.count(revoked=False) == 1
    assert repository.get_by_id(token.id).user.id == user.id

    repository.update(token, revoked=True)
    assert repository.get_by_id(token.id).revoked is True
    assert repository.list_active() == []

    repository.delete(token)
    assert repository.get_by_id(token.id) is None
    assert repository.list_by_user(user.id) == [revoked]


def test_refresh_token_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["RefreshTokenRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            token="token-huerfano",
            revoked=False,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7),
            user_id=uuid.uuid4(),
        )
    pg_session.rollback()
