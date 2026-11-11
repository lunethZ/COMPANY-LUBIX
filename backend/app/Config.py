# Este archivo se encarga de cargar las variables de entorno desde el archivo .env
from dotenv import load_dotenv
import os

load_dotenv()


def _env_int(name: str, default: int) -> int:
    """Lee un entero del entorno y usa un valor por defecto si no está definido."""
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return int(value)


def _env_bool(name: str, default: bool = False) -> bool:
    """Lee un booleano del entorno aceptando true/false, 1/0, yes/no y on/off."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class config():
    # URL_DATABASE es el nombre usado por el proyecto. DATABASE_URL se acepta
    # como alias para plataformas (Render, Heroku, etc.) que usan ese nombre.
    URL_DATABASE = os.getenv("URL_DATABASE") or os.getenv("DATABASE_URL")
    # Neon entrega la conexión directa (sin pooler) en esta variable; se usa
    # para migraciones de Alembic, que no soportan bien el pooler en modo
    # transacción.
    DATABASE_URL_UNPOOLED = os.getenv("DATABASE_URL_UNPOOLED")

    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = _env_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    REFRESH_TOKEN_DAYS = _env_int("REFRESH_TOKEN_DAYS", 7)

    ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
    PORT = _env_int("PORT", 8000)

    # Parámetros de conexión pensados para PostgreSQL gestionado (Neon/Supabase).
    DB_SSL_MODE = os.getenv("DB_SSL_MODE", "require").strip()
    DB_POOL_SIZE = _env_int("DB_POOL_SIZE", 5)
    DB_MAX_OVERFLOW = _env_int("DB_MAX_OVERFLOW", 2)
    DB_POOL_RECYCLE = _env_int("DB_POOL_RECYCLE", 300)

    GMAIL_USERNAME = os.getenv("GMAIL_USERNAME")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

    URL_FRONTEND = os.getenv("URL_FRONTEND")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")

    MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER")
    MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_SECURE = _env_bool("MINIO_SECURE", False)
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "uploads")
    MINIO_AUTO_CREATE_BUCKET = _env_bool("MINIO_AUTO_CREATE_BUCKET", True)

    ADMIN_DEFAULT = os.getenv("ADMIN_DEFAULT")
    PASSWORD_DEFAULT = os.getenv("PASSWORD_DEFAULT")
    RUN_SEED = _env_bool("RUN_SEED", False)


config = config()
