#!/bin/bash
set -e

echo "Running alembic migrations..."
# Esperar a que postgres esté listo
until pg_isready -h postgres -p 5432 -U "${POSTGRES_USER:-postgres}"; do
  echo "Waiting for postgres..."
  sleep 2
done
alembic upgrade heads || alembic upgrade head

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
