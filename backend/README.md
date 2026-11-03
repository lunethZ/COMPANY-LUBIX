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
├── pyproject.toml           # Dependencias
├── Dockerfile               # Contenedor
└── alembic.ini              # Config Alembic
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/v1/auth/register | Registro de usuario |
| POST | /api/v1/auth/login | Inicio de sesión |
| POST | /api/v1/auth/verify-email | Verificación de correo |
| POST | /api/v1/auth/forgot-password | Recuperación de contraseña |
| POST | /api/v1/auth/reset-password | Restablecimiento de contraseña |
| GET | /health/test | Health check |

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

El umbral mínimo es **50 %** (`fail_under = 50` en `pyproject.toml` y `--cov-fail-under=50` en `pytest.ini`).

## Despliegue

La guía completa para publicar la API en Render con PostgreSQL en Neon o Supabase está en [`Docs/DEPLOYMENT.md`](../Docs/DEPLOYMENT.md). El archivo [`render.yaml`](../render.yaml) de la raíz contiene el Web Service y `requirements.txt` las dependencias de ejecución.

## Auditoría de seguridad

Ver [app/docs/AUDITORIA.md](app/docs/AUDITORIA.md) para instrucciones de auditoría de vulnerabilidades con `pip-audit`.
