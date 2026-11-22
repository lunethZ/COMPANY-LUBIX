# Evidencia — Prueba de restauración de PostgreSQL

> **Proyecto:** LUBIX
> **Fecha (UTC):** 2026-11-19
> **Procedimiento:** [`Docs/Respaldo_v1_Operativo.md`](../Respaldo_v1_Operativo.md) §6.1
> **Comando:** `python scripts/pg_backup.py verify --file lubix_db_20261119T161808Z.dump.gpg`

## 1. Datos de la prueba

| Campo | Valor |
|-------|-------|
| Respaldo probado | `lubix_db_20261119T161808Z.dump.gpg` |
| SHA-256 del volcado original | `cb41901c0f85810846a6e6e4a5a5cb887ba44551d713a2e6e72b7233783523c1` |
| Origen | Docker Compose, servicio `postgres`, base `LUBIX` |
| Revisión Alembic de origen | `d1e2f3a4b5c6` |
| Imagen usada para restaurar | `postgres:16` (PostgreSQL 16.14, Debian) |
| Instancia de restauración | Contenedor Docker desechable, sin acceso a la base de origen |
| Resultado | **PASS** |
| Validaciones | **19/19 correctas** |
| Contenido restaurado | 16 tablas, 79 filas |
| Duración | 12.03 s |
| Reporte generado | `backups/reports/restore-test_20261119T162113Z.json` y `.md` |

## 2. Validaciones ejecutadas

| Validación | Esperado | Obtenido | Resultado |
|------------|----------|----------|-----------|
| SHA-256 del volcado descifrado | `cb4190…23c1` | `cb4190…23c1` | OK |
| `pg_restore` | Sin errores | Sin errores | OK |
| Tablas | 16 | 16 | OK |
| Filas totales | 79 | 79 | OK |
| Revisión Alembic | `d1e2f3a4b5c6` | `d1e2f3a4b5c6` | OK |

Conteo por tabla (todas coinciden):

| Tabla | Filas | Tabla | Filas |
|-------|-------|-------|-------|
| `addresses` | 0 | `order_items` | 9 |
| `alembic_version` | 1 | `orders` | 5 |
| `cart_items` | 0 | `pqrs` | 3 |
| `carts` | 4 | `products` | 9 |
| `catalog` | 10 | `refreshToken` | 11 |
| `company` | 3 | `reviews` | 3 |
| `event_codes` | 3 | `roles` | 3 |
| `favorites` | 4 | `users` | 11 |

## 3. Alcance y limitación

La prueba se ejecutó en un **PostgreSQL aislado y desechable** levantado por el propio
script (`verify`), no sobre la base de origen. Esto demuestra que el respaldo se descifra,
se restaura y conserva el contenido, pero no sustituye la prueba formal en un equipo
distinto.

Para cerrar la evidencia "en otra máquina":

1. Copiar a la máquina destino el `.dump.gpg`, el `.manifest.json` y el `.sha256`.
2. Ejecutar `python scripts/pg_backup.py verify --file <respaldo>.dump.gpg` allí.
3. Adjuntar el nuevo reporte `backups/reports/restore-test_<fecha>.{json,md}`.

## 4. Registro de ejecución en la máquina destino

| Campo | Valor |
|-------|-------|
| Fecha y hora (UTC) | |
| Equipo / hostname | |
| Responsable | |
| Respaldo probado | |
| Resultado (`PASS`/`FAIL`) | |
| Validaciones correctas | |
| Ruta del reporte | |
| Observaciones | |
