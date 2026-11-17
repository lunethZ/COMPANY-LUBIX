import uuid

import pytest
from sqlalchemy.exc import IntegrityError


def test_company_repository_crud_and_queries(factories, repositories):
    repository = repositories["CompanyRepository"]
    user = factories.user()

    company = repository.create(
        nameCompany="Lubix Store",
        addressCompany="Calle 10 # 20-30",
        CompanyNIT="900999888",
        CompanyNITDV="7",
        CompanyCertificate="uploads/cert.txt",
        user_id=user.id,
    )
    other = factories.company(nameCompany="Otra Empresa")

    assert repository.get_by_id(company.id) is company
    assert repository.get_by_user(user.id).id == company.id
    assert repository.get_by_nit("900999888").id == company.id
    assert repository.list_by_name("Lubix") == [company]
    assert repository.count() == 2
    assert company.user.id == user.id

    repository.update(company, nameCompany="Lubix Store S.A.S.")
    assert repository.get_by_id(company.id).nameCompany == "Lubix Store S.A.S."

    repository.delete(company)
    assert repository.get_by_id(company.id) is None
    assert repository.get_by_user(user.id) is None
    assert repository.list() == [other]


def test_company_repository_unique_user_constraint(pg_session, factories, repositories):
    repository = repositories["CompanyRepository"]
    user = factories.user()
    factories.company(user=user)

    with pytest.raises(IntegrityError):
        repository.create(
            nameCompany="Segunda Empresa",
            addressCompany="Calle 1 # 1-1",
            CompanyNIT="800111222",
            CompanyNITDV="3",
            user_id=user.id,
        )
    pg_session.rollback()


def test_company_repository_foreign_key_constraint(pg_session, repositories):
    repository = repositories["CompanyRepository"]

    with pytest.raises(IntegrityError):
        repository.create(
            nameCompany="Empresa Huérfana",
            addressCompany="Calle 1 # 1-1",
            CompanyNIT="800333444",
            CompanyNITDV="5",
            user_id=uuid.uuid4(),
        )
    pg_session.rollback()
