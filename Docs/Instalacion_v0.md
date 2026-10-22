# Guía de Instalación — LUBIX (v0)

> **Versión:** v0 (borrador inicial)
> **Documento complementario de:** [`BC-Implantacion.md`](./BC-Implantacion.md) y [`Ficha_Tecnica.md`](./Ficha_Tecnica.md)
> **Fecha:** 2026-10-18

## 1. Objetivo

Instalar y ejecutar LUBIX **desde cero** en una máquina usando Docker Compose.

## 2. Requisitos previos

- **Docker** v20.10+ y **Docker Compose** v2.
- **Git**.
- Opcional (desarrollo local sin Docker): **Python 3.13 + UV**, **Node.js 18+ + pnpm**, **PostgreSQL 16**.

> Hardware mínimo y stack completo: ver [`Ficha_Tecnica.md`](./Ficha_Tecnica.md).

## 3. Instalación paso a paso

### 3.1 Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd mobil_lubix_autentication
```

### 3.2 Crear el archivo de entorno
```bash
# Linux/macOS
cp .env.example .env
# Windows
copy .env.example .env
```
Editar `.env` con valores reales. Variables clave:
```env
# PostgreSQL
POSTGRES_USER=lubix
POSTGRES_PASSWORD=CHANGE_ME_PG
POSTGRES_DB=lubix
URL_DATABASE=postgresql+psycopg2://lubix:CHANGE_ME_PG@postgres:5432/lubix

# JWT
SECRET_KEY=CHANGE_ME_LLAVE_JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_DAYS=7
URL_FRONTEND=http://localhost:5173

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_MINIO

# Email (Gmail App Password)
GMAIL_USERNAME=tucorreo@gmail.com
GMAIL_APP_PASSWORD=CHANGE_ME_APP_PASSWORD

# Seed inicial
ADMIN_DEFAULT=admin@lubix.com
PASSWORD_DEFAULT=Admin123!
RUN_SEED=true   # activar solo la primera vez
```

### 3.3 Construir y levantar
```bash
docker compose build
docker compose up -d
docker compose ps
```

### 3.4 Aplicar migraciones de base de datos
El contenedor del backend ejecuta `start.sh`, que espera a PostgreSQL y corre:
```bash
alembic upgrade heads || alembic upgrade head
```
Manualmente:
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current   # verificar revisión
```

### 3.5 Seed inicial
Con `RUN_SEED=true`, al arrancar el backend se crean los roles (`user`, `company`, `admin`) y el
usuario admin (`ADMIN_DEFAULT` / `PASSWORD_DEFAULT`).

> ⚠️ **Después de la primera ejecución**, cambiar `RUN_SEED=false` y **cambiar `PASSWORD_DEFAULT`** y
> los secretos por valores seguros.

## 4. Acceso a los servicios

Puertos según `docker-compose.yml` (fuente de verdad):

| Servicio | URL |
|----------|-----|
| Frontend web | http://localhost:5173 |
| Backend API | http://localhost:8002 |
| Swagger UI | http://localhost:8002/docs |
| MinIO API | http://localhost:9100 |
| MinIO consola | http://localhost:9101 |
| Móvil (Metro/Expo) | http://localhost:8081 |

> El `README.md` puede listar puertos antiguos (`8001`, `9000`, `5434`); usar los del compose.

## 5. Verificación

```bash
# Estado de contenedores
docker compose ps

# Health checks del backend
curl http://localhost:8002/health/database
curl http://localhost:8002/health/internet

# Logs
docker compose logs -f backend
```
- [ ] Frontend carga en `http://localhost:5173`.
- [ ] Swagger responde en `/docs`.
- [ ] `/health/database` responde OK.
- [ ] Login con el admin creado por la seed.

## 6. Detener / limpiar

```bash
docker compose down          # detener (conserva volúmenes)
docker compose down -v       # detener y eliminar volúmenes (borra datos)
docker compose build --no-cache && docker compose up -d   # reconstruir desde cero
```

## 7. Troubleshooting básico

| Problema | Solución |
|----------|----------|
| Puerto en uso | Cambiar el mapeo en `docker-compose.yml` |
| Backend no conecta a BD | Revisar `URL_DATABASE` y `docker compose logs postgres` |
| MinIO no responde | `docker compose restart minio` |
| Frontend no carga | `pnpm store prune && rm -rf node_modules && pnpm install` |

## 8. Pendientes para v1

- Instalación en servidor de producción (HTTPS + proxy inverso).
- Pipeline de despliegue continuo (ver sección Pipeline de `BC-Implantacion.md`).
- Script de instalación automatizado.

---

*Documento v0 — sujeto a revisión.*
