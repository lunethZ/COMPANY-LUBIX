import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

DATABASE_URL = os.getenv(
    "REPOSITORY_TEST_DATABASE_URL",
    "postgresql+psycopg2://lubix_test:lubix_test@localhost:5433/lubix_test",
)
os.environ.setdefault("URL_DATABASE", DATABASE_URL)
os.environ.setdefault("SECRET_KEY", "clave-solo-para-tests-de-repositorio")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("URL_FRONTEND", "http://localhost:5173")
os.environ.setdefault("MINIO_ROOT_USER", "test")
os.environ.setdefault("MINIO_ROOT_PASSWORD", "test")
os.environ.setdefault("GMAIL_USERNAME", "test@example.com")
os.environ.setdefault("GMAIL_APP_PASSWORD", "test")
os.environ.setdefault("RESEND_API_KEY", "")
os.environ.setdefault("ADMIN_DEFAULT", "admin@example.com")
os.environ.setdefault("PASSWORD_DEFAULT", "Admin123!")
os.environ.setdefault("RUN_SEED", "false")

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

import app.models
from app.database.Connection import Base
from app.models.ModelCode import typeCode
from app.repositories import (
    AddressRepository,
    CartItemRepository,
    CartRepository,
    CatalogRepository,
    CodeRepository,
    CompanyRepository,
    FavoriteRepository,
    OrderItemRepository,
    OrderRepository,
    PQRSRepository,
    ProductRepository,
    RefreshTokenRepository,
    ReviewRepository,
    RoleRepository,
    UserRepository,
)


@pytest.fixture(scope="session")
def pg_engine():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def pg_session(pg_engine):
    connection = pg_engine.connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection, autoflush=False, expire_on_commit=False)
    nested_transaction = session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(current_session, transaction):
        nonlocal nested_transaction
        if transaction.nested and not transaction._parent.nested and current_session.is_active:
            current_session.expire_all()
            nested_transaction = current_session.begin_nested()

    try:
        yield session
    finally:
        session.close()
        if outer_transaction.is_active:
            outer_transaction.rollback()
        connection.close()


class RepositoryFactories:
    def __init__(self, session):
        self.session = session

    @staticmethod
    def _suffix():
        return uuid.uuid4().hex[:8]

    def _flush(self, instance):
        self.session.add(instance)
        self.session.flush()
        return instance

    def role(self, name=None):
        from app.models import Role

        return self._flush(Role(name=name or f"rol-{self._suffix()}"))

    def user(self, role=None, **overrides):
        from app.models import Users

        values = {
            "fullName": "Usuario Repository",
            "email": f"user-{self._suffix()}@lubix.com",
            "hashed_password": "hashed-password",
            "tell": "3001234567",
            "verified": True,
            "isActive": True,
            "role_id": (role or self.role()).id,
        }
        values.update(overrides)
        return self._flush(Users(**values))

    def company(self, user=None, **overrides):
        from app.models import Company

        values = {
            "nameCompany": f"Empresa {self._suffix()}",
            "addressCompany": "Calle 1 # 2-3",
            "CompanyNIT": f"9{self._suffix()}",
            "CompanyNITDV": "1",
            "CompanyCertificate": "uploads/cert.txt",
            "user_id": (user or self.user()).id,
        }
        values.update(overrides)
        return self._flush(Company(**values))

    def catalog(self, name=None):
        from app.models import Catalog

        return self._flush(Catalog(name=name or f"catalogo-{self._suffix()}"))

    def product(self, company=None, catalog=None, **overrides):
        from app.models import Product

        values = {
            "name": f"Producto {self._suffix()}",
            "price": Decimal("1500.00"),
            "discount_value": Decimal("0.00"),
            "stock": 10,
            "status": "active",
            "descripcion": "Descripción de prueba",
            "images": ["/files/imagen.png"],
            "technical_spec": {"brand": "Marca"},
            "company_id": (company or self.company()).id,
            "catalog_id": catalog.id if catalog else None,
        }
        values.update(overrides)
        return self._flush(Product(**values))

    def address(self, user=None, **overrides):
        from app.models import Address

        values = {
            "label": "Casa",
            "address": "Calle 2 # 3-4",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111",
            "is_default": False,
            "user_id": (user or self.user()).id,
        }
        values.update(overrides)
        return self._flush(Address(**values))

    def cart(self, user=None):
        from app.models import Cart

        return self._flush(Cart(user_id=(user or self.user()).id))

    def cart_item(self, cart=None, product=None, **overrides):
        from app.models import CartItem

        values = {
            "quantity": 2,
            "cart_id": (cart or self.cart()).id,
            "product_id": (product or self.product()).id,
        }
        values.update(overrides)
        return self._flush(CartItem(**values))

    def order(self, user=None, **overrides):
        from app.models import Order

        values = {
            "status": "pending",
            "subtotal": Decimal("100.00"),
            "discount": Decimal("0.00"),
            "shipping": Decimal("10.00"),
            "total": Decimal("110.00"),
            "payment_method": "efectivo",
            "recipient": "Destinatario",
            "address": "Calle 3 # 4-5",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111",
            "user_id": (user or self.user()).id,
        }
        values.update(overrides)
        return self._flush(Order(**values))

    def order_item(self, order=None, product=None, **overrides):
        from app.models import OrderItem

        values = {
            "name": "Producto comprado",
            "price": Decimal("1500.00"),
            "quantity": 1,
            "order_id": (order or self.order()).id,
            "product_id": product.id if product else None,
        }
        values.update(overrides)
        return self._flush(OrderItem(**values))

    def favorite(self, user=None, product=None, **overrides):
        from app.models import Favorite

        values = {
            "user_id": (user or self.user()).id,
            "product_id": (product or self.product()).id,
        }
        values.update(overrides)
        return self._flush(Favorite(**values))

    def review(self, user=None, product=None, **overrides):
        from app.models import Review

        values = {
            "rating": 5,
            "title": "Excelente",
            "comment": "Muy buen producto",
            "user_id": (user or self.user()).id,
            "product_id": (product or self.product()).id,
        }
        values.update(overrides)
        return self._flush(Review(**values))

    def pqrs(self, user=None, **overrides):
        from app.models import PQRS

        values = {
            "type": "queja",
            "subject": "Asunto de prueba",
            "description": "Descripción detallada",
            "status": "pending",
            "user_id": (user or self.user()).id,
            "user_role": "user",
        }
        values.update(overrides)
        return self._flush(PQRS(**values))

    def code(self, user=None, **overrides):
        from app.models import Codes

        values = {
            "code": "123456",
            "type": typeCode.verifyEmail,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=15),
            "user_id": (user or self.user()).id,
        }
        values.update(overrides)
        return self._flush(Codes(**values))

    def refresh_token(self, user=None, **overrides):
        from app.models import RefreshToken

        values = {
            "token": f"token-{self._suffix()}",
            "revoked": False,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7),
            "user_id": (user or self.user()).id,
        }
        values.update(overrides)
        return self._flush(RefreshToken(**values))


@pytest.fixture()
def factories(pg_session):
    return RepositoryFactories(pg_session)


@pytest.fixture()
def repositories(pg_session):
    repository_classes = (
        AddressRepository,
        CartItemRepository,
        CartRepository,
        CatalogRepository,
        CodeRepository,
        CompanyRepository,
        FavoriteRepository,
        OrderItemRepository,
        OrderRepository,
        PQRSRepository,
        ProductRepository,
        RefreshTokenRepository,
        ReviewRepository,
        RoleRepository,
        UserRepository,
    )
    return {
        repository_class.__name__: repository_class(pg_session)
        for repository_class in repository_classes
    }
