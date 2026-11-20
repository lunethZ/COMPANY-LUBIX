# Matriz de usuarios y roles — LUBIX (P4-S5)

> Documento complementario de [`Seguridad_Servidor.md`](./Seguridad_Servidor.md).
> Fuente de verdad del código: `backend/app/middleware/AuthMiddleware.py`.
> Entorno: Render + Neon.

| Campo | Valor |
|-------|-------|
| Sistema | LUBIX — Plataforma de Gestión Empresarial |
| Versión del documento | 1.0.0 |
| Fecha | 2026-11-18 |
| Autor | Equipo LUBIX |
| Alcance | Roles de aplicación (JWT) y roles de PostgreSQL (Neon) |

---

## 1. Cómo se autoriza una petición

El middleware `auth_middleware` se ejecuta antes de los routers y aplica este
orden:

1. `OPTIONS` pasa siempre (preflight de CORS).
2. `/files/` pasa siempre.
3. Si la ruta está en `PUBLIC_ROUTES`, pasa sin token.
4. Si la ruta empieza por `/products/`:
   - `GET` pasa sin token;
   - cualquier otro método exige un token válido con `type = "access"` y
     `role = "user"`; otro rol recibe **403**.
5. Cualquier otra ruta exige token válido.
6. El rol `admin` pasa sin consultar la lista de permisos (*bypass*).
7. `user` y `company` solo pasan si la ruta empieza por alguna entrada de
   `ROLES_PERMISSIONS_ROUTERS`; si no, reciben **401**.

El token debe ser un *access token* (`type = "access"`); un refresh token se
rechaza con 401.

---

## 2. Matriz de la aplicación

`Sí` = permitido. `No` = bloqueado. `—` = la ruta es pública y no requiere ese
rol. Los códigos entre paréntesis indican la respuesta del middleware.

| Recurso | Público | `user` | `company` | `admin` |
|---------|:-------:|:------:|:---------:|:-------:|
| `POST /auth/login-user`, `/auth/login-company` | Sí | — | — | — |
| `POST /auth/register-user`, `/auth/register-company` | Sí | — | — | — |
| `POST /auth/verify-email-user`, `/auth/resend-verification` | Sí | — | — | — |
| `POST /auth/forgot-password-user`, `/auth/reset-password-user` | Sí | — | — | — |
| `POST /auth/refresh`, `/auth/logout` | Sí | — | — | — |
| `GET /health`, `/health/database`, `/health/internet` | Sí | — | — | — |
| `GET /products/search` | Sí | — | — | — |
| `GET /products/{...}` | Sí | — | — | — |
| `/files/*` (cualquier método) | Sí | — | — | — |
| `GET /docs`, `GET /openapi.json` | Sí | — | — | — |
| `POST/PUT/PATCH/DELETE /products/*` (reseñas) | No | Sí | No (403) | No (403) |
| `/cart*` | No | Sí | No (401) | Sí (bypass) |
| `/pqrs*` | No | Sí | Sí | Sí |
| `/company/dashboard/me` | No | No (401) | Sí | Sí (bypass) |
| `/company/dashboard/my-profile` | No | No (401) | Sí | Sí (bypass) |
| `/company/dashboard/upgrade-my-profile` | No | No (401) | Sí | Sí (bypass) |
| `/company/dashboard/upload-logo` | No | No (401) | Sí | Sí (bypass) |
| `/company/dashboard/upload-banner` | No | No (401) | Sí | Sí (bypass) |
| `/company/products*` (incluye `upload-image`) | No | No (401) | Sí | Sí (bypass) |
| `/company/orders` | No | No (401) | Sí | Sí (bypass) |
| `/user/dashboard`, `/user/profile` | No | Sí | No (401) | Sí (bypass) |
| `/user/change-password`, `/user/account` | No | Sí | No (401) | Sí (bypass) |
| `/user/export`, `/user/addresses` | No | Sí | No (401) | Sí (bypass) |
| `/user/orders`, `/user/favorites` | No | Sí | No (401) | Sí (bypass) |
| `/user/avatar`, `/user/banner` | No | Sí | No (401) | Sí (bypass) |
| `/admin/*` | No | No (401) | No (401) | Sí |
| Cualquier otra ruta autenticada | No | No (401) | No (401) | Sí |

Roles de aplicación creados por el seed (`backend/app/utils/seed.py`): `user`,
`company`, `admin`.

---

## 3. Permisos exactos configurados en el código

