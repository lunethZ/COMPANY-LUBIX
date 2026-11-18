#!/usr/bin/env python
"""Crea el esquema de la BD de pruebas con las migraciones de Alembic.

Uso (PowerShell, desde backend/):
    $env:TEST_DATABASE_URL = "postgresql+psycopg2://lubix_test:lubix_test@localhost:5433/lubix_test"
    python scripts/init_test_db.py
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy.engine import make_url


def _normalize(raw: str) -> str:
    if raw.startswith("postgres://"):
        return "postgresql+psycopg2://" + raw[len("postgres://"):]
    if raw.startswith("postgresql://"):
        return "postgresql+psycopg2://" + raw[len("postgresql://"):]
    return raw


def main() -> int:
    raw = os.environ.get("TEST_DATABASE_URL", "").strip()
    if not raw:
        print(
            "ERROR: define TEST_DATABASE_URL con la cadena de la BD de pruebas.",
            file=sys.stderr,
        )
        return 2

    url = _normalize(raw)
    database = make_url(url).database or ""
    if not database.endswith("_test"):
        print(
            f"ERROR: la base '{database}' no termina en _test. "
            "Me niego a migrar una BD que podría ser la de desarrollo.",
            file=sys.stderr,
        )
        return 2

    backend_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["URL_DATABASE"] = url
    # Neutraliza la cadena de Neon del .env del repo.
    env["DATABASE_URL_UNPOOLED"] = ""
    env["RUN_SEED"] = "false"

    print(f"Aplicando migraciones a {database} ...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        env=env,
    )
    if result.returncode == 0:
        print("Esquema listo.")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())