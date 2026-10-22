FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . .

RUN chmod +x start.sh

# Install main dependencies
RUN pip install --no-cache-dir \
    alembic==1.18.4 \
    bcrypt==3.2.2 \
    certifi==2026.2.25 \
    email-validator==2.3.0 \
    fastapi==0.135.1 \
    greenlet==3.3.2 \
    minio==7.2.20 \
    passlib==1.7.4 \
    psycopg2-binary==2.9.11 \
    pydantic==2.12.5 \
    python-dotenv==1.2.2 \
    python-jose==3.5.0 \
    python-multipart>=0.0.27 \
    requests>=2.33.1 \
    sqlalchemy==2.0.48 \
    uvicorn==0.41.0

EXPOSE 8000

CMD ["./start.sh"]
