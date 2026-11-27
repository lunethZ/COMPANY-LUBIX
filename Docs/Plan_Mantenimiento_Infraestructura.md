# Plan de mantenimiento de infraestructura, imágenes y servidor — LUBIX

**Actividad:** semana 8 · plan de mantenimiento (S8)
**Fecha de elaboración:** 2026-11-26
**Versión:** 1.1.0
**Revisión:** 2026-11-26 · se añade el bloque de mantenimiento preventivo y correctivo (§3.2–§3.8)
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

## 3. Cronograma y rutinas de mantenimiento

### 3.1 Cronograma

Ventana de cambios: **domingos 22:00–00:00** con aviso de 48 h (ver `Plan_Actualizaciones…` §3.6).

| Frecuencia | Actividad | Responsable | Evidencia |
|---|---|---|---|
| Diario | Verificar `/health` y `/health/database`; revisar alertas y el respaldo automático de 6 h | Operación | Panel de Render · reportes de `pg_backup.py` |
| Semanal | Revisar el job **Security scan** (Trivy) y cerrar hallazgos nuevos | Calidad / backend | Pestaña Security · artefacto `trivy-*` |
| Mensual | Aplicar parches del sistema (VPS), revisar logs, `pip list --outdated`, `npm outdated` | Infraestructura | Salida de `unattended-upgrade --dry-run` · reportes |
| Trimestral | Revisar esta tabla EOL, actualizar imágenes base y `.trivyignore`, probar restauración | Infraestructura + calidad | `pg_backup.py verify` · commit de actualización |
| Semestral | Rotar credenciales (Neon, MinIO/S3, correo) y revisar CORS y secretos | Infraestructura | Registro de rotación |
| Anual | Revisar proveedores, costos y plan de continuidad | Líder técnico | Acta de revisión |

### 3.2 Enfoque preventivo y correctivo

| Enfoque | Objetivo | Actividades principales | Detalle |
|---|---|---|---|
| **Preventivo** | Evitar fallos y mantener el stack soportado | Actualizar dependencias, respaldar la BD, rotar credenciales, limpiar logs/archivos y verificar cada despliegue | §3.3–§3.7 |
| **Correctivo** | Restablecer el servicio y eliminar la causa raíz | Hotfix con PR, rollback de despliegue, restauración de respaldo e informe de incidente | §3.8 |

Toda actividad queda registrada con fecha, responsable y evidencia (CI, reporte de respaldo, captura de `/health`, issue o PR).

### 3.3 Actualización de dependencias y del stack

| Fuente | Cadencia | Procedimiento |
|---|---|---|
| Dependabot (pip, npm, GitHub Actions, Docker) | Semanal (lunes 06:00) | Revisar notas, esperar CI + SonarCloud en verde y fusionar según la política de [`Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md`](./Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) §2.6 |
| Revisión manual de versiones | Mensual | `pip list --outdated`, `npm outdated` y changelog de Render, Neon y B2 |
| Actualización **major** | Por release planificado | Rama `deps/<paquete>-major`, suite completa, E2E y revisión de impacto |
| Vulnerabilidad crítica con parche | 72 h | PR prioritario `fix/security-*` y despliegue fuera de ventana si es necesario |

Verificación local antes de abrir el PR:

```bash
# Backend (suite completa con PostgreSQL de pruebas en 5433)
docker compose -f docker-compose.test.yml up -d
cd backend
python -m pip install -r requirements.txt
ruff check app
python -m pytest -q

# Frontend
cd ../frontend
npm ci
npm run lint
npm test
npm run build
```

La suite de backend requiere el PostgreSQL de `docker-compose.test.yml`; si no está disponible, ejecutar solo los módulos afectados con `--no-cov` y dejar la validación completa al CI. No se actualiza un paquete mayor sin E2E (`npm run test:e2e`) en verde.

### 3.4 Respaldos de base de datos

El procedimiento completo (cifrado GPG, manifiesto y restauración) está en [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) y se implementa con [`scripts/pg_backup.py`](../scripts/pg_backup.py).

