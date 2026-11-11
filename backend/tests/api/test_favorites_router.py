import uuid

import pytest

from app.models.ModelCompany import Company
from app.models.ModelFavorite import Favorite
from app.models.ModelProduct import Product
from app.services.authentication.JWTService import create_access_token


pytestmark = pytest.mark.api


@pytest.fixture
def fav_company(api_fake_company, api_db_session):
    return (
        api_db_session.query(Company)
        .filter(Company.user_id == api_fake_company.id)
        .first()
    )


@pytest.fixture
def fav_product(fav_company, api_db_session):
    product = Product(
        name="Producto favorito",
        price=120.0,
        images=["/files/favorito.jpg"],
        discount_enable=True,
        discount_value=10.0,
        stock=7,
        descripcion="Producto para favoritos",
        technical_spec={},
        company_id=fav_company.id,
        catalog_id=None,
        status="active",
    )
    api_db_session.add(product)
    api_db_session.commit()
    api_db_session.refresh(product)
    return product


@pytest.fixture
def fav_favorite(api_fake_user, fav_product, api_db_session):
    favorite = Favorite(user_id=api_fake_user.id, product_id=fav_product.id)
    api_db_session.add(favorite)
    api_db_session.commit()
    api_db_session.refresh(favorite)
    return favorite


def _headers_usuario_inexistente():
    token = create_access_token(user_id=str(uuid.uuid4()), role="user")
    return {"Authorization": f"Bearer {token}"}


class TestFavoritesRouter:
    def test_list_favorites_vacio_devuelve_lista_vacia(
        self, api_client, api_auth_headers_user, api_fake_user
    ):
        response = api_client.get(
            "/user/favorites", headers=api_auth_headers_user
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_list_favorites_devuelve_producto_y_empresa(
        self,
        api_client,
        api_auth_headers_user,
        api_fake_user,
        fav_product,
        fav_favorite,
    ):
        response = api_client.get(
            "/user/favorites", headers=api_auth_headers_user
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(fav_favorite.id)
        assert data[0]["product"] == {
            "id": str(fav_product.id),
            "name": "Producto favorito",
            "price": 120.0,
            "images": ["/files/favorito.jpg"],
            "descripcion": "Producto para favoritos",
            "stock": 7,
            "discount_enable": True,
            "discount_value": 10.0,
            "company_name": "Test Company S.A.S",
        }
        assert data[0]["created_at"] is not None

    def test_list_favorites_usuario_inexistente_devuelve_404(
        self, api_client
    ):
        response = api_client.get(
            "/user/favorites", headers=_headers_usuario_inexistente()
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_toggle_favorite_agrega_producto(
        self,
        api_client,
        api_auth_headers_user,
        api_fake_user,
        fav_product,
        api_db_session,
    ):
        response = api_client.post(
            f"/user/favorites/{fav_product.id}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "Favorito agregado",
            "is_favorite": True,
        }
        favorito = (
            api_db_session.query(Favorite)
            .filter(Favorite.user_id == api_fake_user.id)
            .first()
        )
        assert favorito is not None
        assert favorito.product_id == fav_product.id

    def test_toggle_favorite_elimina_producto_existente(
        self,
        api_client,
        api_auth_headers_user,
        api_fake_user,
        fav_product,
        fav_favorite,
        api_db_session,
    ):
        response = api_client.post(
            f"/user/favorites/{fav_product.id}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 200
        assert response.json() == {
            "message": "Favorito eliminado",
            "is_favorite": False,
        }
        assert (
            api_db_session.query(Favorite)
            .filter(Favorite.user_id == api_fake_user.id)
            .count()
            == 0
        )

    def test_toggle_favorite_usuario_inexistente_devuelve_404(
        self, api_client, fav_product
    ):
        response = api_client.post(
            f"/user/favorites/{fav_product.id}",
            headers=_headers_usuario_inexistente(),
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Usuario no encontrado"

    def test_toggle_favorite_producto_inexistente_devuelve_404(
        self, api_client, api_auth_headers_user, api_fake_user
    ):
        response = api_client.post(
            f"/user/favorites/{uuid.uuid4()}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Producto no encontrado"

    def test_hallazgo_h6_error_interno_devuelve_401(
        self,
        api_client,
        api_auth_headers_user,
        api_fake_user,
        fav_product,
        api_db_session,
        monkeypatch,
    ):
        def _fallar(*args, **kwargs):
            raise RuntimeError("fallo forzado")

        monkeypatch.setattr(api_db_session, "commit", _fallar)

        response = api_client.post(
            f"/user/favorites/{fav_product.id}",
            headers=api_auth_headers_user,
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Token invalido"
