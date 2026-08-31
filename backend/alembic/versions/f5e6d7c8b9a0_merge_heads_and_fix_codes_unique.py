"""merge heads and allow multiple codes per user

Revision ID: f5e6d7c8b9a0
Revises: b1c2d3e4f5a7, d4e5f6a7b8c9
Create Date: 2026-08-31 15:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5e6d7c8b9a0'
down_revision: Union[str, Sequence[str], None] = ('b1c2d3e4f5a7', 'd4e5f6a7b8c9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Un único usuario debe poder tener códigos de distintos tipos
    # (p. ej. verificación de correo + recuperación de contraseña),
    # por lo que se elimina la restricción de unicidad sobre user_id.
    op.drop_constraint('event_codes_user_id_key', 'event_codes', type_='unique')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_unique_constraint('event_codes_user_id_key', 'event_codes', ['user_id'])
