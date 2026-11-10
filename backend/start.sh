#!/bin/bash
set -e

PORT="${PORT:-8000}"
MAX_RETRIES="${DB_MIGRATION_RETRIES:-10}"
RETRY_DELAY="${DB_MIGRATION_RETRY_DELAY:-3}"

echo "Running database migrations (alembic upgrade head)..."

attempt=1
migration_ok=0

while [ "$attempt" -le "$MAX_RETRIES" ]; do
  if alembic upgrade head; then
    migration_ok=1
    break
  fi

  echo "Migration attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY}s..."
  attempt=$((attempt + 1))
  sleep "$RETRY_DELAY"
done

if [ "$migration_ok" -ne 1 ]; then
  echo "ERROR: database migrations failed after ${MAX_RETRIES} attempts."
  exit 1
fi

echo "Starting uvicorn on port ${PORT}..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --workers "${WEB_CONCURRENCY:-1}" \
  --proxy-headers \
  --forwarded-allow-ips="*"
