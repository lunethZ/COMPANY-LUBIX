from sqlalchemy import text
from app.database.Connection import engine


def _probe_database() -> tuple[bool, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, ""
    except Exception as exc:
        return False, str(exc)


def database_is_available() -> bool:
    available, _ = _probe_database()
    return available


def db_test():
    available, detail = _probe_database()
    if available:
        return {"Base de datos": "OK"}
    return {"Base de datos": "ERROR", "detail": detail}
