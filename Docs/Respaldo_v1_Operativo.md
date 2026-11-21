# Respaldo y Restauración de PostgreSQL — LUBIX (v1 operativa)

> **Versión:** v1
> **Reemplaza a:** [`Respaldo_v0.md`](./Respaldo_v0.md) para el respaldo de base de datos.
> **Documentos relacionados:** [`BC-Implantacion.md`](./BC-Implantacion.md), [`Plan_Migracion_v0.md`](./Plan_Migracion_v0.md), [`RNF-009 — Recuperación ante fallos.md`](./RNFs/RNF-009%20—%20Recuperación%20ante%20fallos.md)
> **Implementación:** [`scripts/pg_backup.py`](../scripts/pg_backup.py)

## 1. Objetivo

Definir el procedimiento **operativo, cifrado y verificable** para respaldar PostgreSQL en
LUBIX y demostrar que el respaldo se puede restaurar en otra máquina.

El script cubre la base de datos. Los archivos de MinIO y la configuración se respaldan
según [`Respaldo_v0.md`](./Respaldo_v0.md) §5.2 y §5.3.

## 2. Qué hace el script

`scripts/pg_backup.py` implementa cuatro operaciones:

| Comando | Acción |
|---------|--------|
| `backup` | `pg_dump -Fc`, cifrado simétrico GPG AES-256, SHA-256, manifiesto con conteos por tabla y retención. |
| `restore` | Descifra, verifica checksums y restaura en un contenedor, servicio Compose o DSN externo. |
| `verify` | **Prueba real de restauración:** levanta un PostgreSQL desechable, restaura y compara tablas, filas y revisión de Alembic. |
| `decrypt` / `list` | Descifrado manual controlado y listado de respaldos. |

Cada respaldo genera tres archivos:

```text
backups/db/lubix_db_YYYYmmddTHHMMSSZ.dump.gpg            # volcado cifrado
backups/db/lubix_db_YYYYmmddTHHMMSSZ.dump.gpg.sha256     # checksum del archivo cifrado
backups/db/lubix_db_YYYYmmddTHHMMSSZ.manifest.json       # metadatos, hashes y conteos
```

El manifiesto es la pieza clave para la prueba en otra máquina: guarda el SHA-256 del
volcado original, el número de filas por tabla y la revisión de Alembic. Así la máquina de
restauración **no necesita acceso al servidor de origen** para validar.

## 3. Requisitos

- Python 3.9 o superior.
- GPG (GnuPG). En Linux: `sudo apt install gnupg`. En Windows: Git for Windows ya incluye
  `gpg` en `C:\Program Files\Git\usr\bin\gpg.exe`; el script lo detecta automáticamente.
- Docker con Compose para el modo local (`docker compose`).
- Para respaldar un PostgreSQL gestionado (Neon/Supabase) o restaurar por DSN: cliente
  `pg_dump`/`psql`/`pg_restore` de PostgreSQL 16 o superior.
- El script no requiere paquetes de Python adicionales.

## 4. Frase de paso y gestión de llaves

El respaldo se cifra con una frase de paso simétrica. Sin ella **no se puede recuperar**.

1. Genera una frase larga (mínimo 32 caracteres) y guárdala en un gestor de secretos.
2. No la guardes en el mismo equipo ni en la misma carpeta que los respaldos.
3. En producción usa un archivo con permisos restringidos:

   ```bash
   sudo install -d -m 700 /etc/lubix
   printf '%s' 'FRASE_DE_PASO_LARGA_Y_UNICA' | sudo tee /etc/lubix/backup.passphrase >/dev/null
   sudo chmod 600 /etc/lubix/backup.passphrase
   ```

4. El script acepta la frase por cuatro vías, en este orden:
   - `--passphrase-file RUTA`
   - variable de entorno `BACKUP_PASSPHRASE_FILE`
   - variable de entorno `BACKUP_PASSPHRASE`
   - o solicitud interactiva si se ejecuta en una terminal.

> Si se pierde la frase de paso, los respaldos son irrecuperables. Si se sospecha fuga,
> rota la frase: los respaldos nuevos usarán la nueva y los antiguos conservarán la anterior.

## 5. Respaldo

### 5.1 Desde Docker Compose (entorno local o servidor con Compose)

```bash
# Linux/macOS
export BACKUP_PASSPHRASE_FILE=/etc/lubix/backup.passphrase
python3 scripts/pg_backup.py backup --retention-days 30
```

```powershell
# Windows PowerShell
$env:BACKUP_PASSPHRASE_FILE = 'C:\ProgramData\Lubix\backup.passphrase'
backend\.venv\Scripts\python.exe scripts\pg_backup.py backup --retention-days 30
```

