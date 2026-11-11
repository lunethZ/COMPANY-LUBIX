"""Tests de favoritos (/user/favorites)."""

from app.models.ModelFavorite import Favorite


def _add_favorite(client, seed, user, product):
    response = client.post(
        f"/user/favorites/{product.id}", headers=seed.headers(user)
    )
    assert response.status_code == 200
    return response


def test_toggle_favorite_agrega_y_quita(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company)
    headers = seed.headers(user)

    added = _add_favorite(client, seed, user, product)
    assert added.json() == {"message": "Favorito agregado", "is_favorite": True}

    removed = client.post(f"/user/favorites/{product.id}", headers=headers)
    assert removed.json() == {"message": "Favorito eliminado", "is_favorite": False}

    with seed.session() as session:
        assert session.query(Favorite).count() == 0


def test_list_favorites_devuelve_200_y_su_forma(client, seed):
    user = seed.user()
    company = seed.company()
    product = seed.product(company)
    _add_favorite(client, seed, user, product)

    response = client.get("/user/favorites", headers=seed.headers(user))

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list) and len(body) == 1
    assert set(body[0]) == {"id", "product", "created_at"}
    assert set(body[0]["product"]) == {
        "id",
        "name",
        "price",
        "images",
        "descripcion",
        "stock",
        "discount_enable",
        "discount_value",
        "company_name",
    }
    assert body[0]["product"]["name"] == product.name


def test_list_favorites_vacio_devuelve_lista_vacia(client, seed):
    user = seed.user()

    response = client.get("/user/favorites", headers=seed.headers(user))

    assert response.status_code == 200
    assert response.json() == []


def test_list_favorites_sin_token_devuelve_401(client, seed):
    seed.roles("user")

    response = client.get("/user/favorites")

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_list_favorites_rol_company_devuelve_401(client, seed):
    company = seed.company()

    response = client.get("/user/favorites", headers=seed.headers(company))

    assert response.status_code == 401
    assert response.json() == {"detail": "no tienes permiso para acceder a este recurso"}


def test_toggle_favorite_producto_inexistente_devuelve_404(client, seed):
    user = seed.user()

    response = client.post(
        "/user/favorites/00000000-0000-0000-0000-000000000000",
        headers=seed.headers(user),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Producto no encontrado"}


def test_list_favorites_usuario_borrado_devuelve_404(client, seed):
    user = seed.user()
    headers = seed.headers(user)
    with seed.session() as session:
        from app.models.ModelUser import Users

        session.delete(session.get(Users, user.id))

    response = client.get("/user/favorites", headers=headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Usuario no encontrado"}


def test_toggle_favorito_de_otro_usuario_no_se_ve(client, seed):
    """El listado es propio: un favorito de otro usuario no aparece."""
    owner = seed.user(email="dueno@lubix.com")
    company = seed.company()
    product = seed.product(company)
    _add_favorite(client, seed, owner, product)

    observador = seed.user(email="observador@lubix.com")

    response = client.get("/user/favorites", headers=seed.headers(observador))

    assert response.status_code == 200
    assert response.json() == []
