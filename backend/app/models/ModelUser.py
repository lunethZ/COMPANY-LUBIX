from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database.Connection import Base
import uuid

from datetime import datetime
class Users(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True, 
        default=uuid.uuid4
    )
    fullName: Mapped[str] = mapped_column(
        String(50), 
        nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(50), 
        nullable=False,
        unique=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    
    tell: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    
    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    avatar: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    banner: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    isActive: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow    
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False
    )
    
    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users"
    )

    company: Mapped["Company | None"] = relationship(
        "Company",
        back_populates="user"
    )

    codes: Mapped[list["Codes"]] = relationship(
        "Codes",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    refresh_token: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    addresses: Mapped[list["Address"]] = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    favorites: Mapped[list["Favorite"]] = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    pqrs: Mapped[list["PQRS"]] = relationship(
        "PQRS",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    cart: Mapped["Cart | None"] = relationship(
        "Cart",
        back_populates="user",
        cascade="all, delete-orphan"
    )

