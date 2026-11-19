# Seguridad del servidor — LUBIX (P4-S5)

> Documento complementario de [`BC-Implantacion.md`](./BC-Implantacion.md) §6.
> Tarea: firewall, acceso SSH, roles de PostgreSQL con mínimo privilegio y matriz
> de usuarios y roles.
> Criterio de "hecho": **aplicado y documentado en el plan**.

| Campo | Valor |
|-------|-------|
| Sistema | LUBIX — Plataforma de Gestión Empresarial |
| Repositorio | https://github.com/lunethZ/COMPANY-LUBIX.git |
| Entorno actual | Render (Oregon) + Neon (PostgreSQL gestionado) |
| Versión del documento | 1.2.0 |
| Fecha | 2026-11-18 |
| Autor | Equipo LUBIX |
| Evidencia | [`Docs/evidencias/p4-s5-seguridad.txt`](./evidencias/p4-s5-seguridad.txt) |

---

## 1. Alcance y decisión de infraestructura

El enunciado de S5 pide `UFW` y `sshd`, controles que **solo existen en un
servidor Linux con IP pública**. El despliegue vigente es **Render + Neon**
(`render.yaml`: `lubix-api` y `lubix-frontend`), donde el proveedor administra
firewall, sistema operativo y acceso: no hay shell de host ni daemon SSH que
configurar.

Por eso este documento separa dos cosas:

1. **Aplicable hoy en Render + Neon:** roles de PostgreSQL con mínimo privilegio,
   secretos, superficie de exposición y matriz de usuarios y roles.
2. **Aplicable solo en un VPS:** UFW, SSH por llave y fail2ban. Quedan listos como
   **anexo A** (procedimiento reproducible) a la espera de la decisión del docente
   sobre si S5 se adapta a la plataforma gestionada.

> Esta rama **no modifica el §6 de `BC-Implantacion.md`**. Cuando el equipo y el
> docente acuerden el enfoque, ese apartado se enlaza con este documento.

### 1.1 Estado de los controles

| Control | Dónde se aplica | Estado |
|---------|-----------------|--------|
| Firewall perimetral | Render / Neon (gestionado) | No configurable por el equipo; no aplica UFW |
| Acceso administrativo | Paneles de Render y Neon | MFA de la cuenta; no hay SSH de host |
| Protección de fuerza bruta (SSH) | VPS | No aplica en Render (anexo A) |
| Roles de PostgreSQL | Neon | **Aplicado** el 2026-11-18 y verificado (sección 4) |
| Matriz de usuarios y roles | Aplicación | **Documentada** (sección 5) |
| Secretos | Variables de entorno de Render (`sync: false`) | Verificado: no hay credenciales en el repo |
| Puertos de base de datos | Neon | No expuestos; solo TLS público del endpoint |

Los roles se aplicaron en la rama `production` de Neon el 2026-11-18. La
verificación se hizo con una conexión real como `lubix_app`: lectura e `INSERT`
permitidos; `CREATE`, DDL y acceso a `alembic_version` bloqueados.

La API todavía se conecta con el rol dueño: el cambio de `URL_DATABASE` en
Render está pendiente porque el servicio `lubix-api` pertenece a otra cuenta y
hace falta el dueño del servicio o una invitación al equipo. Este documento no
declara ese cambio como aplicado.

---

## 2. Entorno verificado

| Elemento | Valor | Comprobación |
|----------|-------|--------------|
| API | `https://lubix-api.onrender.com` | `GET /health` responde 200 |
| Frontend | `https://lubix-frontend.onrender.com` | Responde 200 |
| Servicio backend | `lubix-api` (`rootDir: backend`, `startCommand: bash start.sh`) | `render.yaml` |
| Servicio frontend | `lubix-frontend` (sitio estático, `VITE_API_URL` al API) | `render.yaml` |
| Base de datos | Neon, cadena pooled para runtime y directa para migraciones | `render.yaml` + `Connection.py` |
| Migraciones | `alembic upgrade head` al arrancar (`backend/start.sh`) | Código del repo |

Render inyecta `PORT`; `start.sh` lo usa y no se fija en `render.yaml`.

---

## 3. Dependencias previas

