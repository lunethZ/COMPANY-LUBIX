# Simulacro de instalación desde cero — LUBIX

**Documento asociado:** `Docs/BC-Implantacion.md` (§7.3 a §7.5) e `Docs/Instalacion_v1.md`
**Actividad:** semana 3 · simulacro de instalación (gate, T7-7)
**Fecha de ejecución:** 2026-11-24
**Versión instalada:** `main` (`2b85add`), clonada desde cero
**Resultado global:** **PASS con observaciones** (restauración verificada)

---

## 1. Objetivo

Comprobar que un instalador externo, siguiendo solo la documentación del repositorio, puede levantar el proyecto desde cero en una máquina limpia y restaurar un respaldo cifrado.

## 2. Entorno del simulacro

| Elemento | Detalle |
|---|---|
| Equipo | Windows 11 (10.0.26300), Docker Desktop 29.5.3, Docker Compose v5.1.4, GnuPG 2.4.8, Python 3.14 |
| Origen | Clon nuevo de `main` (`2b85add`) en carpeta distinta del repositorio de trabajo |
| Documentación usada | `Docs/Instalacion_v0.md`, `docker-compose.yml`, `.env.example`, `scripts/README.md` |
| Puertos | 8002 (API), 5173 (frontend), 5435 (PostgreSQL), 9100/9101 (MinIO), 8081 (móvil) |
| Evidencias | `Docs/Evidencias/simulacro-2026-11-24/` |

El simulacro lo ejecutó el facilitador en representación del equipo instalador, sin ayuda del equipo de desarrollo y sin conexión a la base de datos de producción.

## 3. Pasos, resultados y tiempos

| # | Paso | Resultado | Incidencia | Evidencia |
|---|---|---|---|---|
| 1 | Clonar `main` y entrar a la carpeta | OK | `Instalacion_v0.md` indica `cd mobil_lubix_autentication`, pero el clon se llama `COMPANY-LUBIX` | `Instalacion_v1.md` §2 |
| 2 | Crear `.env` desde `.env.example` con credenciales locales | OK | El ejemplo no advierte que la contraseña de PostgreSQL debe repetirse en `URL_DATABASE` | `Instalacion_v1.md` §3 |
| 3 | `docker compose up -d --build` | OK (aprox. 8 min la primera vez) | MinIO entra en bucle de reinicio: `Unable to initialize backend: file access denied` (D-03) | `servicios.txt`, `versiones.txt` |
| 4 | Migraciones | OK | `start.sh` ejecuta `alembic upgrade head` al arrancar; `alembic current` = `c9d8e7f6a5b4 (head)` | §4 de este documento |
| 5 | Verificación de servicios | OK | `/health` 200 con `database: ok`, `/health/database` 200, frontend 200 | `health-api.json`, `health-database.json`, `frontend.txt`, `frontend-local.png` |
| 6 | Respaldo cifrado con `scripts/pg_backup.py` | OK | 16 tablas, 5 filas, revisión Alembic `c9d8e7f6a5b4`, cifrado verificado | §5 |
| 7 | Prueba de restauración (`verify`) | OK | 19 validaciones correctas, `pg_restore` sin errores, mismos conteos | `restore-test_20261125T032935Z.md` |

## 4. Migraciones y servicios

```
$ docker exec <backend> alembic current
c9d8e7f6a5b4 (head)

$ curl -s localhost:8002/health
{"status":"ok","service":"lubix-api","environment":"development","database":"ok"}

$ curl -s localhost:8002/health/database
{"Base de datos":"OK"}

$ curl -s -o /dev/null -w "%{http_code}" localhost:5173/
200

$ curl -s -X POST localhost:8002/auth/login-user -d '{"email":"<admin por defecto>","password":"<PASSWORD_DEFAULT>"}'
200
```

El inicio de sesión con el administrador creado por el seed confirma que la base migrada y el backend local funcionan de punta a punta.

## 5. Respaldo y restauración

| Elemento | Detalle |
|---|---|
| Comando | `python scripts/pg_backup.py backup --passphrase-file <archivo fuera del repo>` |
| Archivo | `backups/db/lubix_db_20261125T032920Z.dump.gpg` + manifiesto + `.sha256` |
| Contenido | 16 tablas, 5 filas (roles y administrador del seed), Alembic `c9d8e7f6a5b4` |
| Verificación | `python scripts/pg_backup.py verify --file <respaldo> --passphrase-file <archivo>` |
| Resultado | **PASS**, 19 validaciones, contenedor desechable PostgreSQL 16.15, 6.76 s |

La frase de paso se generó aleatoriamente, se guardó fuera del repositorio y se eliminó al terminar. No se versionó el respaldo.

## 6. Defectos y observaciones

| ID | Paso | Descripción | Severidad | Acción |
|---|---|---|---|---|
| D-03 | 3 | Con un volumen nuevo, el contenedor `minio` reinicia en bucle porque la imagen `bitnamilegacy/minio` corre como UID 1001 y el volumen `/data` queda con propietario root en Docker Desktop para Windows (`file access denied`). El backend arranca igual y solo registra una advertencia al verificar el bucket | P3 | `Instalacion_v1.md` §4 incluye la solución (`user: root` en el servicio `minio` o volumen preparado con permisos); pendiente de aplicar al `docker-compose.yml` |
| O-01 | 1 | El clon se llama `COMPANY-LUBIX` y no `mobil_lubix_autentication` como indica `Instalacion_v0.md` | P4 | Corregido en `Instalacion_v1.md` §2 |
| O-02 | 4 | `alembic upgrade head` ya se ejecuta en el arranque del backend; el paso manual es idempotente y sirve como verificación | — | Documentado en `Instalacion_v1.md` §5 |

Solución aplicada durante el simulacro para D-03 (sin modificar el repositorio):

```bash
docker compose rm -sf minio
docker run -d --name s7-minio --user root \
  -p 9100:9000 -p 9101:9001 \
  -v <proyecto>_minio_data:/data \
  --network <proyecto>_default --network-alias minio \
  -e MINIO_ROOT_USER=$MINIO_ROOT_USER \
  -e MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD \
  bitnamilegacy/minio:latest server /data --console-address ":9001"
```

Tras aplicar la solución, el backend verificó el bucket `uploads` sin advertencias.

## 7. Conclusión

Un instalador externo completó los siete pasos del checklist de `Docs/BC-Implantacion.md` §7.4 usando solo la documentación del repositorio, y la restauración del respaldo cifrado pasó todas las validaciones. El gate se cumple con la observación D-03, ya resuelta en la guía `Docs/Instalacion_v1.md`.
