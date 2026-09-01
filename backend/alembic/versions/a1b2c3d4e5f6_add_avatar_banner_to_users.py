"""add avatar and banner to users

Revision ID: a1b2c3d4e5f6
Revises: f5e6d7c8b9a0
Create Date: 2026-09-01 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f5e6d7c8b9a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('avatar', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('banner', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'banner')
    op.drop_column('users', 'avatar')
