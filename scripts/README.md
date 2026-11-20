# Scripts de respaldo — LUBIX

Herramienta operativa para respaldar, cifrar, restaurar y **probar** PostgreSQL.

- Código: [`pg_backup.py`](./pg_backup.py)
- Guía completa: [`Docs/Respaldo_v1_Operativo.md`](../Docs/Respaldo_v1_Operativo.md)
- Evidencia de prueba: [`Docs/Evidencias/Prueba_Restauracion_2026-11-19.md`](../Docs/Evidencias/Prueba_Restauracion_2026-11-19.md)

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