| Dependencia | ¿Obligatoria? | Nota |
|-------------|---------------|------|
| Acceso al proyecto de Neon con el rol dueño | Sí | Es quien ejecuta el script y quien migra |
| Acceso al panel de Render del servicio `lubix-api` | Sí | Para cambiar `URL_DATABASE` y redesplegar |
| `openssl` (Git Bash en Windows) | Sí | Genera contraseñas hex de 24 bytes (48 caracteres) |
| Cliente `psql` | No | El script se puede pegar en el editor SQL de Neon |
| VPS Ubuntu | Solo para el anexo A | No es necesario para los roles ni la matriz |

---

## 4. Roles de PostgreSQL en Neon

### 4.1 Modelo de roles

Neon no permite superusuario. El rol dueño del proyecto (por defecto
`neondb_owner`) es miembro de `neon_superuser` y puede crear roles; los roles
creados **por SQL** no heredan `neon_superuser`, que es justo lo que se busca.

| Rol | Uso | Superusuario | DDL | DML | Límite de conexiones |
|-----|-----|:------------:|:---:|:---:|:--------------------:|
| Rol dueño del proyecto (`neondb_owner`) | Migraciones Alembic (`DATABASE_URL_UNPOOLED`) | No | Sí | Sí | — |
| `lubix_app` | API FastAPI en ejecución (`URL_DATABASE`) | No | **No** | Sí | 20 |
| `lubix_backup` | `pg_dump` / respaldos | No | No | Solo `SELECT` | 3 |

Reglas:

- La API **nunca** usa el rol dueño ni `neon_superuser`.
- `lubix_app` no crea tablas, no crea esquemas y no puede tocar
  `alembic_version`.
- Los privilegios por defecto se definen **sin `FOR ROLE`**: aplican a las tablas
  que cree el rol que ejecuta el script. Por eso debe ejecutarse con el mismo rol
  de `DATABASE_URL_UNPOOLED`.
- Las contraseñas son hexadecimales (48 caracteres, 192 bits), sin caracteres que
  rompan una URL.

### 4.2 Generar las contraseñas

```bash
openssl rand -hex 24   # contraseña de lubix_app
openssl rand -hex 24   # contraseña de lubix_backup
```

Guardarlas en el gestor de contraseñas del equipo. No se escriben en el repo ni
en este documento.

### 4.3 Ejecutar el script (recomendado: editor SQL de Neon)

1. Entrar a la consola de Neon y abrir **SQL Editor** del proyecto de LUBIX.
2. Abrir [`scripts/seguridad/roles_postgresql_neon.sql`](../scripts/seguridad/roles_postgresql_neon.sql).
3. Reemplazar `__APP_PASSWORD__` y `__BACKUP_PASSWORD__` por las contraseñas
   generadas. El script aborta si quedan placeholders.
4. Verificar que la sesión usa el rol dueño del proyecto:

   ```sql
   SELECT current_user, current_database(), rolsuper, rolcreaterole
   FROM pg_roles WHERE rolname = current_user;
   ```

5. Ejecutar todo el script. Al final imprime tres resultados:
   atributos de los roles, membresías de `neon_superuser` (debe estar vacío) y
   privilegios de `lubix_app` por tabla.
6. Guardar esa salida como evidencia (sección 7).

> **Contraseñas e historial.** El editor SQL conserva las consultas ejecutadas.
> Para que la contraseña definitiva no quede en ese historial, se usaron
> contraseñas temporales en el script y, al terminar, se restablecieron en
> **Postgres database → Roles → Reset password**. Las temporales dejan de ser
> válidas en ese momento. Con `psql` local ese riesgo no existe y se puede usar
> la contraseña definitiva directamente.

> Si `lubix_app` o `lubix_backup` se crearon antes desde la consola de Neon,
> heredaron `neon_superuser`. El script intenta retirarlo; si no tiene permiso,
> muestra un `WARNING`: en ese caso se elimina el rol y se vuelve a crear con el
> script (creado por SQL no hereda privilegios de administrador).

### 4.4 Alternativa con `psql`

`psql` no está instalado en la estación actual; el editor SQL evita instalarlo.
Si se usa `psql` desde otra máquina:

