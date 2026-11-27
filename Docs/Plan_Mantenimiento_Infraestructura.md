# Plan de mantenimiento de infraestructura, imágenes y servidor — LUBIX

**Actividad:** semana 8 · plan de mantenimiento (S8)
**Fecha de elaboración:** 2026-11-26
**Versión:** 1.0.0
**Documento relacionado:** [`Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md`](./Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`Seguridad_Servidor.md`](./Seguridad_Servidor.md) · [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md)

---

## 1. Objetivo y alcance

Definir cómo se mantiene LUBIX después de la entrega: el cronograma de actividades, el fin de soporte (EOL) de cada componente del stack, el escaneo de imágenes Docker con Trivy y la aplicación automática de parches de seguridad en el servidor.

Producción corre en **Render + Neon** (plataforma gestionada): el sistema operativo lo parchea el proveedor. El procedimiento de `unattended-upgrades` aplica al **modo servidor propio/VPS** descrito en [`Seguridad_Servidor.md`](./Seguridad_Servidor.md) y `docker-compose.prod.yml`.

## 2. Inventario del stack y fin de soporte (EOL)

Fechas verificadas el 2026-11-26 con las fuentes oficiales de cada proyecto; se revisan cada trimestre.

| Componente | Versión actual | Fin de soporte | Estado | Acción |
|---|---|---|---|---|
| Python (backend) | 3.13.5 (`render.yaml`) | 2029-10 | Vigente | Subir a 3.14 cuando Render la soporte y las dependencias validen |
| Node.js (imagen frontend) | 20 (`node:20-alpine`) | **2026-04-30** | **Vencido** | Migrar el Dockerfile a Node 24 LTS (CI ya usa 22) |
| Node.js (CI) | 22 (`ci.yml`) | 2027-04-30 | Vigente | Actualizar junto con la imagen |
| Debian (base backend) | 13 trixie (`python:3.13-slim`) | 2028-08 estándar · ~2030 LTS | Vigente | Reconstruir la imagen al salir la siguiente estable |
| Alpine (base frontend) | 3.23 (`node:20-alpine`) | ~2027-11 | Vigente | Se actualiza al migrar la imagen de Node |
| PostgreSQL (producción, Neon) | 16 | 2028-11-09 | Vigente | El proveedor gestiona el motor; planificar 17 después de esa fecha |
| PostgreSQL (CI) | `postgres:16` | 2028-11-09 | Vigente | Subir la etiqueta junto con producción |
| MinIO (`bitnamilegacy/minio`) | `latest` (legado) | Sin mantenimiento | **Sin soporte** | En migración a Cloudflare R2 / Backblaze B2; mientras tanto no exponer la consola públicamente |
| Render (PaaS) | — | Gestionado | Vigente | Revisar changelog y límites del plan trimestralmente |
| GitHub Actions | `ubuntu-latest` | Gestionado | Vigente | Fijar versiones de acciones al actualizar |
| Dependencias Python/npm | `requirements.txt`, `package-lock.json` | Por release | Vigente | Escaneo Trivy + `pip-audit`/`npm audit` en el ciclo mensual |

## 3. Cronograma de mantenimiento

Ventana de cambios: **domingos 22:00–00:00** con aviso de 48 h (ver `Plan_Actualizaciones…` §3.6).

| Frecuencia | Actividad | Responsable | Evidencia |
|---|---|---|---|
| Diario | Verificar `/health` y `/health/database`; revisar alertas y el respaldo automático de 6 h | Operación | Panel de Render · reportes de `pg_backup.py` |
| Semanal | Revisar el job **Security scan** (Trivy) y cerrar hallazgos nuevos | Calidad / backend | Pestaña Security · artefacto `trivy-*` |
| Mensual | Aplicar parches del sistema (VPS), revisar logs, `pip list --outdated`, `npm outdated` | Infraestructura | Salida de `unattended-upgrade --dry-run` · reportes |
| Trimestral | Revisar esta tabla EOL, actualizar imágenes base y `.trivyignore`, probar restauración | Infraestructura + calidad | `pg_backup.py verify` · commit de actualización |
| Semestral | Rotar credenciales (Neon, MinIO/S3, correo) y revisar CORS y secretos | Infraestructura | Registro de rotación |
| Anual | Revisar proveedores, costos y plan de continuidad | Líder técnico | Acta de revisión |

