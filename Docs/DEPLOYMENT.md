# Guía de despliegue de LUBIX

Esta guía explica cómo publicar el **backend de LUBIX** en **Render** usando una base de datos PostgreSQL gestionada en **Neon** o **Supabase**. Incluye la obtención de la cadena de conexión, la creación del Web Service, la ejecución automática de migraciones con Alembic y la verificación posterior al despliegue.

> **Alcance:** el Web Service descrito aquí expone la API FastAPI. El frontend React puede publicarse por separado (por ejemplo, como Static Site en Render) y debe apuntar a la URL pública de esta API. El almacenamiento de archivos (MinIO/S3) también es externo al Web Service.

---

## Tabla de contenidos

1. [Arquitectura del despliegue](#1-arquitectura-del-despliegue)
2. [Requisitos previos](#2-requisitos-previos)
3. [Obtener la URL de conexión en Neon o Supabase](#3-obtener-la-url-de-conexión-en-neon-o-supabase)
4. [Preparar el repositorio y las variables de entorno](#4-preparar-el-repositorio-y-las-variables-de-entorno)
5. [Crear el Web Service en Render](#5-crear-el-web-service-en-render)
6. [Migraciones automáticas con Alembic](#6-migraciones-automáticas-con-alembic)
7. [Verificación posterior al despliegue](#7-verificación-posterior-al-despliegue)
8. [Solución de problemas](#8-solución-de-problemas)
9. [Checklist de seguridad y operación](#9-checklist-de-seguridad-y-operación)
10. [Referencias de archivos](#10-referencias-de-archivos)

---

## 1. Arquitectura del despliegue

```text
Internet / Frontend React
        │  HTTPS
        ▼
Render Web Service (Python)
  └── FastAPI + Uvicorn
        │  psycopg2 + sslmode=require
        ▼
PostgreSQL gestionado (Neon o Supabase)
```

El Web Service:

- Se construye con `pip install -r backend/requirements.txt`.
- Ejecuta `alembic upgrade head` al arrancar mediante `backend/start.sh`.
- Inicia Uvicorn en el puerto que Render inyecta en `$PORT`.
- Expone `GET /health` para el health check de Render.

El archivo [`render.yaml`](../render.yaml) de la raíz contiene la definición del servicio para el flujo de **Blueprint**. Si prefieres crear el servicio manualmente, los comandos son los mismos y se indican en la sección 5.

---

## 2. Requisitos previos

| Requisito | Detalle |
| --- | --- |
| Cuenta de Render | https://render.com |
| Cuenta de Neon o Supabase | https://neon.tech o https://supabase.com |
| Repositorio en GitHub/GitLab | Con acceso desde Render |
| Python 3.13 | Para pruebas locales |
| `psql` (opcional) | Para inspeccionar la base de datos |
| `curl` | Para las verificaciones posteriores |

Comprobación local del backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install pytest pytest-cov httpx
pytest
```

La suite debe terminar con `Required test coverage of 50% reached` y código de salida `0`.

---

## 3. Obtener la URL de conexión en Neon o Supabase

### 3.1 Neon

1. Inicia sesión en Neon y crea un proyecto.
2. Elige la región más cercana a Render (por ejemplo, `AWS us-east-1` si el servicio está en `oregon` o `us-east`).
3. En el panel del proyecto, abre **Connect** o **Connection Details**.
4. Selecciona el branch (`main`), la base de datos (`neondb` por defecto) y el rol.
5. Copia la cadena de conexión. Neon suele entregar algo así:

   ```text
   postgresql://usuario:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

6. Convierte la cadena al driver que usa LUBIX (`psycopg2`):

   ```text
   postgresql+psycopg2://usuario:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

7. Si usas la conexión **pooled**, el host contiene `-pooler`:

   ```text
   postgresql+psycopg2://usuario:password@ep-cool-name-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

   Para un Web Service de Render (proceso persistente) la conexión directa es una buena opción. Si usas el pooler, mantén `DB_POOL_SIZE` bajo (por ejemplo `2`) para no agotar el límite de conexiones del plan.

8. Neon exige TLS. LUBIX agrega `sslmode=require` automáticamente cuando la URL apunta a un host remoto, pero se recomienda dejarlo explícito en la cadena.

### 3.2 Supabase

1. Inicia sesión en Supabase y crea un proyecto.
2. Ve a **Project Settings → Database → Connection string → URI**.
3. Copia la cadena. Supabase ofrece varias modalidades:
   - **Direct connection**: útil si la red soporta IPv6.
   - **Session pooler**: recomendado para hosts con IPv4, como Render.
   - **Transaction pooler**: pensado para aplicaciones serverless; puede no ser la mejor opción para migraciones Alembic.
4. Reemplaza `[YOUR-PASSWORD]` por la contraseña real de la base de datos.
5. Agrega el driver de LUBIX y SSL:

   ```text
   postgresql+psycopg2://postgres:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```

   Para Supabase, el puerto del **Session pooler** suele ser `5432`; el del **Transaction pooler**, `6543`.

6. Si la contraseña contiene caracteres especiales, codifícalos para URL:

   | Carácter | Codificación |
   | --- | --- |
   | `@` | `%40` |
   | `:` | `%3A` |
   | `/` | `%2F` |
   | `#` | `%23` |
   | `%` | `%25` |

   Ejemplo: `P@ss#1` se convierte en `P%40ss%231`.

### 3.3 Probar la URL antes de desplegar

Desde la carpeta `backend`, con el entorno virtual activado:

```bash
export URL_DATABASE='postgresql+psycopg2://usuario:password@host:5432/db?sslmode=require'
python -c "from sqlalchemy import create_engine, text; e=create_engine(__import__('os').environ['URL_DATABASE']); c=e.connect(); print(c.execute(text('select 1')).scalar()); c.close()"
```

En Windows PowerShell:

```powershell
$env:URL_DATABASE = "postgresql+psycopg2://usuario:password@host:5432/db?sslmode=require"
python -c "from sqlalchemy import create_engine, text; import os; e=create_engine(os.environ['URL_DATABASE']); c=e.connect(); print(c.execute(text('select 1')).scalar()); c.close()"
```

Debe imprimir `1`. Si falla con un error de SSL, revisa que `sslmode=require` esté presente y que el host sea el correcto. Si falla por autenticación, vuelve a copiar la contraseña y codifícala.

---

## 4. Preparar el repositorio y las variables de entorno

### 4.1 Archivos relevantes

| Archivo | Función |
| --- | --- |
| `render.yaml` | Definición del Web Service para Render Blueprint. |
| `backend/requirements.txt` | Dependencias de ejecución instaladas en Render y Docker. |
| `backend/start.sh` | Espera/ reintenta migraciones y arranca Uvicorn en `$PORT`. |
| `backend/alembic.ini` | Configuración de Alembic; incluye `prepend_sys_path = .`. |
| `backend/alembic/env.py` | Usa la URL normalizada (driver + SSL) para migrar. |
| `backend/app/database/Connection.py` | Normaliza `URL_DATABASE`/`DATABASE_URL` y configura el pool. |
| `.env.example` | Plantilla de variables para local y producción. |

### 4.2 Variables de entorno requeridas en Render

Configura estas variables en **Render → tu servicio → Environment**. Las marcadas como secretas no deben quedar escritas en el repositorio.

| Variable | Obligatoria | Ejemplo / valor | Descripción |
| --- | --- | --- | --- |
| `URL_DATABASE` | Sí | `postgresql+psycopg2://user:pass@host:5432/db?sslmode=require` | Cadena de conexión a Neon/Supabase. También se acepta `DATABASE_URL` como alias. |
| `SECRET_KEY` | Sí | Valor aleatorio largo | Firma de JWT. En Render puede generarse automáticamente. |
| `ALGORITHM` | Sí | `HS256` | Algoritmo de firma JWT. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Sí | `60` | Vigencia del access token. |
| `REFRESH_TOKEN_DAYS` | Sí | `7` | Vigencia del refresh token. |
| `ENVIRONMENT` | Sí | `production` | Entorno de ejecución. |
| `URL_FRONTEND` | Sí | `https://lubix-frontend.onrender.com` | Origen del frontend para CORS. |
| `CORS_ORIGINS` | Opcional | `https://admin.example.com,https://app.example.com` | Orígenes adicionales separados por coma. |
| `DB_SSL_MODE` | Recomendada | `require` | SSL forzado para PostgreSQL remoto. |
| `DB_POOL_SIZE` | Opcional | `5` | Conexiones base del pool. Usa `2` si el plan de Neon/Supabase es limitado. |
| `DB_MAX_OVERFLOW` | Opcional | `2` | Conexiones adicionales permitidas. |
| `DB_POOL_RECYCLE` | Opcional | `300` | Recicla conexiones cada 5 minutos. |
| `DB_MIGRATION_RETRIES` | Opcional | `10` | Reintentos de `alembic upgrade head` al arrancar. |
| `ADMIN_DEFAULT` | Primer despliegue | `admin@lubix.com` | Correo del administrador inicial del seed. |
| `PASSWORD_DEFAULT` | Primer despliegue | Contraseña fuerte | Contraseña del administrador inicial. |
| `RUN_SEED` | Primer despliegue | `true` y luego `false` | Crea roles y administrador. Es idempotente, pero debe apagarse tras el primer arranque. |
| `GMAIL_USERNAME` | Para correos | `tu_correo@gmail.com` | Cuenta SMTP. |
| `GMAIL_APP_PASSWORD` | Para correos | App Password de Gmail | No uses la contraseña normal de la cuenta. |
| `MINIO_ENDPOINT` | Para archivos | `storage.example.com:9000` | Host:puerto del MinIO/S3 externo. |
| `MINIO_SECURE` | Para archivos | `true` | Usa TLS hacia el almacenamiento. |
| `MINIO_BUCKET` | Para archivos | `uploads` | Bucket de archivos. |
| `MINIO_ROOT_USER` | Para archivos | Usuario del storage | Credencial de acceso. |
| `MINIO_ROOT_PASSWORD` | Para archivos | Contraseña del storage | Credencial de acceso. |
| `MINIO_AUTO_CREATE_BUCKET` | Para archivos | `false` en producción | Evita bloquear el arranque si el bucket ya existe o el storage no responde. |
| `WEB_CONCURRENCY` | Opcional | `1` | Número de workers de Uvicorn. En el plan free deja `1`. |

Generar un `SECRET_KEY` seguro:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 4.3 Nota sobre MinIO y archivos

El backend usa el SDK de MinIO para imágenes, logos, banners y certificados. Render no provee un MinIO administrado. Tienes dos opciones:

1. **Usar un MinIO/S3 externo** y configurar `MINIO_ENDPOINT`, `MINIO_SECURE`, `MINIO_BUCKET`, `MINIO_ROOT_USER` y `MINIO_ROOT_PASSWORD`.
2. **No configurar almacenamiento** para una primera validación de la API. El servicio arrancará igual porque `NasService` captura el error de conexión; los endpoints de archivos fallarán, pero autenticación, catálogo, PQRS y salud seguirán funcionando.

En producción se recomienda la opción 1. Nunca uses el filesystem efímero de Render para guardar archivos.

---

## 5. Crear el Web Service en Render

### Opción A: Blueprint con `render.yaml` (recomendada)

1. Haz commit y push del repositorio con el archivo `render.yaml` en la raíz.
2. En Render, entra a **Dashboard → New → Blueprint**.
3. Conecta tu repositorio de GitHub/GitLab.
4. Selecciona la rama (`main`) y el nombre del blueprint.
5. Render detectará `render.yaml` y mostrará el servicio `lubix-api`.
6. Completa las variables marcadas con `sync: false`:
   - `URL_DATABASE`
   - `URL_FRONTEND`
   - `CORS_ORIGINS`
   - `GMAIL_USERNAME`
   - `GMAIL_APP_PASSWORD`
   - `MINIO_ENDPOINT`
   - `MINIO_ROOT_USER`
   - `MINIO_ROOT_PASSWORD`
   - `ADMIN_DEFAULT`
   - `PASSWORD_DEFAULT`
7. Para el primer despliegue, define `RUN_SEED=true` (en el asistente de Render o en el dashboard). Después del primer arranque, cámbialo a `false`.
8. Aplica el blueprint y espera el despliegue.

El `render.yaml` usa:

```yaml
buildCommand: pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
startCommand: bash start.sh
healthCheckPath: /health
rootDir: backend
```

### Opción B: Web Service manual

1. En Render, entra a **Dashboard → New → Web Service**.
2. Conecta el repositorio.
3. Configura:
   - **Name:** `lubix-api`
   - **Region:** la más cercana a tu base de datos (por ejemplo `Oregon` o `Ohio`).
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt`
   - **Start Command:** `bash start.sh`
   - **Health Check Path:** `/health`
   - **Plan:** Free o Starter según el uso.
4. Agrega las variables de entorno de la sección 4.2.
5. Crea el servicio y espera el primer despliegue.

> **Importante:** no fijes `PORT` manualmente en Render. La plataforma inyecta su propio valor y `start.sh` lo usa con `--port "$PORT"`.

### Comandos exactos del servicio

| Campo | Valor exacto |
| --- | --- |
| Build Command | `pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt` |
| Start Command | `bash start.sh` |
| Health Check Path | `/health` |

El `start.sh` ejecuta, en orden:

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" \
  --workers "${WEB_CONCURRENCY:-1}" \
  --proxy-headers \
  --forwarded-allow-ips="*"
```

Si `alembic upgrade head` falla, reintenta hasta `DB_MIGRATION_RETRIES` veces (10 por defecto, cada 3 segundos) y luego termina con error para que Render marque el despliegue como fallido.

---

## 6. Migraciones automáticas con Alembic

### 6.1 Cómo funcionan en Render

No se usa un comando manual durante el despliegue: `backend/start.sh` aplica las migraciones antes de levantar Uvicorn. Esto funciona también en el plan free, donde no siempre se dispone de `preDeployCommand`.

Secuencia esperada en **Render → Logs**:

```text
Running database migrations (alembic upgrade head)...
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 8604d5f49af7, Initial migration
...
INFO  [alembic.runtime.migration] Running upgrade f5e6d7c8b9a0 -> c9d8e7f6a5b4, add avatar and banner to users
Starting uvicorn on port 10000...
```

### 6.2 Verificar el estado de las migraciones

Desde **Render → Shell** del servicio:

```bash
alembic current
alembic history --verbose
```

`alembic current` debe mostrar la revisión `c9d8e7f6a5b4 (head)`.

Para aplicar migraciones manualmente si fuera necesario:

```bash
alembic upgrade head
```

### 6.3 Seed inicial

El seed crea los roles `user`, `company` y `admin`, y el usuario administrador definido en `ADMIN_DEFAULT` / `PASSWORD_DEFAULT`.

1. En el primer despliegue, define `RUN_SEED=true`.
2. Revisa los logs: debe ejecutarse el seed al iniciar el lifespan de FastAPI.
3. Inicia sesión con el administrador para comprobar que existe.
4. Cambia `RUN_SEED=false` y redespliega o reinicia el servicio.

El seed es idempotente: no duplica roles ni el administrador, pero mantenerlo apagado evita ejecuciones innecesarias en cada arranque.

### 6.4 Migraciones locales contra la base remota (opcional)

Si necesitas generar una migración nueva:

```bash
cd backend
export URL_DATABASE='postgresql+psycopg2://...'
alembic revision --autogenerate -m "descripcion del cambio"
alembic upgrade head
```

Revisa siempre el archivo generado antes de hacer commit. No ejecutes `alembic downgrade` en producción sin una copia de seguridad.

---

## 7. Verificación posterior al despliegue

Sustituye `https://lubix-api.onrender.com` por la URL real que Render asigna a tu servicio.

### 7.1 Health checks

```bash
curl -i https://lubix-api.onrender.com/health
```

Respuesta esperada (HTTP 200):

```json
{
  "status": "ok",
  "service": "lubix-api",
  "environment": "production"
}
```

Base de datos:

```bash
curl -i https://lubix-api.onrender.com/health/database
```

Respuesta esperada:

```json
{"Base de datos": "OK"}
```

Conectividad a internet (útil para diagnosticar salida de red):

```bash
curl -i https://lubix-api.onrender.com/health/internet
```

### 7.2 Documentación interactiva

Abre en el navegador:

- `https://lubix-api.onrender.com/docs`
- `https://lubix-api.onrender.com/openapi.json`

Si `/docs` carga, FastAPI y Uvicorn están operativos.

### 7.3 Verificar las tablas en PostgreSQL

Con la cadena directa de Neon/Supabase (sin `+psycopg2` para `psql`):

```bash
psql "postgresql://usuario:password@host:5432/db?sslmode=require" -c "\dt"
```

Deben aparecer, entre otras, las tablas:

```text
alembic_version
roles
users
company
event_codes
refreshToken
addresses
orders
order_items
products
catalogs
reviews
favorites
carts
cart_items
pqrs
```

### 7.4 Probar autenticación y API

1. Inicia sesión con el administrador creado por el seed:

```bash
curl -X POST https://lubix-api.onrender.com/auth/login-user \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lubix.com","password":"TU_PASSWORD_DEFAULT"}'
```

Respuesta esperada: un JSON con `access_token`, `refresh_token`, `token_type`, `role`, etc.

2. Usa el token para consultar una ruta protegida:

```bash
curl -i https://lubix-api.onrender.com/pqrs \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

Debe responder `200` con la lista de PQRS del usuario (vacía al inicio).

3. Prueba el registro de un usuario nuevo:

```bash
curl -X POST https://lubix-api.onrender.com/auth/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Usuario de Prueba",
    "email": "prueba@example.com",
    "password": "Prueba123!",
    "tell": "3001234567"
  }'
```

Si el SMTP está configurado, se enviará el código de verificación. Si no, el usuario se crea igualmente y el código queda generado en `event_codes`; revisa los logs para diagnosticar el correo.

### 7.5 Verificar CORS

Si el frontend está en otro dominio, comprueba el preflight:

```bash
curl -i -X OPTIONS https://lubix-api.onrender.com/auth/login-user \
  -H "Origin: https://lubix-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Debe incluir:

```text
access-control-allow-origin: https://lubix-frontend.onrender.com
```

Si no aparece, revisa `URL_FRONTEND` y `CORS_ORIGINS` en Render y vuelve a desplegar.

### 7.6 Revisar logs y métricas

En **Render → Logs** verifica:

- Que aparezca `Running database migrations...` sin errores.
- Que aparezca `Starting uvicorn...`.
- Que no haya `Traceback`, `OperationalError`, `MaxRetryError` ni errores de SSL.
- Que el health check esté en verde.

En **Render → Metrics** revisa CPU, memoria y tiempos de respuesta. En el plan free el servicio se suspende por inactividad y la primera petición puede tardar unos segundos (cold start).

---

## 8. Solución de problemas

### `ModuleNotFoundError: No module named 'app'` al ejecutar Alembic

Asegúrate de ejecutar desde `backend/` y de que `alembic.ini` contenga:

```ini
prepend_sys_path = .
```

El `render.yaml` ya usa `rootDir: backend`, por lo que el comando se ejecuta en esa carpeta.

### `psycopg2.OperationalError: FATAL: no pg_hba.conf entry ... no encryption`

La URL no está usando SSL. Agrega `?sslmode=require` o define `DB_SSL_MODE=require`. LUBIX también lo agrega automáticamente para hosts remotos.

### `could not translate host name` o `Name or service not known`

Revisa que copiaste el host completo de Neon/Supabase, sin espacios, y que no estás usando el host interno de Docker (`postgres`) en producción.

### `password authentication failed`

- Vuelve a copiar la contraseña desde el panel del proveedor.
- Codifica caracteres especiales (`@` → `%40`, `#` → `%23`, `%` → `%25`).
- Si cambiaste la contraseña en Neon/Supabase, actualiza `URL_DATABASE` en Render.
- Recuerda que `URL_DATABASE` tiene prioridad sobre `DATABASE_URL`.

### `too many connections` o `remaining connection slots are reserved`

Reduce el pool:

```env
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=0
```

Si usas Neon o Supabase, considera la cadena **pooled** y revisa el límite de conexiones de tu plan.

### `relation "..." does not exist`

Las migraciones no se aplicaron. Revisa los logs del arranque y ejecuta desde Render Shell:

```bash
alembic current
alembic upgrade head
```

### El deploy falla en el health check

- Confirma que `startCommand` sea `bash start.sh`.
- Confirma que el servicio escucha en `$PORT` (no fijes `PORT` manualmente).
- Revisa que `/health` responda `200`.
- Revisa si las migraciones están fallando y bloqueando el arranque.

### Error de conexión con MinIO/S3

- Verifica `MINIO_ENDPOINT` (host:puerto, sin `http://`).
- Usa `MINIO_SECURE=true` si el proveedor exige TLS.
- Crea el bucket manualmente y deja `MINIO_AUTO_CREATE_BUCKET=false`.
- Si no necesitas archivos para la validación inicial, deja el storage sin configurar: la API arranca y solo fallan los endpoints de archivos.

### El correo no se envía

- Usa una **App Password** de Gmail, no la contraseña normal.
- Verifica `GMAIL_USERNAME` y `GMAIL_APP_PASSWORD`.
- Revisa los logs: `EmailService` imprime el error sin exponer la contraseña.
- Si el correo falla, el usuario puede quedar creado pero sin verificar; solicita reenvío o revisa `event_codes`.

### `Invalid URL` o `percent-encoded`

Codifica la contraseña. Ejemplo en Python:

```python
from urllib.parse import quote_plus
print(quote_plus("P@ss#1"))
```

---

## 9. Checklist de seguridad y operación

- [ ] `SECRET_KEY` es aleatorio y distinto al de desarrollo.
- [ ] `ADMIN_DEFAULT` y `PASSWORD_DEFAULT` no son los valores de ejemplo.
- [ ] `RUN_SEED=false` después del primer despliegue.
- [ ] `URL_DATABASE` usa TLS (`sslmode=require` o superior).
- [ ] `URL_FRONTEND` y `CORS_ORIGINS` apuntan solo a dominios reales.
- [ ] No hay secretos en el repositorio ni en `render.yaml` (usa `sync: false`).
- [ ] Las migraciones se ejecutan antes de Uvicorn y el health check está en verde.
- [ ] Se revisan los logs después de cada despliegue.
- [ ] Hay copias de seguridad o point-in-time recovery en Neon/Supabase.
- [ ] El plan de Render y el de la base de datos soportan la carga esperada.
- [ ] El almacenamiento de archivos es persistente y externo al filesystem de Render.

### Rollback

1. En Render, abre **Deploys** y selecciona el despliegue anterior → **Redeploy**.
2. Si el problema es de esquema, no ejecutes `alembic downgrade` sin antes restaurar una copia de seguridad o crear una migración de reversión revisada.
3. Si cambiaste variables de entorno, vuelve a los valores anteriores y redespliega.

---

## 10. Referencias de archivos

- [`render.yaml`](../render.yaml)
- [`backend/start.sh`](../backend/start.sh)
- [`backend/requirements.txt`](../backend/requirements.txt)
- [`backend/alembic.ini`](../backend/alembic.ini)
- [`backend/alembic/env.py`](../backend/alembic/env.py)
- [`backend/app/database/Connection.py`](../backend/app/database/Connection.py)
- [`backend/app/Config.py`](../backend/app/Config.py)
- [`.env.example`](../.env.example)
- [`Docs/Estrategia_Hosting_y_Dominio.md`](Estrategia_Hosting_y_Dominio.md)