```bash
APP_PW="$(openssl rand -hex 24)"
BACKUP_PW="$(openssl rand -hex 24)"

sed -e "s/__APP_PASSWORD__/$APP_PW/g" \
    -e "s/__BACKUP_PASSWORD__/$BACKUP_PW/g" \
    scripts/seguridad/roles_postgresql_neon.sql > /tmp/roles_neon.sql

psql "postgresql://ROL_DUENO:CLAVE@ep-XXXX.REGION.aws.neon.tech/neondb?sslmode=require" \
  -v ON_ERROR_STOP=1 -f /tmp/roles_neon.sql

rm -f /tmp/roles_neon.sql
```

Usar la cadena **directa** (sin `-pooler`) del rol dueño. El pooler en modo
transacción no es fiable para DDL ni para `ALTER DEFAULT PRIVILEGES`.

### 4.5 Conectar la API con el rol de mínimo privilegio

En el panel de Neon, **Connect** permite copiar dos cadenas del mismo proyecto:

| Variable de Render | Rol | Pooler | Uso |
|--------------------|-----|:------:|-----|
| `URL_DATABASE` | `lubix_app` | Sí (`-pooler`) | Runtime de FastAPI |
| `DATABASE_URL_UNPOOLED` | Rol dueño | No | Migraciones Alembic |

Forma esperada (añadir el driver que usa SQLAlchemy):

```text
URL_DATABASE=postgresql+psycopg2://lubix_app:CLAVE_APP@ep-XXXX-pooler.REGION.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql+psycopg2://ROL_DUENO:CLAVE_OWNER@ep-XXXX.REGION.aws.neon.tech/neondb?sslmode=require
```

`DB_SSL_MODE=require` ya está definido en `render.yaml`. `Connection.py` agrega
`sslmode=require` si falta y prioriza `DATABASE_URL_UNPOOLED` para Alembic.

### 4.6 Orden de despliegue

1. Ejecutar el script en Neon (sección 4.3).
2. Verificar los resultados (sección 4.7).
3. En Render, cambiar **solo** `URL_DATABASE` a la cadena pooled de `lubix_app`.
   Mantener `DATABASE_URL_UNPOOLED` con el rol dueño.
4. Redesplegar `lubix-api` (Manual Deploy o push a `main`, según `autoDeploy`).
   `start.sh` ejecuta `alembic upgrade head` con el rol dueño.
5. Volver a ejecutar el script **solo con las contraseñas vigentes** (nunca con
   un archivo que contenga contraseñas temporales ya rotadas). Esto revoca
   `alembic_version` si la tabla ya existía y recalcula privilegios sobre las
   tablas del primer despliegue.
6. Probar `GET /health` y un endpoint de lectura de la aplicación.

> En el despliegue actual, los pasos 3 a 6 están pendientes: el servicio
> `lubix-api` de Render pertenece a otra cuenta. Los roles ya están aplicados y
> verificados; falta que el dueño del servicio actualice `URL_DATABASE` con la
> cadena pooled de `lubix_app`.

> Si se cambia `URL_DATABASE` antes de crear los roles, Render fallará al
> conectar. Respetar el orden.

### 4.7 Verificación

```sql
-- Atributos: sin superusuario ni creación de bases/roles
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('lubix_app', 'lubix_backup')
ORDER BY rolname;

-- Debe devolver 0 filas
SELECT m.member::regrole AS rol
FROM pg_auth_members m
JOIN pg_roles g ON g.oid = m.roleid
WHERE g.rolname = 'neon_superuser'
  AND m.member::regrole::text IN ('lubix_app', 'lubix_backup');

-- false: la API no puede crear objetos
SELECT has_schema_privilege('lubix_app', 'public', 'CREATE') AS puede_crear;

-- true / true: lee y escribe datos (sustituir users por una tabla existente)
SELECT has_table_privilege('lubix_app', 'public.users', 'SELECT') AS lee,
       has_table_privilege('lubix_app', 'public.users', 'INSERT') AS escribe;

-- false: la API no toca el control de versiones de Alembic
SELECT has_table_privilege('lubix_app', 'public.alembic_version', 'SELECT') AS lee_alembic;

-- true / false: el respaldo solo lee
SELECT has_table_privilege('lubix_backup', 'public.users', 'SELECT') AS backup_lee,
       has_table_privilege('lubix_backup', 'public.users', 'DELETE') AS backup_borra;
```

