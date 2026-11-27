from unittest.mock import patch


def _assert_upload(mock, path, filename):
    mock.assert_called_once()
    file_arg, path_arg = mock.call_args.args
    assert path_arg == path
    assert file_arg.filename == filename


def test_upload_avatar_invoca_mock_de_almacenamiento(client, seed, storage_mocks):
    user = seed.user()

    response = client.post(
        "/user/avatar/upload",
        files={"file": ("avatar.png", b"contenido", "image/png")},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"success", "avatar", "url"}
    assert body["success"] is True
    assert body["avatar"] == "avatars/prueba.png"
    assert body["url"] == "/files/avatars/prueba.png"
    _assert_upload(storage_mocks.upload, "avatars/", "avatar.png")


def test_upload_avatar_con_fallo_de_almacenamiento_devuelve_500(
    client, seed, storage_mocks
):
    user = seed.user()
    storage_mocks.upload.return_value = {"success": False}

    response = client.post(
        "/user/avatar/upload",
        files={"file": ("avatar.png", b"contenido", "image/png")},
        headers=seed.headers(user),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir avatar"}
    _assert_upload(storage_mocks.upload, "avatars/", "avatar.png")


def test_upload_banner_invoca_mock_de_almacenamiento(client, seed, storage_mocks):
    user = seed.user()

    response = client.post(
        "/user/banner/upload",
        files={"file": ("banner.jpg", b"contenido", "image/jpeg")},
        headers=seed.headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"success", "banner", "url"}
    assert body["success"] is True
    assert body["banner"] == "avatars/prueba.png"
    assert body["url"] == "/files/avatars/prueba.png"
    _assert_upload(storage_mocks.upload, "banners/", "banner.jpg")


def test_upload_banner_con_fallo_de_almacenamiento_devuelve_500(
    client, seed, storage_mocks
):
    user = seed.user()
    storage_mocks.upload.return_value = {"success": False}

    response = client.post(
        "/user/banner/upload",
        files={"file": ("banner.jpg", b"contenido", "image/jpeg")},
        headers=seed.headers(user),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir banner"}
    _assert_upload(storage_mocks.upload, "banners/", "banner.jpg")


def test_upload_logo_empresa_invoca_mock_de_almacenamiento(
    client, seed, storage_mocks
):
    company = seed.company()

    response = client.patch(
        "/company/dashboard/upload-logo",
        files={"file": ("logo.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Logo actualizado correctamente",
        "logo": "avatars/prueba.png",
    }
    _assert_upload(storage_mocks.upload, "company-logos/", "logo.png")


def test_upload_logo_empresa_con_fallo_devuelve_500(client, seed, storage_mocks):
    company = seed.company()
    storage_mocks.upload.return_value = {"success": False}

    response = client.patch(
        "/company/dashboard/upload-logo",
        files={"file": ("logo.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir la imagen"}
    _assert_upload(storage_mocks.upload, "company-logos/", "logo.png")


def test_upload_banner_empresa_invoca_mock_de_almacenamiento(
    client, seed, storage_mocks
):
    company = seed.company()

    response = client.patch(
        "/company/dashboard/upload-banner",
        files={"file": ("banner.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Banner actualizado correctamente",
        "banner": "avatars/prueba.png",
    }
    _assert_upload(storage_mocks.upload, "company-banners/", "banner.png")


def test_upload_banner_empresa_con_fallo_devuelve_500(client, seed, storage_mocks):
    company = seed.company()
    storage_mocks.upload.return_value = {"success": False}

    response = client.patch(
        "/company/dashboard/upload-banner",
        files={"file": ("banner.png", b"contenido", "image/png")},
        headers=seed.headers(company),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir la imagen"}
    _assert_upload(storage_mocks.upload, "company-banners/", "banner.png")


def test_upload_imagen_producto_invoca_mock_de_almacenamiento(
    client, seed, storage_mocks
):
    company = seed.company()

    response = client.post(
        "/company/products/upload-image",
        files={"file": ("producto.jpg", b"contenido", "image/jpeg")},
        headers=seed.headers(company),
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"success", "path", "url", "object_name"}
    assert body["success"] is True
    assert body["object_name"] == "avatars/prueba.png"
    assert body["url"] == "/files/avatars/prueba.png"
    _assert_upload(storage_mocks.upload, "products/", "producto.jpg")


def test_upload_imagen_producto_con_fallo_devuelve_500(client, seed, storage_mocks):
    company = seed.company()
    storage_mocks.upload.return_value = {"success": False}

    response = client.post(
        "/company/products/upload-image",
        files={"file": ("producto.jpg", b"contenido", "image/jpeg")},
        headers=seed.headers(company),
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Error al subir la imagen"}
    _assert_upload(storage_mocks.upload, "products/", "producto.jpg")


def test_get_file_invoca_mock_de_lectura(client, storage_mocks):
    response = client.get("/files/avatars/avatar.png")

    assert response.status_code == 200
    assert response.content == b"contenido-api"
    assert response.headers["content-type"].startswith("image/png")
    assert 'filename="avatar.png"' in response.headers["content-disposition"]
    assert response.headers["cache-control"] == "public, max-age=86400"
    storage_mocks.get_object.assert_called_once_with("uploads", "avatars/avatar.png")
    storage_mocks.download_stream.assert_not_called()


def test_get_file_usa_el_bucket_configurado(client, storage_mocks):
    with patch("app.services.NasService.subir.bucket", "lubix-media"):
        response = client.get("/files/products/producto.jpg")

    assert response.status_code == 200
    storage_mocks.get_object.assert_called_once_with(
        "lubix-media", "products/producto.jpg"
    )


def test_get_file_usa_fallback_cuando_falla_lectura_directa(client, storage_mocks):
    storage_mocks.get_object.side_effect = RuntimeError("NoSuchKey")

    response = client.get("/files/products/producto.jpg")

    assert response.status_code == 200
    assert response.content == b"fallback-api"
    storage_mocks.get_object.assert_called_once_with(
        "uploads", "products/producto.jpg"
    )
    storage_mocks.download_stream.assert_called_once_with("products/producto.jpg")


def test_get_file_con_almacenamiento_caido_devuelve_503(client, storage_mocks):
    storage_mocks.get_object.side_effect = RuntimeError("NoSuchKey")
    storage_mocks.download_stream.side_effect = RuntimeError("sin red")

    response = client.get("/files/no-existe.png")

    assert response.status_code == 503
    assert response.json() == {"detail": "Almacenamiento no disponible"}
    storage_mocks.get_object.assert_called_once_with("uploads", "no-existe.png")
    storage_mocks.download_stream.assert_called_once_with("no-existe.png")
