from sqlalchemy import String, Numeric, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from decimal import Decimal
import uuid
from app.database.Connection import Base

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    discount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    shipping: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    total: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        default="efectivo",
        nullable=False
    )

    recipient: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    address: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    city: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    department: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    postal_code: Mapped[str] = mapped_column(
        String(20),
        nullable=True
    )

    created_at: Mapped[object] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    user: Mapped["Users"] = relationship(
        "Users",
        back_populates="orders"
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=True
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id"),
        nullable=False
    )

    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items"
    )

    product: Mapped["Product"] = relationship(
        "Product",
        backref="order_items"
    )