| Rutina | Frecuencia | Comando / evidencia |
|---|---|---|
| Respaldo automático cifrado | Cada 6 h (RNF-009) | `pg_backup.py backup --source-dsn "$DATABASE_URL_UNPOOLED" --retention-days 30` |
| Respaldo puntual antes de migración o despliegue riesgoso | Por cambio | Mismo comando, sin esperar al ciclo automático |
| Verificación de restauración | Trimestral (recomendada semanal cuando el respaldo automático esté activo) | `pg_backup.py verify --file backups/db/<respaldo>.dump.gpg` y reporte en `backups/reports/` |
| Point-in-time recovery de Neon | Continuo, según el plan contratado | Consola de Neon → *Restore*; validar fecha/hora objetivo antes de ejecutar |

Reglas:

- Usar la conexión **directa** (`DATABASE_URL_UNPOOLED`), no el pooler, para `pg_dump`.
- La frase de paso (`BACKUP_PASSPHRASE_FILE`) vive fuera del repositorio y del equipo que guarda los respaldos; si se pierde, los respaldos son irrecuperables.
- Los archivos `.gpg`, `.sha256` y `.manifest.json` se copian a almacenamiento externo (por ejemplo `rclone` según `Respaldo_v1_Operativo.md` §5.4).
- `backups/` está ignorado por Git. La evidencia es el reporte JSON/Markdown de `verify`, no el volcado.
- Tras restaurar, ejecutar la validación funcional de `Respaldo_v1_Operativo.md` §6.5.

### 3.5 Rotación de credenciales y llaves