Si `users` todavía no existe (primer despliegue), usar cualquier tabla listada
en `pg_tables` con `schemaname = 'public'`.

---

## 5. Matriz de usuarios y roles

La matriz completa (aplicación y PostgreSQL) está en
[`Docs/Matriz_Usuarios_Roles.md`](./Matriz_Usuarios_Roles.md).

Resumen de la aplicación, definida en
`backend/app/middleware/AuthMiddleware.py` (`PUBLIC_ROUTES` y
`ROLES_PERMISSIONS_ROUTERS`):

| Ruta / módulo | Público | `user` | `company` | `admin` |
|---------------|:-------:|:------:|:---------:|:-------:|
| `/auth/*` (login, registro, recuperación, refresh, logout) | Sí | — | — | — |
| `/health`, `/health/database`, `/health/internet` | Sí | — | — | — |
| `GET /products*`, `GET /files/*`, `/docs`, `/openapi.json` | Sí | — | — | — |
| `POST/PUT/PATCH/DELETE /products*` (reseñas) | No | Sí | No (403) | No (403) |
| `/cart*` | No | Sí | No | Sí (bypass) |
| `/pqrs*` | No | Sí | Sí | Sí |
| `/user/*` | No | Sí | No | Sí (bypass) |
| `/company/dashboard*`, `/company/products*`, `/company/orders` | No | No | Sí | Sí (bypass) |
| `/admin/*` | No | No | No | Sí |

Roles de aplicación creados por el seed: `user`, `company`, `admin`
(`backend/app/utils/seed.py`).

---

## 6. Matriz de roles de PostgreSQL

| Objeto | Rol dueño | `lubix_app` | `lubix_backup` |
|--------|:---------:|:-----------:|:--------------:|
| Base de datos | OWNER | CONNECT | CONNECT |
| Esquema `public` | OWNER, CREATE | USAGE | USAGE |
| Tablas | OWNER (DDL/DML) | SELECT, INSERT, UPDATE, DELETE | SELECT |
| Secuencias | OWNER | USAGE, SELECT | USAGE, SELECT |
| `alembic_version` | OWNER | Nada | SELECT |
| Crear tablas/esquemas | Sí | **No** | **No** |
| Se usa en | Migraciones | Runtime de la API | Respaldos |

---

## 7. Evidencia de aplicación

La plantilla está en
[`Docs/evidencias/p4-s5-seguridad.txt`](./evidencias/p4-s5-seguridad.txt).

Para completarla:

1. Ejecutar el script en el editor SQL de Neon.
2. Copiar los tres resultados de la sección 4.7 a la plantilla, sin contraseñas.
3. Adjuntar una captura del panel de Render con `URL_DATABASE` y
   `DATABASE_URL_UNPOOLED` definidas (sin mostrar valores) y del `GET /health`
   respondiendo 200.
4. Anotar fecha, rol ejecutor y base de datos.

| Verificación | Resultado esperado | Obtenido (fecha) |
|--------------|--------------------|------------------|
| `lubix_app` sin `neon_superuser` | 0 filas | 0 filas (2026-11-18) |
| `lubix_app` crea tabla | `false` | `false`, error `42501` (2026-11-18) |
| `lubix_app` lee/escribe una tabla | `true` / `true` | `true` / `true` en `addresses` (2026-11-18) |
| `lubix_app` lee `alembic_version` | `false` | `false` (2026-11-18) |
| `lubix_backup` lee tablas | `true` | Otorgado por el script; verificación directa pendiente |
| `lubix_backup` borra en tablas | `false` | Sin `DELETE` por diseño |
| API con `URL_DATABASE` de `lubix_app` | `/health` 200 y lectura correcta | **Pendiente**: el servicio Render pertenece a otra cuenta |
| Migraciones con rol dueño | `alembic upgrade head` sin errores | Sin cambios; sigue usando `DATABASE_URL_UNPOOLED` |

---

## 8. Mantenimiento y rotación

- Rotar contraseñas de base de datos cada 90 días: generar nuevas, volver a
  ejecutar el script (hace `ALTER ROLE ... PASSWORD`) y actualizar la variable
  correspondiente en Render; redesplegar.
