import pytest

from app.database.Connection import build_database_url

pytestmark = pytest.mark.unit


def test_normaliza_esquema_postgres_heredado_y_agrega_ssl():
    url = build_database_url("postgres://user:pass@ep-lubix.neon.tech/lubix")

    assert url.startswith("postgresql+psycopg2://")
    assert "sslmode=require" in url


def test_agrega_driver_psycopg2_y_ssl_a_postgresql():
    url = build_database_url("postgresql://user:pass@db.supabase.co:5432/postgres")

    assert url.startswith("postgresql+psycopg2://")
    assert "sslmode=require" in url


def test_respeta_el_sslmode_que_ya_viene_en_la_url():
    url = build_database_url(
        "postgresql://user:pass@db.example.com/lubix?sslmode=verify-full"
    )

    assert "sslmode=verify-full" in url
    assert url.count("sslmode=") == 1


def test_no_fuerza_ssl_para_hosts_locales():
    url = build_database_url("postgresql://user:pass@localhost:5432/lubix")

    assert "sslmode" not in url


def test_sqlite_se_mantiene_sin_cambios():
    assert build_database_url("sqlite://") == "sqlite://"


def test_url_vacia_falla_con_mensaje_claro():
    with pytest.raises(ValueError, match="URL_DATABASE"):
        build_database_url("")
