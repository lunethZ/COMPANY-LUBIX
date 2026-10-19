# Plan de Respaldo — LUBIX (v0)

> **Versión:** v0 (borrador inicial)
> **Documento complementario de:** [`BC-Implantacion.md`](./BC-Implantacion.md) y [`Plan_Migracion_v0.md`](./Plan_Migracion_v0.md)
> **Fecha:** 2026-10-18

## 1. Objetivo y alcance

Definir qué se respalda en LUBIX, con qué frecuencia y cómo restaurarlo. En esta v0 el respaldo es
**manual** y documentado; la automatización queda como pendiente para v1.

## 2. Qué se respalda

| Elemento | Fuente | Criticidad |
|----------|--------|------------|
| Base de datos | PostgreSQL 16 (volumen `postgres_data`) | Alta |
| Archivos/objetos | MinIO (volumen `minio_data`) | Alta |
| Configuración | `.env` (raíz), `docker-compose.yml` | Media |
| Código | Repositorio Git | Media (ya versionado) |

## 3. Frecuencia y retención (propuesta v0)

| Tipo | Frecuencia | Retención | Cuándo |
|------|-----------|-----------|--------|
| Completo (BD + archivos) | Semanal | 4 semanas | fuera de horario |
| BD (incremental lógico) | Diario | 7 días | noche |
| Antes de cambios | Puntual | 1 por cambio | previo a migraciones/deploys |

> Valores de referencia (RNF-007 Crecimiento de datos, RNF-009 Recuperación ante fallos).

## 4. Herramientas

- **PostgreSQL:** `pg_dump` / `pg_restore` (formato custom `-Fc`).
- **MinIO:** cliente `mc` (`mc mirror`).
- **Empaquetado/cifrado:** `tar` + `gpg` (o zip con contraseña).

## 5. Procedimiento de respaldo (manual)

### 5.1 Base de datos
```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -Fc -f /tmp/lubix_$(date +%Y%m%d_%H%M%S).dump
docker compose cp postgres:/tmp/lubix_$(date +%Y%m%d_%H%M%S).dump ./backups/db/
```

### 5.2 Archivos (MinIO)
```bash
mc alias set lubix http://localhost:9100 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mirror --overwrite lubix/lubix ./backups/minio/
```

### 5.3 Configuración
```bash
# Guardar configuración (NO versionar; cifrar antes de mover)
cp .env ./backups/config/env.$(date +%Y%m%d)
cp docker-compose.yml ./backups/config/
```

## 6. Almacenamiento y cifrado

- Guardar los respaldos **fuera del host** de producción (almacenamiento secundario / nube).
- Cifrar los respaldos que contengan datos sensibles:
  ```bash
  tar -czf lubix_backup.tar.gz ./backups && gpg -c lubix_backup.tar.gz
  ```
- Aplicar retención (§3) y borrar respaldos vencidos.

## 7. Restauración

### 7.1 Base de datos
```bash
docker compose cp ./backups/db/<archivo>.dump postgres:/tmp/
docker compose exec postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists --no-owner /tmp/<archivo>.dump
```

### 7.2 Archivos
```bash
mc mirror --overwrite ./backups/minio/ lubix/lubix
```

### 7.3 Configuración
Restaurar el `.env` correspondiente y reiniciar:
```bash
docker compose up -d --force-recreate
```

## 8. Prueba de restauración

- [ ] Restaurar en un entorno de prueba (no producción).
- [ ] Verificar login y navegación básica.
- [ ] `GET /health/database` OK y archivos accesibles.
- [ ] Registrar fecha/hora y resultado de la prueba.

## 9. Pendientes para v1

- Automatizar con `cron` / Programador de tareas + script de rotación.
- Envío de respaldos a almacenamiento externo (S3/MinIO remoto).
- Alertas si un respaldo falla o no se ejecuta.
- Pruebas de restauración programadas.

---

*Documento v0 — sujeto a revisión.*
