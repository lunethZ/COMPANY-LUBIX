# Lubix Backend

API REST construida con **FastAPI** (Python 3.13) para la plataforma Lubix. Maneja autenticación, gestión de usuarios, empresas, productos, carrito de compras y pedidos.

## Stack

| Componente | Tecnología |
|-----------|------------|
| Framework | FastAPI 0.135.1 |
| ORM | SQLAlchemy |
| Migraciones | Alembic |
| Base de datos | PostgreSQL 16 |
| Auth | JWT (python-jose) + bcrypt |
| Almacenamiento | MinIO SDK |
| Validación | Pydantic 2.12.5 |
| Gestor de deps | UV |

## Estructura

```
backend/
├── app/
│   ├── main.py              # Aplicación FastAPI
│   ├── Config.py            # Configuración global
│   ├── database/            # Conexión a PostgreSQL
│   ├── models/              # Modelos SQLAlchemy
│   ├── schemas/             # Esquemas Pydantic
│   ├── routers/             # Rutas API
│   ├── services/            # Lógica de negocio
│   ├── middleware/          # Auth y CORS
│   ├── utils/               # Utilidades
│   └── docs/                # Documentación interna
├── alembic/                 # Migraciones
├── tests/                   # Pruebas automatizadas (pytest)
├── scripts/                 # Utilidades internas (p. ej. init_test_db.py)
├── pyproject.toml           # Dependencias y configuración (UV)
├── requirements.txt         # Dependencias para instalación con pip
├── pytest.ini               # Configuración de pruebas y cobertura
├── start.sh                 # Arranque en producción (migraciones + Uvicorn)
├── Dockerfile               # Contenedor
└── alembic.ini              # Config Alembic
```

El punto de entrada es `app/main.py` (instancia `app` de FastAPI).

## Variables de entorno

Se cargan desde `backend/.env` (o desde el entorno del contenedor). La plantilla completa está en el [`.env.example`](../.env.example) de la raíz; estos son los grupos principales:

| Variable | Uso |
|----------|-----|
| `URL_DATABASE` / `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `DATABASE_URL_UNPOOLED` | Conexión directa para Alembic (Neon) |
| `SECRET_KEY`, `ALGORITHM` | Firma de tokens JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_DAYS` | Vigencia de tokens |
| `ENVIRONMENT`, `DB_SSL_MODE`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_RECYCLE` | Entorno y pool de conexiones |
| `URL_FRONTEND`, `CORS_ORIGINS` | Orígenes permitidos |
| `MINIO_ENDPOINT`, `MINIO_SECURE`, `MINIO_BUCKET`, `MINIO_REGION`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_AUTO_CREATE_BUCKET` | Almacenamiento S3 compatible (MinIO o Cloudflare R2) |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Correo transaccional principal |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Respaldo de correo |
| `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD` | Último respaldo SMTP |
| `ADMIN_DEFAULT`, `PASSWORD_DEFAULT`, `RUN_SEED` | Seed inicial de roles y administrador |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /auth/register-user | Registro de usuario cliente |
| POST | /api/v1/auth/login | Inicio de sesión |
| POST | /api/v1/auth/verify-email | Verificación de correo |
| POST | /api/v1/auth/forgot-password | Recuperación de contraseña |
| POST | /api/v1/auth/reset-password | Restablecimiento de contraseña |
| GET | /health | VerificaciÃ³n de disponibilidad del servicio |

Documentación Swagger disponible en `/docs` al ejecutar el servidor.

## Ejecución

### Con Docker (recomendado)

```bash
docker compose up -d backend
```

### Desarrollo local

```bash
cd backend
uv venv
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Migraciones

```bash
# Generar migración
uv run alembic revision --autogenerate -m "descripcion"

# Aplicar migración
uv run alembic upgrade head
```

En Render las migraciones se ejecutan automáticamente al arrancar (`backend/start.sh` ejecuta `alembic upgrade head` antes de Uvicorn).

## Pruebas y cobertura

```bash
pytest
```

El umbral mínimo es **80 %** (`fail_under = 80` en `pyproject.toml` y `--cov-fail-under=80` en `pytest.ini`).

## Despliegue

La guía completa para publicar la API en Render con PostgreSQL en Neon o Supabase está en [`Docs/DEPLOYMENT.md`](../Docs/DEPLOYMENT.md). El archivo [`render.yaml`](../render.yaml) de la raíz contiene el Web Service y `requirements.txt` las dependencias de ejecución.

## Auditoría de seguridad

Ver [app/docs/AUDITORIA.md](app/docs/AUDITORIA.md) para instrucciones de auditoría de vulnerabilidades con `pip-audit`.
