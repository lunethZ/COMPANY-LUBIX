from sqlalchemy import String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from app.database.Connection import Base
from app.utils.Time import utcnow_naive
from sqlalchemy.dialects.postgresql import UUID
import uuid

class RefreshToken(Base):
    __tablename__ = "refreshToken"
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )

    token: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow_naive
    )
    
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    user: Mapped["Users"] = relationship(
        "Users",
        back_populates="refresh_token"
    )