| Secreto | Dónde se configura | Rotación | Efecto al rotar |
|---|---|---|---|
| Contraseña de PostgreSQL/Neon | Neon + `URL_DATABASE`/`DATABASE_URL_UNPOOLED` | Semestral o ante incidente | Reinicio de conexiones; requiere redeploy |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` (B2/R2) | Panel del proveedor + Render | Semestral o ante exposición | Si la clave se filtra, rotar en **≤ 72 h** y revocar la anterior |
| `BREVO_API_KEY` / `RESEND_API_KEY` | Brevo/Resend + Render | Semestral | Los correos fallan hasta actualizar la variable |
| `SECRET_KEY` (JWT) | Render | Semestral o ante sospecha | Invalida todas las sesiones; hacerlo en ventana |
| Contraseña del administrador | Base de datos (hash bcrypt) | Semestral o ante incidente | Se resetea con un procedimiento controlado, no con el seed |
| `BACKUP_PASSPHRASE` | Gestor de secretos | Anual o ante exposición | Los respaldos nuevos usan la frase nueva; los antiguos conservan la anterior |

Procedimiento general:

1. Crear la credencial nueva en el proveedor con el **mínimo privilegio** necesario (B2: solo el bucket de LUBIX, lectura/escritura de objetos).
2. Actualizar la variable en Render sin pegar saltos de línea ni espacios; guardar y redesplegar.
3. Verificar `GET /health/storage` (debe responder `status: ok`) y un inicio de sesión real.
4. Confirmar lectura y escritura de archivos: subir un avatar o logo y abrir la imagen servida por `/files/...`.
5. Revocar o eliminar la credencial anterior **solo después** de validar la nueva.
6. Registrar en el control de cambios del equipo: fecha, responsable, secreto rotado y evidencia (sin escribir el valor).

Casos especiales:

- **Clave expuesta** (repositorio, captura, consola o chat): rotar de inmediato, revisar logs de acceso del proveedor y documentar el incidente como P1 de seguridad.
- **`SECRET_KEY`**: al cambiarla, todos los usuarios deben volver a iniciar sesión; comunicarlo antes si se hace en horario productivo.
- **Administrador inicial**: `ADMIN_DEFAULT` y `PASSWORD_DEFAULT` solo crean la cuenta si no existe. Para restablecer la contraseña se actualiza el hash bcrypt en `users` con autorización de un responsable, se verifica el inicio de sesión y se registra el cambio.

### 3.6 Limpieza de logs, archivos y almacenamiento

| Recurso | Qué revisar | Acción segura |
|---|---|---|
| Logs de Render | Errores 5xx, advertencias de almacenamiento, tamaño y antigüedad | Exportar o copiar lo necesario antes de que el proveedor los purgue; no registrar contraseñas, tokens ni datos personales |
| PostgreSQL/Neon | Crecimiento de tablas, conexiones e índices | Revisar métricas mensualmente; limpiar datos de prueba con respaldo previo y `DELETE` acotado; nunca borrar tablas en producción sin aprobación |
| Bucket B2/R2 | Archivos huérfanos (sin referencia en la BD), duplicados y temporales | Revisar mensualmente desde el panel; aplicar reglas de ciclo de vida solo a prefijos temporales. **No** eliminar `companies/*/certificates/` sin política de retención |
| Respaldos locales | Volúmenes en `backups/` | La retención la aplica `pg_backup.py --retention-days`; confirmar la copia externa antes de purgar |
| Entorno local/CI | Imágenes, caché de build y artefactos | `docker system df`, `docker image prune -f`, `docker builder prune -f`; borrar `test-results/`, `coverage/` y `dist/` regenerables |

La limpieza nunca se ejecuta sobre el filesystem efímero de Render como si fuera almacenamiento: las imágenes y certificados viven en el bucket S3.

### 3.7 Verificación posterior al despliegue

Checklist obligatoria después de cada despliegue a `main` (detalle en [`DEPLOYMENT.md`](./DEPLOYMENT.md) §7):

- [ ] Render marca el despliegue como **Live** y el servicio no está en *cold start*.
- [ ] `GET /health` responde `200` con `status: ok`.
- [ ] `GET /health/database` responde `200`.
- [ ] `GET /health/storage` responde `200` con `configured`, `reachable` y `bucket_exists` en `true`.
- [ ] Inicio de sesión de prueba (Usuario y Empresa) y carga del catálogo.
- [ ] Subida de una imagen (avatar, logo o producto) y apertura del archivo por `/files/...`.
- [ ] Un pedido y una PQRS de prueba se crean y consultan.
- [ ] Logs de los primeros 15 minutos sin errores 5xx sostenidos ni `SignatureDoesNotMatch`.
- [ ] CORS responde al dominio real del frontend.
- [ ] Si falla un criterio: rollback según §3.8 y registrar el incidente.

### 3.8 Mantenimiento correctivo y rollback

1. **Detectar y clasificar:** alerta, PQRS o revisión de logs; asignar severidad P1–P4 (`Plan_Actualizaciones…` §3.2).
2. **Mitigar primero:** si hay caída o pérdida de datos, restaurar el último despliegue bueno en Render → *Deploys* → *Redeploy* (§ rollback de [`DEPLOYMENT.md`](./DEPLOYMENT.md) §9) o restaurar respaldo verificado.
3. **Corregir en rama:** `fix/<tema>` desde `Develop`, prueba de regresión cuando aplique, PR con CI y Quality Gate en verde.
4. **Desplegar:** `Develop → main` con revisión aprobatoria; aplicar el checklist de §3.7.
5. **Cerrar:** confirmar con el usuario, actualizar FAQ si el error era visible y registrar causa raíz en GitHub Issues.
6. **Aprender:** para P1/P2, informe breve con línea de tiempo, causa, mitigación y acción preventiva en un plazo de 5 días hábiles.

No se ejecuta `alembic downgrade` en producción ni se usa `--force`/`--no-verify` como atajo. Si el fallo es de esquema, se restaura respaldo o se crea una migración de reversión revisada.

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
- [x] **Mantenimiento preventivo y correctivo documentado (§3.2–§3.8):** actualización de dependencias, respaldos, rotación de credenciales, limpieza de logs/archivos y verificación post-despliegue.
- [x] **Hallazgos registrados:** excepción `.trivyignore` documentada con condición de salida.
- [ ] **Evidencia de la primera ejecución:** reporte `pg_backup.py verify` y checklist post-despliegue firmados y archivados en `Evidencias/`.

## 8. Referencias

- [`Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md`](./Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) — ciclo de actualización, ventanas y SLA.
- [`Seguridad_Servidor.md`](./Seguridad_Servidor.md) — endurecimiento del VPS (UFW, fail2ban, SSH).
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — despliegue en Render con Neon y almacenamiento S3.
- [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) — respaldos y restauración verificada.
- Calendarios oficiales de soporte: python.org, nodejs.org, postgresql.org, debian.org, alpinelinux.org.

## 9. Control de cambios

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.1.0 | 2026-11-26 | Se añade el mantenimiento preventivo y correctivo (§3.2–§3.8): dependencias, respaldos, rotación de credenciales, limpieza y verificación post-despliegue | Equipo LUBIX |
| 1.0.0 | 2026-11-26 | Creación del plan de mantenimiento con cronograma, tabla EOL, Trivy y parches automáticos | Equipo LUBIX |
