# Guía de instalación local — LUBIX v1

**Reemplaza a:** `Docs/Instalacion_v0.md`
**Validada en:** simulacro de instalación del 2026-11-24 (`Docs/Evidencias/Simulacro_Instalacion_2026-11-24.md`)
**Alcance:** instalación local con Docker Compose. El despliegue en producción está en `Docs/DEPLOYMENT.md`.

---

## 1. Requisitos

| Herramienta | Versión mínima |
|---|---|
| Git | 2.40 |
| Docker Desktop | 24 (con Compose v2) |
| GnuPG | 2.2 (solo para respaldos) |
| Python | 3.10 (solo para respaldos) |

Puertos que deben estar libres: **8002**, **5173**, **5435**, **9100**, **9101** y **8081**.

## 2. Obtener el código

```bash
git clone https://github.com/lunethZ/COMPANY-LUBIX.git
cd COMPANY-LUBIX
```

La carpeta del clon se llama `COMPANY-LUBIX`; la guía v0 decía `mobil_lubix_autentication`.

## 3. Configurar `.env`

```bash
cp .env.example .env
```

Editar `.env` y completar, como mínimo:

| Variable | Valor sugerido |
|---|---|
| `POSTGRES_USER` | `lubix` |
| `POSTGRES_PASSWORD` | contraseña local |
| `POSTGRES_DB` | `lubix` |
| `URL_DATABASE` | `postgresql+psycopg2://lubix:<misma contraseña>@postgres:5432/lubix` |
| `SECRET_KEY` | cadena aleatoria larga |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | credenciales locales |
| `RUN_SEED` | `true` en el primer arranque |

`URL_DATABASE` debe repetir exactamente el usuario, la contraseña y la base definidos arriba; si no coinciden, el backend no conecta aunque PostgreSQL esté arriba. Si la contraseña tiene caracteres especiales, codifícalos en la URL (`@` → `%40`).

`RUN_SEED=true` crea los roles y el administrador (`ADMIN_DEFAULT` / `PASSWORD_DEFAULT`). Después del primer arranque se puede dejar en `false`.

## 4. Levantar los servicios

```bash
docker compose up -d --build
docker compose ps
```

El primer build tarda varios minutos. Servicios esperados:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8002 |
| Documentación de la API | http://localhost:8002/docs |
| Consola de MinIO | http://localhost:9101 |
| PostgreSQL | `localhost:5435` |
| Móvil (Expo) | http://localhost:8081 |

### MinIO en Windows con volumen nuevo

Si `docker compose ps` muestra `minio` en `Restarting`, revisar sus logs:

```bash
docker compose logs minio --tail 20
```

El mensaje `Unable to initialize backend: file access denied` indica que el volumen quedó con propietario `root` y la imagen corre como UID 1001. El backend funciona igual (solo advierte que no pudo verificar el bucket) y las subidas de archivos fallan. Solución: agregar `user: root` al servicio `minio` en `docker-compose.yml` o recrear solo ese servicio:

```bash
docker compose rm -sf minio
docker compose up -d minio
```

Si persiste, recrear el volumen con permisos correctos (`docker compose down` sin `-v` conserva datos; con `-v` los borra).

## 5. Verificar migraciones

El backend ejecuta `alembic upgrade head` al arrancar (`start.sh`). Para confirmar:

```bash
docker compose exec backend alembic current
```

Debe imprimir la última revisión con `(head)`. En la validación del 2026-11-24 fue `c9d8e7f6a5b4 (head)`.

## 6. Verificar la instalación

```bash
curl http://localhost:8002/health
curl http://localhost:8002/health/database
```

Respuestas esperadas:

```json
{"status":"ok","service":"lubix-api","environment":"development","database":"ok"}
{"Base de datos":"OK"}
```

Abrir http://localhost:5173 e iniciar sesión con el administrador del seed (`ADMIN_DEFAULT` / `PASSWORD_DEFAULT`). Si el correo de verificación no llega, el administrador del seed ya está activo y puede ingresar igual.

## 7. Respaldo y restauración

Los comandos están en `scripts/pg_backup.py` (requiere `gpg` y Python). La frase de paso debe guardarse en un archivo **fuera del repositorio**.

```bash
# Respaldo cifrado con manifiesto y checksums
python scripts/pg_backup.py backup --passphrase-file /ruta/segura/passphrase.txt

# Prueba real de restauración en un PostgreSQL desechable
python scripts/pg_backup.py verify \
  --file backups/db/lubix_db_<fecha>.dump.gpg \
  --passphrase-file /ruta/segura/passphrase.txt

# Restaurar sobre el servicio local (destruye los datos actuales)
python scripts/pg_backup.py restore \
  --file backups/db/lubix_db_<fecha>.dump.gpg \
  --passphrase-file /ruta/segura/passphrase.txt \
  --target-service postgres --replace --yes
```

El resultado esperado de `verify` es `PRUEBA DE RESTAURACIÓN EXITOSA (PASS)` con todas las validaciones en `OK`. Los reportes quedan en `backups/reports/`. El detalle operativo está en `Docs/Respaldo_v1_Operativo.md`.

## 8. Detener y limpiar

```bash
docker compose stop          # detiene sin borrar datos
docker compose down          # elimina contenedores y red, conserva volúmenes
docker compose down -v       # elimina también los volúmenes (borra la base local)
```

## 9. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| El backend reinicia sin conectar a la base | `URL_DATABASE` no coincide con `POSTGRES_*` | Alinear usuario, contraseña y base en `.env` |
| `minio` en bucle de reinicio | Permisos del volumen (D-03) | Ver §4 |
| `alembic` falla al arrancar | Migraciones con error o base inaccesible | `docker compose logs backend`; reintentar `docker compose exec backend alembic upgrade head` |
| Frontend sin datos | API caída o `VITE_API_URL` incorrecta | Verificar `/health`; el compose ya inyecta `http://localhost:8002` |
| Puerto ocupado | Otro stack de LUBIX corriendo | `docker compose -p <otro> stop` o cambiar el puerto en `docker-compose.yml` |

## 10. Fuera de alcance

- Despliegue en Render, GHCR y CI/CD: `Docs/DEPLOYMENT.md`.
- Instalación de la app móvil (Expo Go / build nativo): `mobile/README.md`.
- Instalación automatizada en un solo comando: pendiente para v2.