- Rotar `SECRET_KEY` invalida los JWT emitidos (los usuarios deben iniciar
  sesión de nuevo); planificarlo en ventana de mantenimiento.
- Revisar mensualmente los roles del proyecto en Neon y que no existan
  membresías de `neon_superuser` para `lubix_app` o `lubix_backup`.
- No abrir ni publicar conexiones directas a la base fuera de Neon.
- Los respaldos usan `lubix_backup` (solo lectura); ver `Respaldo_v0.md`.

---

## 9. Rollback

1. En Render, devolver `URL_DATABASE` a la cadena pooled del rol dueño y
   redesplegar. La API vuelve a funcionar con privilegios administrativos.
2. Para retirar los roles, primero revocar privilegios por defecto y sobre
   objetos (si no, `DROP ROLE` falla por dependencias). Sustituir `neondb` por el
   nombre real de la base:

   ```sql
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
     REVOKE ALL ON TABLES FROM lubix_app, lubix_backup;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
     REVOKE ALL ON SEQUENCES FROM lubix_app, lubix_backup;

   REVOKE ALL ON ALL TABLES IN SCHEMA public FROM lubix_app, lubix_backup;
   REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM lubix_app, lubix_backup;
   REVOKE ALL ON SCHEMA public FROM lubix_app, lubix_backup;
   REVOKE CONNECT ON DATABASE neondb FROM lubix_app, lubix_backup;

   DROP ROLE lubix_app;
   DROP ROLE lubix_backup;
   ```

3. No ejecutar `alembic downgrade` en producción sin respaldo previo.

---

## Anexo A. Alternativa en VPS (no aplicada)

Este anexo conserva el procedimiento para el caso de que el docente exija el
enunciado literal de S5. **No se ha ejecutado en la infraestructura actual.**

### A.1 SSH por llave

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -a 100 -C "lubix-vps" -f ~/.ssh/lubix_vps
cat ~/.ssh/lubix_vps.pub | ssh root@IP_DEL_SERVIDOR \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# En el servidor
adduser --gecos "" lubix
usermod -aG sudo lubix
install -d -m 700 -o lubix -g lubix /home/lubix/.ssh
install -m 600 -o lubix -g lubix /root/.ssh/authorized_keys /home/lubix/.ssh/authorized_keys

sudo tee /etc/ssh/sshd_config.d/00-lubix-hardening.conf > /dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 20
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

sudo sshd -t && sudo systemctl reload ssh
```

Probar en otra terminal **antes** de cerrar la sesión de root:

```bash
ssh -i ~/.ssh/lubix_vps lubix@IP_DEL_SERVIDOR "whoami"
```

### A.2 UFW y fail2ban

```bash
sudo apt update && sudo apt -y full-upgrade
sudo apt install -y ufw fail2ban unattended-upgrades

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp comment 'SSH'
# Solo cuando Caddy publique el dominio:
# sudo ufw allow 80,443/tcp comment 'HTTP/HTTPS'
sudo ufw --force enable
sudo ufw status verbose

sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF

sudo systemctl enable --now fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
sudo systemctl enable --now unattended-upgrades
```

### A.3 Docker sin puertos públicos

Docker publica puertos saltándose UFW. El perfil
[`docker-compose.prod.yml`](../docker-compose.prod.yml) los enlaza a
`127.0.0.1` (requiere Compose >= 2.24):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Comprobación desde otra máquina (debe fallar):

```powershell
Test-NetConnection IP_DEL_SERVIDOR -Port 5435   # TcpTestSucceeded : False
Test-NetConnection IP_DEL_SERVIDOR -Port 9100   # TcpTestSucceeded : False
```

### A.4 Roles en un PostgreSQL propio

En un servidor con superusuario se usa
[`scripts/seguridad/roles_postgresql.sql`](../scripts/seguridad/roles_postgresql.sql),
que además reasigna la propiedad de la base, del esquema y de los objetos:

```bash
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d lubix \
  -v owner_password="$OWNER_PW" \
  -v app_password="$APP_PW" \
  -v backup_password="$BACKUP_PW" \
  < scripts/seguridad/roles_postgresql.sql
```

Ejecutarlo antes de la primera migración y repetirlo después del primer arranque
para revocar `alembic_version`.
