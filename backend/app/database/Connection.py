# este codigo tiene como funcion realizar una conexion
# con la base de datos posgrest asi mismo se busca
# crear sesiones con sessionmarker y sessionlocal
# dando acceso a la base de datos con get_db sin poder
# agregar comentarios de manera automatica
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.Config import config

# Hosts que se consideran locales o de la red interna de Docker. Para ellos no
# se fuerza SSL porque el contenedor de PostgreSQL no lo configura por defecto.
_LOCAL_DB_HOSTS = {
    "localhost",
    "127.0.0.1",
    "::1",
    "postgres",
    "db",
    "database",
    "host.docker.internal",
}


def build_database_url(raw_url: str | None = None) -> str:
    """Normaliza la URL de PostgreSQL y agrega SSL para proveedores en la nube.

    - Acepta ``postgres://`` (formato heredado de algunos proveedores) y
      ``postgresql://`` agregando el driver ``psycopg2``.
    - Agrega ``sslmode`` (por defecto ``require``) cuando la URL apunta a un
      host remoto y no trae el parámetro. Neon y Supabase lo exigen.
    - Respeta el ``sslmode`` que ya venga en la cadena, por ejemplo
      ``sslmode=verify-full``.
    """
    raw = (raw_url if raw_url is not None else config.URL_DATABASE) or ""
    raw = raw.strip()

    if not raw:
        raise ValueError(
            "Define URL_DATABASE (o DATABASE_URL) con la cadena de conexión a PostgreSQL."
        )

    if raw.startswith("postgres://"):
        raw = "postgresql+psycopg2://" + raw[len("postgres://"):]
    elif raw.startswith("postgresql://"):
        raw = "postgresql+psycopg2://" + raw[len("postgresql://"):]

    url = make_url(raw)

    if url.get_backend_name() == "postgresql":
        host = (url.host or "").lower()
        query = dict(url.query)

        if config.DB_SSL_MODE and not query.get("sslmode") and host not in _LOCAL_DB_HOSTS:
            query["sslmode"] = config.DB_SSL_MODE

        if query != dict(url.query):
            url = url.update_query_dict(query)

    # hide_password=False conserva la contraseña para que el motor y Alembic
    # puedan conectarse. La URL nunca se imprime en logs de la aplicación.
    return url.render_as_string(hide_password=False)


DATABASE_URL = build_database_url()

_engine_options = {
    "pool_pre_ping": True,
    "echo": False,  # True para activar logs - False para desactivar Logs
}

# SQLite (usado por las pruebas) no acepta los parámetros de pool de PostgreSQL.
if make_url(DATABASE_URL).get_backend_name() != "sqlite":
    _engine_options.update(
        pool_size=config.DB_POOL_SIZE,
        max_overflow=config.DB_MAX_OVERFLOW,
        pool_recycle=config.DB_POOL_RECYCLE,
    )

engine = create_engine(DATABASE_URL, **_engine_options)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()

class Base(DeclarativeBase):
    pass
