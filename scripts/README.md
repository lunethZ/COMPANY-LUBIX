# Scripts operativos — LUBIX

Herramientas de operación: respaldo cifrado de PostgreSQL y creación de roles con mínimo privilegio.

- Respaldo: [`pg_backup.py`](./pg_backup.py)
- Guía completa: [`Docs/Respaldo_v1_Operativo.md`](../Docs/Respaldo_v1_Operativo.md)
- Evidencia de prueba: [`Docs/Evidencias/Prueba_Restauracion_2026-11-19.md`](../Docs/Evidencias/Prueba_Restauracion_2026-11-19.md)

## Roles de PostgreSQL

| Archivo | Uso |
|---|---|
| [`seguridad/roles_postgresql.sql`](./seguridad/roles_postgresql.sql) | PostgreSQL propio (Docker/local): crea `lubix_owner` (DDL/migraciones), `lubix_app` (solo DML para la API) y `lubix_backup` (solo lectura para respaldos) |
| [`seguridad/roles_postgresql_neon.sql`](./seguridad/roles_postgresql_neon.sql) | Neon: conserva el rol dueño del proyecto y crea solo `lubix_app` y `lubix_backup`; requiere reemplazar los placeholders de contraseña |

Ambos scripts son idempotentes y se ejecutan con el rol administrador correspondiente. El procedimiento completo está en [`Docs/Seguridad_Servidor.md`](../Docs/Seguridad_Servidor.md).

## Requisitos

- Python 3.9+
- GPG (GnuPG)
- Docker + Compose (modo local y `verify`)
- Cliente PostgreSQL 16+ solo si se usa `--source-dsn` o `--target-dsn`

No requiere `pip install`.

## Uso rápido

```bash
# Configurar la frase de paso (mejor en un archivo con permisos 600)
export BACKUP_PASSPHRASE_FILE=/etc/lubix/backup.passphrase

# Crear respaldo cifrado + manifiesto + checksum
python3 scripts/pg_backup.py backup --retention-days 30

# Listar respaldos
python3 scripts/pg_backup.py list

# Prueba real: restaura en un PostgreSQL desechable y valida contra el manifiesto
python3 scripts/pg_backup.py verify --file backups/db/lubix_db_YYYYmmddTHHMMSSZ.dump.gpg

# Restaurar en el PostgreSQL de Docker Compose (previa copia del estado actual)
python3 scripts/pg_backup.py restore \
  --file backups/db/lubix_db_YYYYmmddTHHMMSSZ.dump.gpg \
  --target-service postgres --replace --validate --yes

# Descifrar manualmente (solo si es imprescindible)
python3 scripts/pg_backup.py decrypt --file backups/db/lubix_db_YYYYmmddTHHMMSSZ.dump.gpg
```

En Windows:

```powershell
$env:BACKUP_PASSPHRASE_FILE = 'C:\ProgramData\Lubix\backup.passphrase'
backend\.venv\Scripts\python.exe scripts\pg_backup.py backup --retention-days 30
```

## Frase de paso

Se acepta, en este orden:

1. `--passphrase-file RUTA`
2. `BACKUP_PASSPHRASE_FILE`
3. `BACKUP_PASSPHRASE`
4. Solicitud interactiva en terminal

Sin la frase de paso los respaldos son irrecuperables. No la guardes junto al respaldo.

## Salidas

```text
backups/db/lubix_db_<fecha>.dump.gpg
backups/db/lubix_db_<fecha>.dump.gpg.sha256
backups/db/lubix_db_<fecha>.manifest.json
backups/reports/restore-test_<fecha>.json
backups/reports/restore-test_<fecha>.md
```

`backups/` está excluido de Git.

## Códigos de salida

- `0`: operación y validaciones correctas.
- `1`: error controlado o validación fallida.
- `130`: cancelado por el usuario.
