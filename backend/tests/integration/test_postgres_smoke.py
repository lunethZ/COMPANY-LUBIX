"""Comprueba que la BD de pruebas está arriba, migrada y aislada por test."""
import pytest
from sqlalchemy import text

pytestmark = pytest.mark.integration


def test_la_conexion_es_postgresql(db_session):
    version = db_session.execute(text("SELECT version()")).scalar_one()
    assert version.startswith("PostgreSQL")


def test_la_sesion_no_es_sqlite(db_session):
    assert db_session.bind.dialect.name == "postgresql"


@pytest.mark.parametrize(
    "table",
    ["roles", "users", "company", "products", "pqrs", "alembic_version"],
)
def test_las_migraciones_crearon_las_tablas(db_session, table):
    found = db_session.execute(
        text("SELECT to_regclass(:name)"), {"name": f"public.{table}"}
    ).scalar_one()
    assert found == table, f"Falta la tabla {table}: revisa `alembic upgrade head`."


def test_un_commit_del_codigo_no_escapa_de_la_transaccion(db_session, pg_engine):
    # Si quitas join_transaction_mode="create_savepoint", este test falla:
    # es tu mutante para documentar en el PR.
    db_session.execute(
        text(
            "INSERT INTO roles (id, name) VALUES "
            "('00000000-0000-0000-0000-000000000001', 'probe_commit')"
        )
    )
    db_session.commit()

    with pg_engine.connect() as otra_conexion:
        existentes = otra_conexion.execute(
            text("SELECT count(*) FROM roles WHERE name = 'probe_commit'")
        ).scalar_one()

    assert existentes == 0