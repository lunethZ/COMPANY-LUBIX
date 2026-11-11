import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from io import BytesIO
from app.models.ModelUser import Users
from app.utils.Security import hash_password


class TestUserRouter:
    """Tests for /user endpoints (require authentication)."""

    def test_dashboard_me_success(self, api_client, api_auth_headers_user, api_fake_user, _mock_external_services):
        """GET /user/dashboard/me -> 200 with user dashboard data."""
        response = api_client.get("/user/dashboard/me", headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert data["fullName"] == api_fake_user.fullName
        assert data["email"] == api_fake_user.email
        assert data["tell"] == api_fake_user.tell
        assert data["role"] == "user"
        assert "totalOrders" in data
        assert "totalSpent" in data
        assert "savedProducts" in data
        assert "addresses" in data
        assert "avatar" in data
        assert "banner" in data

    def test_dashboard_me_no_auth(self, api_client, _mock_external_services):
        """GET /user/dashboard/me -> 401 without auth."""
        response = api_client.get("/user/dashboard/me")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_dashboard_me_company_forbidden(self, api_client, api_auth_headers_company, _mock_external_services):
        """GET /user/dashboard/me -> 401/403 for company user."""
        response = api_client.get("/user/dashboard/me", headers=api_auth_headers_company)
        assert response.status_code in (401, 403)

    def test_update_profile_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/profile -> 200 with updated profile."""
        payload = {"fullName": "New Name", "tell": "0987654321"}
        response = api_client.patch("/user/profile", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Perfil actualizado correctamente"
        assert data["fullName"] == "New Name"
        assert data["tell"] == "0987654321"

    def test_update_profile_partial(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/profile -> 200 with partial update."""
        payload = {"fullName": "Only Name"}
        response = api_client.patch("/user/profile", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert data["fullName"] == "Only Name"

    def test_update_profile_validation_error(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/profile -> 422 with validation errors."""
        payload = {"fullName": "Jo", "tell": "123"}
        response = api_client.patch("/user/profile", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 422

    def test_update_profile_no_auth(self, api_client, _mock_external_services):
        """PATCH /user/profile -> 401 without auth."""
        response = api_client.patch("/user/profile", json={"fullName": "Test"})
        assert response.status_code == 401

    def test_change_password_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/change-password -> 200 with success message."""
        payload = {"current_password": "TestPass123", "new_password": "NewPass123"}
        response = api_client.patch("/user/change-password", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "actualizada correctamente" in data["message"].lower()

    def test_change_password_wrong_current(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/change-password -> 400 with wrong current password."""
        payload = {"current_password": "WrongPass123", "new_password": "NewPass123"}
        response = api_client.patch("/user/change-password", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 400
        data = response.json()
        assert "incorrecta" in data["detail"].lower()

    def test_change_password_validation_error(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/change-password -> 422 with validation errors."""
        payload = {"current_password": "TestPass123", "new_password": "weak"}
        response = api_client.patch("/user/change-password", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 422

    def test_change_password_no_auth(self, api_client, _mock_external_services):
        """PATCH /user/change-password -> 401 without auth."""
        response = api_client.patch("/user/change-password", json={"current_password": "a", "new_password": "b"})
        assert response.status_code == 401

    def test_delete_account_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """DELETE /user/account -> 200 with success message."""
        response = api_client.delete("/user/account", headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "eliminada correctamente" in data["message"].lower()

    def test_delete_account_no_auth(self, api_client, _mock_external_services):
        """DELETE /user/account -> 401 without auth."""
        response = api_client.delete("/user/account")
        assert response.status_code == 401

    def test_export_user_data_success(self, api_client, api_auth_headers_user, api_fake_user, _mock_external_services):
        """GET /user/export -> 200 with user data."""
        response = api_client.get("/user/export", headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert data["fullName"] == api_fake_user.fullName
        assert data["email"] == api_fake_user.email
        assert data["role"] == "user"
        assert "addresses" in data
        assert isinstance(data["addresses"], list)

    def test_export_user_data_no_auth(self, api_client, _mock_external_services):
        """GET /user/export -> 401 without auth."""
        response = api_client.get("/user/export")
        assert response.status_code == 401

    def test_list_addresses_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """GET /user/addresses -> 200 with empty list (no addresses yet)."""
        response = api_client.get("/user/addresses", headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_addresses_no_auth(self, api_client, _mock_external_services):
        """GET /user/addresses -> 401 without auth."""
        response = api_client.get("/user/addresses")
        assert response.status_code == 401

    def test_create_address_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """POST /user/addresses -> 200 with new address."""
        payload = {
            "label": "Casa",
            "address": "Calle 123",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111",
            "is_default": True
        }
        response = api_client.post("/user/addresses", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "agregada correctamente" in data["message"].lower()
        assert "id" in data

    def test_create_address_validation_error(self, api_client, api_auth_headers_user, _mock_external_services):
        """POST /user/addresses -> 422 with validation errors (missing required fields)."""
        payload = {"label": "Casa"}  # missing required fields: address, city, department
        response = api_client.post("/user/addresses", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        errors = data["detail"]
        assert isinstance(errors, list)
        assert len(errors) > 0

    def test_create_address_no_auth(self, api_client, _mock_external_services):
        """POST /user/addresses -> 401 without auth."""
        response = api_client.post("/user/addresses", json={"address": "Calle 123"})
        assert response.status_code == 401

    def test_update_address_success(self, api_client, api_auth_headers_user, api_db_session, api_fake_user, _mock_external_services):
        """PATCH /user/addresses/{id} -> 200 with updated address."""
        from app.models.ModelAddress import Address
        address = Address(
            user_id=api_fake_user.id,
            label="Casa",
            address="Calle 123",
            city="Bogotá",
            department="Cundinamarca",
            postal_code="110111",
            is_default=True
        )
        api_db_session.add(address)
        api_db_session.commit()
        api_db_session.refresh(address)

        payload = {"label": "Oficina", "city": "Medellín"}
        response = api_client.patch(f"/user/addresses/{address.id}", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "actualizada correctamente" in data["message"].lower()

    def test_update_address_not_found(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/addresses/{id} -> 404 for non-existent address."""
        import uuid
        fake_id = str(uuid.uuid4())
        payload = {"label": "Oficina"}
        response = api_client.patch(f"/user/addresses/{fake_id}", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 404
        data = response.json()
        assert "no encontrada" in data["detail"].lower()

    def test_update_address_no_auth(self, api_client, _mock_external_services):
        """PATCH /user/addresses/{id} -> 401 without auth."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = api_client.patch(f"/user/addresses/{fake_id}", json={"label": "Oficina"})
        assert response.status_code == 401

    def test_delete_address_success(self, api_client, api_auth_headers_user, api_db_session, api_fake_user, _mock_external_services):
        """DELETE /user/addresses/{id} -> 200 with success message."""
        from app.models.ModelAddress import Address
        address = Address(
            user_id=api_fake_user.id,
            label="Casa",
            address="Calle 123",
            city="Bogotá",
            department="Cundinamarca",
            postal_code="110111",
            is_default=True
        )
        api_db_session.add(address)
        api_db_session.commit()
        api_db_session.refresh(address)

        response = api_client.delete(f"/user/addresses/{address.id}", headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "eliminada correctamente" in data["message"].lower()

    def test_delete_address_not_found(self, api_client, api_auth_headers_user, _mock_external_services):
        """DELETE /user/addresses/{id} -> 404 for non-existent address."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = api_client.delete(f"/user/addresses/{fake_id}", headers=api_auth_headers_user)
        assert response.status_code == 404
        data = response.json()
        assert "no encontrada" in data["detail"].lower()

    def test_delete_address_no_auth(self, api_client, _mock_external_services):
        """DELETE /user/addresses/{id} -> 401 without auth."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = api_client.delete(f"/user/addresses/{fake_id}")
        assert response.status_code == 401

    def test_upload_avatar_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """POST /user/avatar/upload -> 200 with avatar URL."""
        files = {"file": ("avatar.jpg", BytesIO(b"fake image"), "image/jpeg")}
        response = api_client.post("/user/avatar/upload", files=files, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "avatar" in data
        assert "url" in data

    def test_upload_avatar_no_file(self, api_client, api_auth_headers_user, _mock_external_services):
        """POST /user/avatar/upload -> 422 without file."""
        response = api_client.post("/user/avatar/upload", headers=api_auth_headers_user)
        assert response.status_code == 422

    def test_upload_avatar_no_auth(self, api_client, _mock_external_services):
        """POST /user/avatar/upload -> 401 without auth."""
        files = {"file": ("avatar.jpg", BytesIO(b"fake image"), "image/jpeg")}
        response = api_client.post("/user/avatar/upload", files=files)
        assert response.status_code == 401

    def test_upload_banner_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """POST /user/banner/upload -> 200 with banner URL."""
        files = {"file": ("banner.jpg", BytesIO(b"fake image"), "image/jpeg")}
        response = api_client.post("/user/banner/upload", files=files, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "banner" in data
        assert "url" in data

    def test_create_order_success(self, api_client, api_auth_headers_user, api_db_session, _mock_external_services):
        """POST /user/orders -> 200 with new order."""
        from app.models.ModelProduct import Product
        from app.models.ModelCompany import Company
        from app.models.ModelRole import Role

        # Create company user and company
        company_role = api_db_session.query(Role).filter(Role.name == "company").first()
        company_user = Users(
            fullName="Company User",
            email="company_order@example.com",
            hashed_password=hash_password("TestPass123"),
            tell="1234567890",
            role_id=company_role.id,
            verified=True,
            isActive=True,
        )
        api_db_session.add(company_user)
        api_db_session.flush()

        company = Company(
            user_id=company_user.id,
            nameCompany="Test Company",
            addressCompany="Calle 123",
            CompanyNIT="900111111",
            CompanyNITDV="7",
            CompanyCertificate="cert.pdf",
        )
        api_db_session.add(company)
        api_db_session.commit()
        api_db_session.refresh(company)

        product = Product(
            name="Test Product",
            price=100.0,
            stock=10,
            descripcion="Test description",
            company_id=company.id,
            catalog_id=None,
            status="active",
            discount_enable=False,
            discount_value=0,
            images=[],
            technical_spec={}
        )
        api_db_session.add(product)
        api_db_session.commit()
        api_db_session.refresh(product)

        payload = {
            "items": [{"product_id": str(product.id), "name": "Test Product", "price": 100.0, "quantity": 1}],
            "subtotal": 100.0,
            "discount": 0.0,
            "shipping": 10.0,
            "total": 110.0,
            "payment_method": "efectivo",
            "recipient": "John Doe",
            "address": "Calle 123",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111"
        }
        response = api_client.post("/user/orders", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "pedido creado correctamente" in data["message"].lower()
        assert "id" in data
        assert data["status"] == "pending"

    def test_create_order_empty_items(self, api_client, api_auth_headers_user, _mock_external_services):
        """POST /user/orders -> 400 with empty items."""
        payload = {
            "items": [],
            "subtotal": 0,
            "discount": 0,
            "shipping": 0,
            "total": 0,
            "payment_method": "efectivo",
            "recipient": "John Doe",
            "address": "Calle 123",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111"
        }
        response = api_client.post("/user/orders", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 400
        data = response.json()
        assert "al menos un producto" in data["detail"].lower()

    def test_create_order_insufficient_stock(self, api_client, api_auth_headers_user, api_db_session, _mock_external_services):
        """POST /user/orders -> 400 with insufficient stock."""
        from app.models.ModelProduct import Product
        from app.models.ModelCompany import Company
        from app.models.ModelRole import Role
        from app.models.ModelUser import Users

        # Create company user and company
        company_role = api_db_session.query(Role).filter(Role.name == "company").first()
        company_user = Users(
            fullName="Company User",
            email="company_stock@example.com",
            hashed_password=hash_password("TestPass123"),
            tell="1234567890",
            role_id=company_role.id,
            verified=True,
            isActive=True,
        )
        api_db_session.add(company_user)
        api_db_session.flush()

        company = Company(
            user_id=company_user.id,
            nameCompany="Test Company",
            addressCompany="Calle 123",
            CompanyNIT="900222222",
            CompanyNITDV="7",
            CompanyCertificate="cert.pdf",
        )
        api_db_session.add(company)
        api_db_session.commit()
        api_db_session.refresh(company)

        product = Product(
            name="Low Stock Product",
            price=50.0,
            stock=1,
            descripcion="Test",
            company_id=company.id,
            catalog_id=None,
            status="active",
            discount_enable=False,
            discount_value=0,
            images=[],
            technical_spec={}
        )
        api_db_session.add(product)
        api_db_session.commit()
        api_db_session.refresh(product)

        payload = {
            "items": [{"product_id": str(product.id), "name": "Low Stock Product", "price": 50.0, "quantity": 5}],
            "subtotal": 250.0,
            "discount": 0.0,
            "shipping": 10.0,
            "total": 260.0,
            "payment_method": "efectivo",
            "recipient": "John Doe",
            "address": "Calle 123",
            "city": "Bogotá",
            "department": "Cundinamarca",
            "postal_code": "110111"
        }
        response = api_client.post("/user/orders", json=payload, headers=api_auth_headers_user)
        assert response.status_code == 400
        data = response.json()
        assert "stock insuficiente" in data["detail"].lower()

    def test_create_order_no_auth(self, api_client, _mock_external_services):
        """POST /user/orders -> 401 without auth."""
        response = api_client.post("/user/orders", json={"items": []})
        assert response.status_code == 401

    def test_list_orders_success(self, api_client, api_auth_headers_user, _mock_external_services):
        """GET /user/orders -> 200 with orders list (empty initially)."""
        response = api_client.get("/user/orders", headers=api_auth_headers_user)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_orders_no_auth(self, api_client, _mock_external_services):
        """GET /user/orders -> 401 without auth."""
        response = api_client.get("/user/orders")
        assert response.status_code == 401

    def test_get_order_not_found(self, api_client, api_auth_headers_user, _mock_external_services):
        """GET /user/orders/{id} -> 404 for non-existent order."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"/user/orders/{fake_id}", headers=api_auth_headers_user)
        assert response.status_code == 404
        data = response.json()
        assert "no encontrado" in data["detail"].lower()

    def test_cancel_order_not_found(self, api_client, api_auth_headers_user, _mock_external_services):
        """PATCH /user/orders/{id}/cancel -> 404 for non-existent order."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = api_client.patch(f"/user/orders/{fake_id}/cancel", headers=api_auth_headers_user)
        assert response.status_code == 404
        data = response.json()
        assert "no encontrado" in data["detail"].lower()

    def test_order_invoice_not_found(self, api_client, api_auth_headers_user, _mock_external_services):
        """GET /user/orders/{id}/invoice -> 404 for non-existent order."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"/user/orders/{fake_id}/invoice", headers=api_auth_headers_user)
        assert response.status_code == 404
        data = response.json()
        assert "no encontrado" in data["detail"].lower()