El script lee `POSTGRES_USER` y `POSTGRES_DB` desde `.env` y ejecuta `pg_dump` dentro del
servicio `postgres`. También verifica el cifrado descifrando el archivo recién creado y
comparando su SHA-256 antes de darlo por válido.

### 5.2 Desde un PostgreSQL gestionado (Neon / Supabase / Render)

```bash
export BACKUP_PASSPHRASE_FILE=/etc/lubix/backup.passphrase
python3 scripts/pg_backup.py backup \
  --source-dsn "$DATABASE_URL_UNPOOLED" \
  --retention-days 30
```

Usa la conexión **directa** (sin pooler) y codifica la contraseña del DSN si contiene
caracteres especiales (`@`, `:`, `/`, `#`, `%`).

### 5.3 Automatización cada 6 horas (RNF-009)

Linux con cron:

```cron
# /etc/cron.d/lubix-backup
SHELL=/bin/sh
0 */6 * * * lubix cd /opt/lubix && BACKUP_PASSPHRASE_FILE=/etc/lubix/backup.passphrase /usr/bin/python3 scripts/pg_backup.py backup --retention-days 30 >> /var/log/lubix-backup.log 2>&1
```

Windows con el Programador de tareas: crea una tarea cada 6 horas que ejecute:

```powershell
powershell -NoProfile -Command "Set-Location 'C:\ruta\al\proyecto'; $env:BACKUP_PASSPHRASE_FILE='C:\ProgramData\Lubix\backup.passphrase'; backend\.venv\Scripts\python.exe scripts\pg_backup.py backup --retention-days 30"
```

### 5.4 Retención y copia externa

`--retention-days N` elimina los respaldos con más de `N` días (archivo cifrado, manifiesto
y checksum). Con RNF-009 se recomienda:

| Tipo | Frecuencia | Retención |
|------|-----------|-----------|
| Automático | Cada 6 horas | 7 días |
| Semanal | Semanal | 4 semanas |
| Antes de migración/deploy | Puntual | Hasta validar el cambio |

Copia los archivos a almacenamiento externo. El respaldo ya está cifrado, pero la frase de
paso debe viajar por un canal separado:

```bash
rclone copy backups/db remoto:lubix-backups --include "*.gpg" --include "*.json" --include "*.sha256"
```

## 6. Restauración

> Antes de restaurar en producción, detén el backend para evitar escrituras durante el
> proceso y prueba siempre el respaldo con `verify`.

### 6.1 Prueba real de restauración en otra máquina (recomendado)

En la máquina de restauración solo se necesitan: Python, Docker, GPG, el script y los tres
archivos del respaldo. **No se necesita acceso a la base de datos de origen.**

```bash
# 1. Verifica la integridad del archivo recibido
sha256sum -c lubix_db_20261119T161808Z.dump.gpg.sha256

# En Windows:
# Get-FileHash .\lubix_db_20261119T161808Z.dump.gpg -Algorithm SHA256
# certutil -hashfile .\lubix_db_20261119T161808Z.dump.gpg SHA256

# 2. Configura la frase de paso
export BACKUP_PASSPHRASE_FILE=/ruta/segura/backup.passphrase

# 3. Ejecuta la prueba: crea un PostgreSQL desechable, restaura y valida
python3 scripts/pg_backup.py verify --file lubix_db_20261119T161808Z.dump.gpg
```

Windows:

```powershell
$env:BACKUP_PASSPHRASE_FILE = 'C:\ProgramData\Lubix\backup.passphrase'
backend\.venv\Scripts\python.exe scripts\pg_backup.py verify --file .\lubix_db_20261119T161808Z.dump.gpg
```

Qué valida `verify`:

1. SHA-256 del archivo cifrado contra el manifiesto.
2. Descifrado con GPG y SHA-256 del volcado plano.
3. `pg_restore` completo sin errores en una base vacía.
4. Existencia y número de filas de **cada tabla** contra el manifiesto.
5. Revisión de Alembic (`alembic_version`) contra la del origen.

Resultado: `PASS` o `FAIL`, código de salida `0`/`1`, y dos reportes en
`backups/reports/restore-test_<fecha>.json` y `.md` con la máquina, el contenedor, la
versión de PostgreSQL y el detalle de cada validación. Adjunta ese reporte como evidencia.

**Criterio de aceptación:** la prueba es válida solo si los 5 puntos anteriores pasan y el
reporte queda archivado con fecha, responsable y nombre del respaldo.

### 6.2 Restauración real en Docker Compose

```bash
# Respaldo previo del estado actual (obligatorio antes de --replace)
python3 scripts/pg_backup.py backup

# Restaurar (--replace limpia los objetos existentes; --validate compara contra el manifiesto)
python3 scripts/pg_backup.py restore \
  --file backups/db/lubix_db_20261119T161808Z.dump.gpg \
  --target-service postgres \
  --replace --validate --yes
```

