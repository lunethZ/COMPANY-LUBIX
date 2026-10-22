# Plan de Migración — LUBIX (v0)

> **Versión:** v0 (borrador inicial)
> **Documento complementario de:** [`BC-Implantacion.md`](./BC-Implantacion.md) y [`Ficha_Tecnica.md`](./Ficha_Tecnica.md)
> **Fecha:** 2026-10-18

## 1. Objetivo y alcance

Definir el procedimiento para migrar la base de datos y los archivos de LUBIX desde un entorno
**origen** hacia un entorno **destino** (por ejemplo, de una máquina de desarrollo a un servidor de
producción o entre versiones de esquema).

Alcance de esta v0:
- **Base de datos:** PostgreSQL 16 (esquema gestionado con Alembic).
- **Archivos:** objetos almacenados en MinIO.
- **Configuración:** variables de entorno (`.env`).

Fuera de alcance (v0): migración en caliente sin ventana de mantenimiento, replicación en vivo.

## 2. Entornos

| Rol | Descripción | Ejemplo |
|-----|-------------|---------|
| Origen | Sistema actual con los datos a mover | dev local |
| Destino | Sistema donde se consolidan los datos | staging / producción |

> Los puertos de referencia son los de `docker-compose.yml` (fuente de verdad):
> Frontend `5173`, Backend `8002→8000`, PostgreSQL `5435→5432`, MinIO API `9100→9000`,
> MinIO consola `9101→9001`.
> (El `README.md` usa otros puertos antiguos: `8001`, `9000`, `5434`.)

## 3. Inventario a migrar

| Elemento | Origen | Destino | Método |
|----------|--------|---------|--------|
| Esquema BD | PostgreSQL 16 | PostgreSQL 16 | Alembic (`upgrade head`) |
| Datos BD | PostgreSQL 16 | PostgreSQL 16 | `pg_dump` / `pg_restore` |
| Archivos (imágenes, certificados, logos) | MinIO | MinIO | `mc mirror` |
| Variables de entorno | `.env` | `.env` | copia manual (no versionar) |

## 4. Estrategia

1. **Esquema:** aplicar el estado de Alembic en destino (`alembic upgrade head`) para que el esquema
   coincida con la versión del código.
2. **Datos:** volcado lógico (`pg_dump -Fc`) en origen y restauración (`pg_restore`) en destino.
3. **Archivos:** espejado de buckets de MinIO con `mc mirror`.
4. **Ventana de mantenimiento:** origen en modo lectura durante el volcado final.

## 5. Procedimiento paso a paso

### 5.1 Preparación
```bash
# 1. Congelar cambios en origen (avisar a usuarios / modo mantenimiento)
# 2. Respaldar ANTES de migrar (ver Respaldo_v0.md)
docker compose exec postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/lubix_origen.dump
docker compose cp postgres:/tmp/lubix_origen.dump ./backups/
```

### 5.2 Esquema en destino
```bash
# Levantar servicios de destino
docker compose up -d postgres
# Aplicar migraciones (idea tomada de backend/start.sh)
docker compose exec backend alembic upgrade head
```

### 5.3 Datos
```bash
# Copiar el volcado al contenedor destino y restaurar
docker compose cp ./backups/lubix_origen.dump postgres:/tmp/
docker compose exec postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists --no-owner /tmp/lubix_origen.dump
```

### 5.4 Archivos (MinIO)
```bash
# Configurar alias de origen y destino
mc alias set origen   http://localhost:9100 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc alias set destino  http://DESTINO:9100   "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
# Espejar el bucket de LUBIX
mc mirror --overwrite origen/lubix destino/lubix
```

### 5.5 Configuración
- Copiar el `.env` ajustando `URL_DATABASE`, credenciales de MinIO y SMTP del destino.
- **Nunca** versionar el `.env` (ver reglas de seguridad en la Ficha Técnica).

## 6. Validación

- [ ] `docker compose exec backend alembic current` → misma revisión que origen.
- [ ] Conteos de tablas clave coinciden (`users`, `companies`, `products`, `orders`).
- [ ] Archivos accesibles (`GET /files/...`).
- [ ] Health checks OK: `GET /health/database` y `GET /health/internet`.
- [ ] Login de prueba y listado de productos en el frontend.

## 7. Rollback

Si la validación falla:
1. Detener el destino.
2. Restaurar el respaldo previo (ver `Respaldo_v0.md` §7).
3. `alembic downgrade` a la revisión anterior si aplica (solo si la migración es reversible).
4. Reponer el `.env` anterior.

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Volcado incompleto | Alto | Verificar tamaño/hash del `.dump` |
| Esquema desincronizado | Alto | `alembic current`/`upgrade head` y validar |
| Objetos faltantes en MinIO | Medio | `mc mirror` + verificación por conteo |
| Fuga de credenciales | Alto | No versionar `.env`; rotar secretos post-migración |

## 9. Pendientes para v1

- Script automatizado de migración (`.sh`/`.ps1`).
- Migración incremental / delta sin ventana completa.
- Validación automática post-migración (checksums).

---

*Documento v0 — sujeto a revisión.*
