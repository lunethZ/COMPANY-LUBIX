from sqlalchemy.orm import joinedload

from app.models import (
    Address,
    Cart,
    CartItem,
    Catalog,
    Codes,
    Company,
    Favorite,
    Order,
    OrderItem,
    PQRS,
    Product,
    RefreshToken,
    Review,
    Role,
    Users,
)
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    model = Role

    def get_by_name(self, name: str) -> Role | None:
        return self.get_by(name=name)


class UserRepository(BaseRepository[Users]):
    model = Users

    def get_by_email(self, email: str) -> Users | None:
        return self.get_by(email=email)

    def list_by_role(self, role_name: str) -> list[Users]:
        return (
            self.database.query(Users)
            .join(Role)
            .filter(Role.name == role_name)
            .all()
        )

    def list_active(self) -> list[Users]:
        return self.list(isActive=True)


class CompanyRepository(BaseRepository[Company]):
    model = Company

    def get_by_user(self, user_id) -> Company | None:
        return self.get_by(user_id=user_id)

    def get_by_nit(self, nit: str) -> Company | None:
        return self.get_by(CompanyNIT=nit)

    def list_by_name(self, name: str) -> list[Company]:
        return (
            self.database.query(Company)
            .filter(Company.nameCompany.ilike(f"%{name}%"))
            .all()
        )


class CatalogRepository(BaseRepository[Catalog]):
    model = Catalog

    def get_by_name(self, name: str) -> Catalog | None:
        return self.get_by(name=name)


class ProductRepository(BaseRepository[Product]):
    model = Product

    def get_by_name(self, name: str) -> Product | None:
        return self.get_by(name=name)

    def list_by_company(self, company_id) -> list[Product]:
        return self.list(company_id=company_id)

    def list_by_catalog(self, catalog_id) -> list[Product]:
        return self.list(catalog_id=catalog_id)

    def list_active(self) -> list[Product]:
        return self.list(status="active")

    def list_low_stock(self, threshold: int) -> list[Product]:
        return (
            self.database.query(Product)
            .filter(Product.stock <= threshold)
            .all()
        )


class AddressRepository(BaseRepository[Address]):
    model = Address

    def list_by_user(self, user_id) -> list[Address]:
        return self.list(user_id=user_id)

    def list_default_by_user(self, user_id) -> list[Address]:
        return self.list(user_id=user_id, is_default=True)


class CartRepository(BaseRepository[Cart]):
    model = Cart

    def get_by_user(self, user_id) -> Cart | None:
        return self.get_by(user_id=user_id)

    def get_with_items(self, user_id) -> Cart | None:
        return (
            self.database.query(Cart)
            .options(joinedload(Cart.items))
            .filter(Cart.user_id == user_id)
            .first()
        )


class CartItemRepository(BaseRepository[CartItem]):
    model = CartItem

    def list_by_cart(self, cart_id) -> list[CartItem]:
        return self.list(cart_id=cart_id)

    def get_by_cart_and_product(self, cart_id, product_id) -> CartItem | None:
        return self.get_by(cart_id=cart_id, product_id=product_id)


class OrderRepository(BaseRepository[Order]):
    model = Order

    def list_by_user(self, user_id) -> list[Order]:
        return self.list(user_id=user_id)

    def list_by_status(self, status: str) -> list[Order]:
        return self.list(status=status)

    def get_with_items(self, order_id) -> Order | None:
        return (
            self.database.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.id == order_id)
            .first()
        )


class OrderItemRepository(BaseRepository[OrderItem]):
    model = OrderItem

    def list_by_order(self, order_id) -> list[OrderItem]:
        return self.list(order_id=order_id)


class FavoriteRepository(BaseRepository[Favorite]):
    model = Favorite

    def list_by_user(self, user_id) -> list[Favorite]:
        return self.list(user_id=user_id)

    def get_by_user_and_product(self, user_id, product_id) -> Favorite | None:
        return self.get_by(user_id=user_id, product_id=product_id)


class ReviewRepository(BaseRepository[Review]):
    model = Review

    def list_by_product(self, product_id) -> list[Review]:
        return self.list(product_id=product_id)

    def list_by_user(self, user_id) -> list[Review]:
        return self.list(user_id=user_id)

    def get_by_user_and_product(self, user_id, product_id) -> Review | None:
        return self.get_by(user_id=user_id, product_id=product_id)


class PQRSRepository(BaseRepository[PQRS]):
    model = PQRS

    def list_by_user(self, user_id) -> list[PQRS]:
        return self.list(user_id=user_id)

    def list_by_status(self, status: str) -> list[PQRS]:
        return self.list(status=status)

    def list_by_user_role(self, user_role: str) -> list[PQRS]:
        return self.list(user_role=user_role)


class CodeRepository(BaseRepository[Codes]):
    model = Codes

    def list_by_user(self, user_id) -> list[Codes]:
        return self.list(user_id=user_id)

    def get_latest_by_user(self, user_id, code_type=None) -> Codes | None:
        query = self.database.query(Codes).filter(Codes.user_id == user_id)
        if code_type is not None:
            query = query.filter(Codes.type == code_type)
        return query.order_by(Codes.created_at.desc()).first()


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    model = RefreshToken

    def get_by_token(self, token: str) -> RefreshToken | None:
        return self.get_by(token=token)

    def list_by_user(self, user_id) -> list[RefreshToken]:
        return self.list(user_id=user_id)

    def list_active(self) -> list[RefreshToken]:
        return self.list(revoked=False)