### 6.3 Restauración en un contenedor existente

```bash
python3 scripts/pg_backup.py restore \
  --file backups/db/lubix_db_20261119T161808Z.dump.gpg \
  --target-container mi-postgres \
  --target-db lubix_restaurado \
  --target-user postgres \
  --create --validate --yes
```

### 6.4 Restauración en un PostgreSQL externo (DSN)

Requiere `pg_restore` local de PostgreSQL 16+:

```bash
# Evita dejar la contraseña en el historial de la terminal
export TARGET_DSN='postgresql://usuario:password@host:5432/lubix'
python3 scripts/pg_backup.py restore \
  --file backups/db/lubix_db_20261119T161808Z.dump.gpg \
  --target-dsn "$TARGET_DSN" \
  --replace --validate --yes
```

### 6.5 Validación funcional después de restaurar

- [ ] `GET /health/database` responde OK.
- [ ] Login con un usuario existente y navegación básica.
- [ ] Listado de productos y dashboard con datos.
- [ ] `docker compose exec backend alembic current` coincide con la revisión esperada.
- [ ] Archivos de MinIO accesibles (si se restauró también el almacenamiento).

## 7. Seguridad

- `backups/` está en `.gitignore`: los respaldos **nunca** se versionan.
- Los archivos se crean con permisos `600` donde el sistema lo permite.
- El manifiesto no contiene contraseñas; los DSN se registran con la contraseña enmascarada.
- La frase de paso no se escribe en logs ni en el manifiesto.
- Guarda el respaldo y la frase de paso en ubicaciones distintas.
- Rota la frase de paso y las credenciales de PostgreSQL tras un incidente.
- El cifrado es simétrico (AES-256 con GPG). Para requisitos de cumplimiento que exijan
  clave asimétrica, se puede migrar a `age` o GPG con clave pública en una v2.

## 8. Solución de problemas

| Síntoma | Causa / solución |
|---------|------------------|
| `El daemon de Docker no está disponible` | Inicia Docker Desktop / Docker Engine y reintenta. |
| `No se encontró GPG` | Instala GnuPG o define `--gpg-bin` / `GPG_BIN`. En Windows suele estar en Git for Windows. |
| `El checksum del respaldo cifrado NO coincide` | El archivo se corrompió durante la copia. Vuelve a copiarlo desde el origen. |
| `No hay frase de paso` | Define `BACKUP_PASSPHRASE_FILE`, `BACKUP_PASSPHRASE` o usa `--passphrase-file`. |
| `pg_restore: database ... is being restored` | Ya hay una restauración en curso o el backend está escribiendo. Detén el backend. |
| La restauración falla por objetos existentes | Usa una base vacía o `--replace` (previa copia de seguridad). |
| `pg_dump: permission denied` | El usuario debe tener permisos de lectura sobre todas las tablas. |
| `verify` falla en una tabla | Revisa el reporte JSON; el respaldo no es apto para recuperación. Genera uno nuevo. |

## 9. Evidencia de la prueba ejecutada

El **2026-11-19** se ejecutó una prueba real sobre el proyecto:

| Dato | Valor |
|------|-------|
| Respaldo | `lubix_db_20261119T161808Z.dump.gpg` |
| Origen | Docker Compose (`postgres`), BD `LUBIX` |
| Resultado | **PASS** |
| Validaciones | 19/19 correctas |
| Contenido | 16 tablas, 79 filas |
| Revisión Alembic | `d1e2f3a4b5c6` |
| PostgreSQL de restauración | 16.14 (contenedor desechable `postgres:16`) |
| Duración | 12.03 s |
| Reporte | `backups/reports/restore-test_20261119T162113Z.{json,md}` |

La prueba se ejecutó contra una instancia PostgreSQL **aislada y desechable**, sin acceso a
la base origen. Para cumplir formalmente la prueba "en otra máquina", repite
`pg_backup.py verify` en el equipo destino con los mismos tres archivos y archiva el nuevo
reporte. Ver [`Evidencias/Prueba_Restauracion_2026-11-19.md`](./Evidencias/Prueba_Restauracion_2026-11-19.md).

## 10. Pendientes (v2)

- [ ] Cifrado con clave asimétrica (`age` o GPG con clave pública) para no compartir la frase.
- [ ] Envío automático al almacenamiento externo y borrado local tras confirmar la copia.
- [ ] Alerta si el respaldo falla o no se ejecuta (RNF-009).
- [ ] Programar `verify` semanal y adjuntar el reporte al tablero de operación.
- [ ] Respaldo de MinIO con el mismo esquema de cifrado y verificación.