## 4. Escaneo de imágenes con Trivy

El workflow [`.github/workflows/security.yml`](../.github/workflows/security.yml) corre en cada *pull request*, en cada push a `main` y los lunes a las 03:00 UTC:

1. Construye `backend` y `frontend` localmente (`docker/build-push-action`, `load: true`).
2. Escanea con Trivy (`HIGH` y `CRITICAL`, `ignore-unfixed: true`) y publica SARIF en la pestaña **Security** y como artefacto.
3. **Bloquea el pipeline** si aparece un `CRITICAL` con parche disponible; las `HIGH` se reportan y se atienden en el ciclo mensual.

Excepciones: `.trivyignore` en la raíz, con una línea por CVE y su condición de salida.

**Resultado base (2026-11-26):** backend 0 CRITICAL / 6 HIGH; frontend 1 CRITICAL exceptuado (CVE-2026-59873, `tar` de `node:20-alpine`) / 39 HIGH. Evidencia en [`Evidencias/s8-mantenimiento/trivy-escaneo.txt`](./Evidencias/s8-mantenimiento/trivy-escaneo.txt).

Ejecución manual:

```bash
docker build -t lubix-backend:scan backend
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest \
  image --severity CRITICAL,HIGH --ignore-unfixed lubix-backend:scan
```

## 5. Parches automáticos del servidor (unattended-upgrades)

En producción (Render) los parches del sistema operativo los aplica el proveedor. Para el modo servidor propio/VPS, la configuración está versionada en [`deploy/unattended-upgrades/`](../deploy/unattended-upgrades/):

| Archivo | Función |
|---|---|
| `20auto-upgrades` | Activa la actualización diaria de índices y la instalación automática |
| `50unattended-upgrades` | Limita los parches a repositorios oficiales (seguridad y actualizaciones estables), sin reinicio automático |
| `install.sh` | Instala el paquete, copia la configuración, habilita el servicio y simula la ejecución |

Aplicación y verificación:

```bash
sudo ./deploy/unattended-upgrades/install.sh          # instala y simula
systemctl status unattended-upgrades                  # servicio activo
sudo unattended-upgrade --dry-run --debug             # qué aplicaría
tail -n 50 /var/log/unattended-upgrades/unattended-upgrades.log
```

El reinicio automático queda desactivado: si un parche lo requiere, se reinicia en la ventana del domingo. Prueba de la configuración en Debian 13: [`Evidencias/s8-mantenimiento/servidor-dry-run.txt`](./Evidencias/s8-mantenimiento/servidor-dry-run.txt).

## 6. Gestión de hallazgos y excepciones

| Severidad | Plazo de corrección | Tratamiento |
|---|---|---|
| CRITICAL | 7 días | Bloquea el pipeline; se corrige o se acepta como excepción justificada en `.trivyignore` con fecha de salida |
| HIGH | 30 días | Reporte en SARIF; se corrige en el ciclo mensual |
| Sin parche disponible | Revisión mensual | Se ignora en el escaneo (`ignore-unfixed`) y se vigila la publicación del parche |

## 7. Criterios de aceptación — «Hecho cuando»

- [x] **Imágenes escaneadas:** job `Security scan` en CI con reporte SARIF y artefacto, validado localmente el 2026-11-26.
- [x] **Servidor con parches automáticos:** configuración de `unattended-upgrades` versionada y probada en Debian 13 (modo VPS).
- [x] **Tabla de mantenimiento en el plan:** cronograma (§3) y tabla EOL (§2) incluidas y enlazadas desde el índice de documentación.
- [x] **Hallazgos registrados:** excepción `.trivyignore` documentada con condición de salida.

## 8. Referencias

- [`Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md`](./Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) — ciclo de actualización, ventanas y SLA.
- [`Seguridad_Servidor.md`](./Seguridad_Servidor.md) — endurecimiento del VPS (UFW, fail2ban, SSH).
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — despliegue en Render con Neon y almacenamiento S3.
- [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) — respaldos y restauración verificada.
- Calendarios oficiales de soporte: python.org, nodejs.org, postgresql.org, debian.org, alpinelinux.org.