Listas de `AuthMiddleware.py`, usadas como prefijos de ruta:

| Rol | Prefijos permitidos |
|-----|---------------------|
| `admin` | Todos (bypass) |
| `company` | `/company/dashboard/me`, `/company/dashboard/my-profile`, `/company/dashboard/upgrade-my-profile`, `/company/dashboard/upload-logo`, `/company/dashboard/upload-banner`, `/company/products`, `/company/orders`, `/pqrs`, `/company/products/upload-image` |
| `user` | `/user/dashboard`, `/user/profile`, `/user/change-password`, `/user/account`, `/user/export`, `/user/addresses`, `/user/orders`, `/user/favorites`, `/user/avatar`, `/user/banner`, `/cart`, `/pqrs` |

Rutas públicas (`PUBLIC_ROUTES`): login y registro de usuario y empresa,
verificación de correo, reenvío de verificación, recuperación y restablecimiento
de contraseña, `refresh`, `logout`, los tres `health`, `products/search`, `docs`,
`openapi.json` y `files`.

---

## 4. Matriz de roles de PostgreSQL (Neon)

El rol dueño del proyecto (por defecto `neondb_owner`) es miembro de
`neon_superuser`. Los roles `lubix_app` y `lubix_backup` se crean por SQL y **no**
heredan esa membresía.

| Objeto / operación | Rol dueño del proyecto | `lubix_app` | `lubix_backup` |
|--------------------|:----------------------:|:-----------:|:--------------:|
| `CONNECT` a la base | Sí | Sí | Sí |
| `USAGE` del esquema `public` | Sí | Sí | Sí |
| `CREATE` en el esquema `public` | Sí | **No** | **No** |
| `SELECT` en tablas | Sí | Sí | Sí |
| `INSERT` / `UPDATE` / `DELETE` en tablas | Sí | Sí | **No** |
| `USAGE` / `SELECT` en secuencias | Sí | Sí | Sí |
| `SELECT` en `alembic_version` | Sí | **No** | Sí |
| Crear o alterar tablas (DDL) | Sí | **No** | **No** |
| Miembro de `neon_superuser` | Sí | **No** | **No** |
| Límite de conexiones | — | 20 | 3 |
| Uso previsto | Migraciones Alembic | Runtime de FastAPI | Respaldos |

Límites adicionales de `lubix_app`:

```text
statement_timeout = 30s
idle_in_transaction_session_timeout = 60s
```

### 4.1 Credenciales por uso

| Uso | Rol | Cadena | Variable |
|-----|-----|--------|----------|
| Runtime de la API | `lubix_app` | Pooled (`-pooler`) | `URL_DATABASE` en Render |
| Migraciones (`start.sh`) | Rol dueño | Directa (sin pooler) | `DATABASE_URL_UNPOOLED` en Render |
| Respaldos | `lubix_backup` | Directa | Fuera de la aplicación |
| Administración | Rol dueño | Editor SQL o `psql` | Consola de Neon |

Las contraseñas viven en el gestor de secretos del equipo y en las variables de
Render (`sync: false`). No se versionan.

---

## 5. Observaciones para seguimiento

Estas observaciones no cambian el comportamiento actual; quedan registradas para
una revisión posterior del equipo:

1. **Comparación por prefijo.** `path.startswith(route)` puede conceder permisos a
   rutas que solo comparten el inicio (por ejemplo, `/cartografia` empieza por
   `/cart`). Hoy no existen esas rutas, pero conviene comparar por segmento.
2. **Documentación pública en producción.** `/docs` y `/openapi.json` están en
   `PUBLIC_ROUTES`. Si se desea ocultarlos, condicionarlos a
   `ENVIRONMENT != "production"`.
3. **`/logout` público.** No exige token; el cierre de sesión efectivo depende de
   la implementación del endpoint y de la expiración/rotación del refresh token.
4. **Respuesta 401 por falta de permiso.** El middleware usa 401 también cuando el
   token es válido pero el rol no tiene permiso; semánticamente correspondería
   403. Se documenta para evitar confusiones al probar la matriz.
5. **Reseñas solo para `user`.** El bloque de `/products/` se evalúa antes del
   bypass de `admin`, por eso `admin` y `company` reciben 403 en métodos que no
   son `GET`.
6. **`/products` sin barra final.** Solo `/products/...` y `/products/search`
   están cubiertos; una petición exacta a `/products` no entra en la regla
   pública.
