# Este modelo representa la tabla "company" en la base de datos, 
# que almacena información sobre las empresas.
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database.Connection import Base

class Company(Base):
    __tablename__ = "company"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True, 
        default=uuid.uuid4
    )

    nameCompany: Mapped[str] = mapped_column(
        String(50), 
        nullable=False
    )

    addressCompany: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    CompanyNIT: Mapped[str] = mapped_column(
        String(50), 
        nullable=False
    )

    CompanyNITDV: Mapped[str] = mapped_column(
        String(1),
        nullable=False
    )

    CompanyLogo: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    CompanyBanner: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    CompanyCertificate: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )   

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    user: Mapped["Users"] = relationship(
        "Users",
        back_populates="company"
    )

    products: Mapped["Product"] =  relationship(
        "Product",
        back_populates="company"
    )

