# Documento de Implantación — LUBIX

> Documento consolidado de implantación en producción.
> Documentos relacionados: [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`monitoreo.md`](./monitoreo.md) · [`Plan_QA_ISO25010.md`](./Plan_QA_ISO25010.md) · [`Respaldo_v0.md`](./Respaldo_v0.md) · [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) · [`Plan_Migracion_v0.md`](./Plan_Migracion_v0.md) · [`Instalacion_v0.md`](./Instalacion_v0.md) · [`Pruebas_No_Funcionales.txt`](./Pruebas_No_Funcionales.txt)

## Metadatos del documento

| Campo | Valor |
|-------|-------|
| Nombre del sistema | LUBIX — Plataforma de Gestión Empresarial |
| Repositorio | `lunethZ/COMPANY-LUBIX` |
| Repositorio (URL) | https://github.com/lunethZ/COMPANY-LUBIX.git |
| API en producción | https://lubix-api.onrender.com |
| Frontend en producción | https://lubix-frontend.onrender.com |
| Versión del sistema | 1.0.0 |
| Versión Backend | 1.1.1b |
| Versión Frontend | 0.1.0 |
| Versión del documento | 2.0.0 |
| Estado | Listo para firma |
| Fecha de creación | 2026-10-18 |
| Última actualización | 2026-11-24 |
| Autor(es) | @nacoooobit (responsable de implantación), @lunethZ, @WinStormX — equipo LUBIX |
| Revisado por | @lunethZ (calidad y backend) |
| Aprobado por | Pendiente de firma de @lunethZ y @juanpineda |
| Clasificación de la información | Interno |
| Entornos cubiertos | Desarrollo · Staging (CI) · Producción |
| Idioma | Español |

---

## 1. Alcance, arquitectura e infraestructura

### 1.1 Alcance funcional

LUBIX es una plataforma web de gestión empresarial (marketplace) con:

- Registro, verificación de correo e inicio de sesión de usuarios y empresas.
- Catálogo y publicación de productos, búsqueda y detalle de producto.
- Carrito, favoritos, pedidos y PQRS.
- Paneles de usuario, empresa y administración.
- App móvil Expo/React Native que consume la misma API.

La ficha técnica completa, las versiones exactas y los requisitos de hardware y software están en [`Docs/Ficha_Tecnica.md`](./Ficha_Tecnica.md).

### 1.2 Arquitectura

Arquitectura cliente–servidor de tres capas:

| Capa | Componente | Tecnología |
|---|---|---|
| Presentación web | `frontend/` | React 19 + TypeScript + Vite + Tailwind CSS |
| Presentación móvil | `mobile/` | Expo / React Native |
| Aplicación | `backend/` | FastAPI (Python 3.13), capas routers → services → repositories, SQLAlchemy y Alembic |
| Datos | PostgreSQL 16 | Docker local; Neon en producción |
| Almacenamiento | MinIO / S3 | `NasService` en el backend |

La UI web es mobile-first (Tailwind `sm:`/`md:`/`lg:`): navegación con panel desplegable, grillas apilables en móvil y tablas administrativas con desplazamiento horizontal controlado.

### 1.3 Infraestructura de producción

| Servicio | Proveedor | Configuración | Evidencia |
|---|---|---|---|
| API | Render Web Service (`lubix-api`, plan free, región Oregon) | `rootDir: backend`, arranque con `bash start.sh` (migraciones Alembic + Uvicorn), `healthCheckPath: /health` | [`render.yaml`](../render.yaml) |
| Frontend | Render Static Site (`lubix-frontend`) | Build `npm ci && npm run build`, publicación de `dist`, rewrite `/* → /index.html` | [`render.yaml`](../render.yaml) |
| Base de datos | Neon PostgreSQL | Cadena pooled `URL_DATABASE` para runtime y directa `DATABASE_URL_UNPOOLED` para Alembic, `sslmode=require` | [`render.yaml`](../render.yaml) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) §3 |
| Archivos | MinIO / S3 compatible | Variables `MINIO_*`, bucket `uploads` | [`render.yaml`](../render.yaml) §1 |
| Correo | Brevo (API HTTPS) con Resend como respaldo | `BREVO_API_KEY`, `RESEND_API_KEY` | [`render.yaml`](../render.yaml) |
| CI/CD | GitHub Actions | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) y [`sonarcloud.yml`](../.github/workflows/sonarcloud.yml) | Repositorio |
| Calidad | SonarCloud | Quality Gate y cobertura de código nuevo ≥ 80 % | [`sonarcloud.yml`](../.github/workflows/sonarcloud.yml) |

### 1.4 Integraciones externas

| Integración | Uso | Configuración |
|---|---|---|
| Neon | PostgreSQL gestionado | `URL_DATABASE`, `DATABASE_URL_UNPOOLED`, `DB_SSL_MODE=require` |
| Render | Host de API y frontend | `render.yaml`, `autoDeploy` desde `main` |
| MinIO / S3 | Imágenes de productos, logos y archivos | `MINIO_ENDPOINT`, `MINIO_BUCKET`, credenciales |
| Brevo / Resend | Verificación de correo y recuperación de contraseña | Claves de API y remitente verificado |
| GitHub Container Registry | Imágenes de backend y frontend en cada push a `main` | `GITHUB_TOKEN` con `packages: write` |
| SonarCloud | Análisis estático y Quality Gate | `SONAR_TOKEN` |

### 1.5 Requisitos previos

- Docker y Docker Compose v2 para el entorno local ([`docker-compose.yml`](../docker-compose.yml)).
- Python 3.13, Node.js 22, PostgreSQL 16, GPG y cliente `pg_dump`/`pg_restore`.
- Acceso HTTPS a Render y Neon y las variables listadas en [`.env.example`](../.env.example).
- Detalle de hardware y software en [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) §6.

**Responsable:** @nacoooobit. **Estado:** completo.

---

## 2. Estrategia de despliegue y pipeline CI/CD

### 2.1 Flujo de ramas

| Rama | Propósito | Disparador de despliegue |
|---|---|---|
| `feat/*`, `fix/*`, `test/*`, `docs/*` | Trabajo por tarea; PR obligatoria a `Develop` | Ninguno |
| `Develop` | Integración y validación continua | Pipeline CI y SonarCloud |
| `main` | Producción | Render (`autoDeploy: true`) y publicación GHCR |

Toda promoción a producción se realiza mediante PR `Develop → main` con CI en verde y revisión aprobada.

### 2.2 Pipeline de GitHub Actions (`ci.yml`)

| Job | Qué ejecuta | Criterio de éxito |
|---|---|---|
| `frontend` | `npm ci` → `npm run lint` → `npm run test:coverage` → `npm run build` | 0 errores ESLint, cobertura ≥ 80 % global (y ≥ 40 % por página), build de producción correcto |
| `e2e` | Playwright con Chromium sobre registro, compra y PQRS | Suite E2E sin fallos |
| `backend` | `ruff check app`, esquema de prueba, tests de repositorio contra PostgreSQL 16 real, `pytest` con cobertura y verificación de que las pruebas de integración no se omiten | 0 errores ruff, suite completa en verde, cobertura ≥ 80 % |
| `build-images-pr` | Build de imágenes backend y frontend sin publicar (solo PR) | Ambas imágenes construyen |
| `publish-images` | Publicación en GHCR solo en push a `main` y tras `frontend`, `e2e` y `backend` | Imágenes `ghcr.io/<repo>-backend:sha-<commit>` y `ghcr.io/<repo>-frontend:sha-<commit>` |

### 2.3 SonarCloud (`sonarcloud.yml`)

- Ejecuta frontend (Vitest + cobertura) y backend (pytest con `--cov-fail-under=80`) contra PostgreSQL 16 en el servicio del job.
- Normaliza las rutas del LCOV para el monorepo, verifica la existencia de `frontend/coverage/lcov.info` y `backend/coverage.xml` y lanza el escaneo con `SONAR_TOKEN`.
- Quality Gate exige cobertura de código nuevo ≥ 80 % y ausencia de vulnerabilidades críticas.

### 2.4 Umbrales de calidad (gates 80/80)

| Componente | Herramienta | Umbral | Configuración |
|---|---|---|---|
| Backend | pytest-cov | ≥ 80 % | `backend/pytest.ini`, `backend/pyproject.toml`, `sonarcloud.yml` |
| Frontend | Vitest v8 | ≥ 80 % global en líneas; ≥ 40 % por página crítica | `frontend/vite.config.ts` |
| Código nuevo | SonarCloud | ≥ 80 % | Quality Gate del proyecto |

### 2.5 Despliegue en Render

1. Render detecta el push a `main` (`autoDeploy: true`) y reconstruye ambos servicios.
2. El backend ejecuta `pip install -r requirements.txt` y `bash start.sh`, que aplica `alembic upgrade head` (con reintentos controlados por `DB_MIGRATION_RETRIES` y `DB_MIGRATION_RETRY_DELAY`) y luego inicia Uvicorn.
3. Render valida `GET /health` antes de marcar el despliegue como activo.
4. El frontend ejecuta `npm ci && npm run build` y publica `dist` con rewrite SPA.

Las imágenes GHCR se publican como artefacto independiente; Render no las consume y despliega desde el código fuente. El procedimiento paso a paso está en [`DEPLOYMENT.md`](./DEPLOYMENT.md) §5–§7.

### 2.6 Ventanas de mantenimiento

- Despliegues ordinarios: cualquier horario, con CI previo en verde; el cold start del plan free puede añadir latencia a la primera petición.
- Migraciones de esquema y cambios de variables: ventana de baja concurrencia acordada por el equipo, anunciada en el canal del proyecto, con respaldo previo verificado ([`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md)) y validación posterior de `/health` y `/health/database`.
- No se ejecuta `alembic downgrade` en producción sin respaldo restaurado o migración de reversión revisada.

**Responsable:** @lunethZ. **Estado:** pipeline y despliegue operativos; protección de `main` mediante PR y checks configurada en el repositorio.

---

## 3. Respaldos y recuperación ante desastres (DR)

### 3.1 Objetos respaldados

| Objeto | Mecanismo | Cifrado | Responsable |
|---|---|---|---|
| Base de datos PostgreSQL | `pg_dump -Fc` + GPG AES-256, checksum SHA-256 y manifiesto JSON con conteos por tabla y revisión Alembic | GPG AES-256 | @lunethZ |
| Archivos MinIO/S3 | Copia del bucket y de sus metadatos según [`Respaldo_v0.md`](./Respaldo_v0.md) §5.2 | Definido por el proveedor | @lunethZ |
| Configuración y secretos | Variables de entorno en Render y GitHub Secrets; `.env.example` versionado sin valores reales | Fuera del repositorio | @nacoooobit |
| Código y configuración de despliegue | Repositorio Git + `render.yaml` + imágenes GHCR | — | Equipo LUBIX |

### 3.2 Frecuencia y retención

- Respaldo automático de base de datos cada **6 horas**.
- Retención de **30 días**.
- Copia externa de `.dump.gpg`, `.sha256` y `.manifest.json` por cada ejecución.
- La frase de paso GPG se entrega por archivo con permisos restringidos o variable de entorno; nunca se versiona.

Con esta frecuencia, el RPO de la base de datos es de hasta 6 horas. El tiempo de restauración observado en la prueba controlada fue de 12.03 s para 16 tablas y 79 filas.

### 3.3 Restauración y verificación

```bash
python scripts/pg_backup.py restore --file lubix_db_YYYYmmddTHHMMSSZ.dump.gpg
python scripts/pg_backup.py verify --file lubix_db_YYYYmmddTHHMMSSZ.dump.gpg
```

`verify` levanta un PostgreSQL 16 desechable, descifra el volcado, restaura y compara checksum, tablas, filas y revisión Alembic sin tocar la base de origen.

### 3.4 Evidencia de la prueba de restauración

| Campo | Resultado |
|---|---|
| Respaldo probado | `lubix_db_20261119T161808Z.dump.gpg` |
| SHA-256 | `cb41901c…783523c1` (coincide) |
| Revisión Alembic | `d1e2f3a4b5c6` (coincide) |
| Contenido | 16 tablas, 79 filas |
| Validaciones | **19/19 correctas** |
| Duración | **12.03 s** |
| Resultado | **PASS** |
| Reporte | `backups/reports/restore-test_20261119T162113Z.{json,md}` |

Evidencia completa en [`Evidencias/Prueba_Restauracion_2026-11-19.md`](./Evidencias/Prueba_Restauracion_2026-11-19.md). La prueba se ejecutó en un PostgreSQL aislado y desechable; la repetición en una máquina distinta o en Neon queda registrada como acción de cierre en la sección 7.

### 3.5 Recuperación de Neon y MinIO

- **Neon:** restaurar desde la copia lógica verificada o usar la recuperación a un punto en el tiempo disponible en el plan contratado. Antes de cualquier operación se valida la revisión Alembic y los conteos del manifiesto.
- **MinIO:** restaurar el bucket respaldado y verificar la carga de imágenes desde la aplicación; las referencias de archivos se conservan en la base de datos, por lo que la restauración de ambos debe ser consistente.

**Responsable:** @lunethZ. **Estado:** respaldo y restauración operativos con evidencia PASS.

---

## 4. Monitoreo, salud y alertas

### 4.1 Endpoints de salud

| Endpoint | Uso | Respuesta esperada |
|---|---|---|
| `GET https://lubix-api.onrender.com/health` | Healthcheck de Render y monitores externos | `200` con `{"status":"ok","service":"lubix-api","environment":"production","database":"ok"}`; `503` con `status: unavailable` y `database: error` si PostgreSQL no responde |
| `GET /health/database` | Verificación directa de PostgreSQL | `200` con `{"Base de datos":"OK"}` |
| `GET /health/internet` | Diagnóstico de salida de red | `200` cuando el API tiene conectividad |
| `GET http://localhost:8002/health` | Desarrollo local con Docker Compose | `200` |

`render.yaml` usa `/health` como `healthCheckPath`, por lo que un despliegue con base de datos inaccesible queda marcado como no saludable.

### 4.2 Monitores externos

| Herramienta | Modo | Configuración |
|---|---|---|
| Uptime Kuma | Sondeo HTTP directo (recomendado) | URL `/health`, intervalo 300 s (900 s para preservar la suspensión del plan free), timeout 60 s, 2 reintentos, código esperado 200, notificación por Telegram/Discord/correo |
| Healthchecks.io | Push con verificación previa | Cron cada 5 min que ejecuta `GET /health` y solo envía el ping si responde 200; timeout y grace period de 10 min |
| Render | Healthcheck de despliegue y métricas | Estado del deploy, CPU, memoria y latencia |
| Uptime Kuma local (opcional) | Docker Compose | Servicio comentado en `docker-compose.yml`, puerto 3001 |

Procedimiento detallado y prueba de alerta en [`monitoreo.md`](./monitoreo.md).

### 4.3 Interpretación y respuesta

| Señal | Significado | Acción |
|---|---|---|
| `/health` 200 y `database: ok` | Servicio y base operativos | Ninguna |
| `/health` 503 o `database: error` | PostgreSQL inaccesible o credenciales inválidas | Revisar estado de Neon, cadena `URL_DATABASE` y logs de Render; aplicar sección 5 |
| Timeout en la primera petición | Cold start del plan free | Repetir con timeout amplio; el monitor tolera 2 reintentos |
| Alerta de Uptime Kuma/Healthchecks.io | Caída confirmada tras reintentos | Abrir incidente, revisar Render → Logs y estado de Neon |

**Responsable:** @nacoooobit. **Estado:** healthchecks operativos; alerta externa pendiente de activación con la URL de ping definitiva.

---

## 5. Contingencia y rollback

### 5.1 Matriz de contingencia

| Escenario | Señal | Acción inmediata | Verificación | Recuperación de datos |
|---|---|---|---|---|
| Caída del Web Service en Render | `/health` sin respuesta o monitor en Down; deploy en rojo | Revisar Render → Logs; reiniciar el servicio; si el deploy es la causa, **Redeploy** del despliegue anterior | `/health` 200 y frontend carga | No aplica si la base está intacta |
| Degradación de Neon/PostgreSQL | `/health` 503 con `database: error`; errores `OperationalError` o `too many connections` | Revisar estado y conexiones en Neon; validar `URL_DATABASE` y límites de pool; reiniciar el API tras corregir | `/health/database` 200 y login exitoso | Si hay corrupción, restaurar respaldo verificado (sección 3.3) y validar manifiesto |
| Fallo del despliegue en `main` | CI rojo, health check fallido o error funcional tras el deploy | Revertir el commit en `main` o **Redeploy** del build anterior; volver variables de entorno al valor previo si cambiaron | CI verde, `/health` 200 y smoke test de login | Restaurar solo si una migración alteró datos; nunca `alembic downgrade` sin respaldo |
| Pérdida o corrupción de archivos en MinIO | Imágenes o logos no cargan; error del `NasService` | Restaurar el bucket desde la copia respaldada; verificar credenciales y endpoint | Subida y lectura de una imagen de prueba | Restaurar bucket y comprobar referencias en base de datos |
| Migración Alembic fallida en el arranque | El deploy no supera el health check; logs de `alembic upgrade` con error | Detener el despliegue, corregir la migración en una rama y redesplegar; si ya se aplicó parcialmente, restaurar respaldo | Revisión `alembic current` y `/health/database` | Respaldo previo verificado (sección 3.3) |
| Exposición de secretos | Credencial rotada o detectada en logs | Rotar `SECRET_KEY`, credenciales de Neon/MinIO o claves de correo; redesplegar | Login y health checks correctos; tokens previos invalidados | No aplica |

### 5.2 Rollback de despliegue

1. Render → **Deploys** → seleccionar el despliegue anterior → **Redeploy**.
2. Si el cambio incluyó variables de entorno, restaurar los valores anteriores y redesplegar.
3. Si el problema es de esquema, restaurar el respaldo verificado o aplicar una migración de reversión revisada; no ejecutar `alembic downgrade` directo en producción.
4. Confirmar `GET /health`, `GET /health/database` y un inicio de sesión de prueba antes de cerrar el incidente.

**Responsable:** @lunethZ. **Estado:** procedimientos definidos; el rollback de Render está disponible por despliegue y el de datos depende del respaldo verificado.

---

## 6. Soporte, mantenimiento y capacitación

### 6.1 Roles y escalamiento

| Rol | Responsable | Alcance |
|---|---|---|
| Implantación y despliegue | @nacoooobit | Render, variables de entorno, monitoreo y acta |
| Backend y base de datos | @lunethZ | API, migraciones, Neon, respaldos y rollback |
| Frontend y QA | @WinStormX | UI web, pruebas E2E y verificación funcional |
| Revisión y aprobación | @lunethZ · @juanpineda | Code review, Quality Gate y firma del acta |

Escalamiento: incidencia → responsable del componente → revisión conjunta → decisión de rollback o mitigación, registrada en GitHub Issues.

### 6.2 Mantenimiento

| Tipo | Actividades | Frecuencia |
|---|---|---|
| Correctivo | Issues de GitHub con severidad y criterio de cierre; corrección vía PR a `Develop` | Según incidencia |
| Preventivo | Respaldo cada 6 h, prueba de restauración periódica, actualización de dependencias, revisión de logs y métricas | Continua / por iteración |
| Evolutivo | Nuevas historias de usuario por sprint con CI y Quality Gate | Por sprint |
| Seguridad | Rotación de credenciales, revisión de CORS y secretos, auditoría de dependencias | Por release y ante incidente |

### 6.3 Capacitación y documentación

- **Plan operativo consolidado:** [`Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md`](./Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) — actualizaciones, soporte (SLA y escalamiento), monitoreo y guía de capacitación para usuarios.
- **Manual técnico y de usuario:** [`Docs/Manual Tecnico De Usuario/`](./Manual%20Tecnico%20De%20Usuario/).
- **Operación y despliegue:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) y [`monitoreo.md`](./monitoreo.md).
- **Respaldos:** [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md).
- **Onboarding:** clonar el repositorio, copiar `.env.example`, levantar `docker compose up -d`, aplicar migraciones y ejecutar las suites de backend y frontend.
- **Práctica de restauración:** cada integrante del equipo ejecuta `pg_backup.py verify` sobre un respaldo de ejemplo antes de asumir guardias.

**Responsable:** @nacoooobit. **Estado:** roles asignados y documentación disponible.

---

## 7. Validación, criterios de aceptación y acta de implantación

### 7.1 Pruebas de aceptación

| ID | Prueba | Evidencia | Resultado |
|---|---|---|---|
| A-01 | Registro, verificación e inicio de sesión | `backend/tests/test_auth.py`, `frontend/e2e/register.spec.ts` | PASS |
| A-02 | Gestión de empresa, catálogo y productos | `backend/tests/test_company.py`, `backend/tests/test_products.py` | PASS |
| A-03 | Carrito y compra completa | `backend/tests/test_cart.py`, `frontend/e2e/` | PASS |
| A-04 | PQRS y validaciones | `backend/tests/test_pqrs.py`, `backend/tests/test_pqrs_validation.py` | PASS |
| A-05 | Healthcheck y base de datos | `backend/tests/test_health.py`, `/health`, `/health/database` | PASS |

### 7.2 Criterios de aceptación de la implantación

1. CI en verde en `Develop` y `main`: lint, pruebas, cobertura ≥ 80 % en backend y frontend y build de producción.
2. Quality Gate de SonarCloud aprobado.
3. `GET /health` responde 200 con `database: ok` en producción y el frontend público carga.
4. Respaldos configurados con retención y una restauración verificada con evidencia PASS.
5. Procedimientos de contingencia y rollback disponibles para el equipo.
6. Defectos P1 abiertos: 0. Los hallazgos no bloqueantes se registran con acción y responsable.

### 7.3 Estado de validación

| Ítem | Estado | Observación |
|---|---|---|
| Pipeline CI y SonarCloud | Cumple | Umbrales 80/80 activos |
| Healthchecks `/health` y `/health/database` | Cumple | `healthCheckPath` en `render.yaml` |
| Respaldo y restauración | Cumple | 19/19 validaciones, 12.03 s, evidencia 2026-11-19 |
| Alerta externa | Pendiente | Configurar Uptime Kuma o Healthchecks.io con la URL de ping definitiva y adjuntar captura |
| Repetición de restauración en máquina distinta | Pendiente | Copiar el respaldo y ejecutar `pg_backup.py verify` allí |
| RNF-001 (p95 < 200 ms en Render) | No cumple en producción | Catálogo p95 605 ms; en local p95 30.7 ms. Mitigación: ping externo y plan siempre activo |
| RNF-009 (respuestas de error) | Rechazado | 401 en ruta inexistente y 500 en UUID inválido; seguimiento en issue #84 |
| Simulacro ejecutado por un tercero | Cumple con observación | Ejecutado el 2026-11-24 en un clon limpio de `main` (`2b85add`): instalación y restauración PASS; D-03 (permisos de MinIO en Windows) documentado en [`Simulacro_Instalacion_2026-11-24.md`](./Evidencias/Simulacro_Instalacion_2026-11-24.md) |

### 7.4 Checklist del simulacro de implantación

1. Clonar `https://github.com/lunethZ/COMPANY-LUBIX.git` en una máquina limpia.
2. Copiar `.env.example` a `.env` y completar secretos.
3. Ejecutar `docker compose up -d`.
4. Aplicar `alembic upgrade head` y verificar `alembic current`.
5. Comprobar `/health`, `/health/database` y el frontend local.
6. Ejecutar `python scripts/pg_backup.py verify --file <respaldo>.dump.gpg`.
7. Adjuntar salidas o capturas al acta.

### 7.5 Acta de implantación

| Campo | Valor |
|---|---|
| Fecha | 2026-11-24 |
| Modalidad | Remota / seguimiento en GitHub |
| Responsable de implantación | @nacoooobit |
| Participantes | @nacoooobit · @lunethZ · @WinStormX · @juanpineda (revisión pendiente) |
| Temas tratados | Arquitectura y alcance, despliegue en Render, CI/CD y gates 80/80, respaldo y restauración, monitoreo, contingencia y soporte |
| Evidencias revisadas | CI y SonarCloud del repositorio; `/health`, `/health/database`, `/health/internet`; [`Prueba_Restauracion_2026-11-19.md`](./Evidencias/Prueba_Restauracion_2026-11-19.md); [`p4-s5-seguridad.txt`](./Evidencias/p4-s5-seguridad.txt); [`Simulacro_Instalacion_2026-11-24.md`](./Evidencias/Simulacro_Instalacion_2026-11-24.md) |
| Acuerdos | Mantener CI y Quality Gate en verde; activar alerta externa; completar simulacro en máquina distinta; corregir issue #84; mantener respaldo cada 6 h |
| Observaciones | RNF-001 no cumple en el plan free de Render (latencia de red e infraestructura, no de consulta). RNF-009 con hallazgos de códigos de error registrados en issue #84. |
| Firmas | @lunethZ (calidad y backend) — pendiente @juanpineda y cierre del simulacro |

---

## 8. Ensamblaje y control de entregables

### 8.1 Aportes del equipo

| Integrante | Aporte | Evidencia |
|---|---|---|
| @josearmenta2163 | Diseño del plan de capacitación y guion de sesiones | [`Plan_Capacitacion.md`](./Plan_Capacitacion.md) · [`Sesion_Simulada_Capacitacion.md`](./Sesion_Simulada_Capacitacion.md) |
| @WinStormX | Prueba de la guía rápida y hallazgos de usabilidad | [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md) |
| @lunethZ | Validación técnica y revisión de consistencia | Este documento §9 |
| @nacoooobit | Ensamblaje del entregable e integración en el plan | [`Entrega_Final_Capacitacion.md`](./Entrega_Final_Capacitacion.md) |
| @juanpineda | Revisión y aprobación de cierre | Acta §7.5 |

### 8.2 Proceso de consolidación

1. Cada integrante entregó su aporte en una rama o documento propio.
2. Se revisó la consistencia con los manuales 1.1.5, 1.1.7, 1.1.8, 1.1.9 y 1.1.10.
3. Se resolvieron duplicidades y se unificaron tiempos, canales y nombres de pantallas.
4. Se integró el resultado en [`Entrega_Final_Capacitacion.md`](./Entrega_Final_Capacitacion.md) y en la sección 9 de este documento.
5. Se registró la validación por par y el control de cambios.

**Responsable:** @nacoooobit. **Estado:** entregable consolidado y enlazado.

---

## 9. Capacitación, ayudas en línea y ensamblaje del plan

Esta sección integra el contenido de la sección 9 del [`Entrega_Final_Capacitacion.md`](./Entrega_Final_Capacitacion.md) en el plan de implantación.

### 9.1 Plan de capacitación por roles

| Módulo | Contenido | Usuario final | Empresa | Administrador | Mesa de ayuda | Duración |
|---|---|---|---|---|---|---|
| M1. Acceso y cuenta | Pestañas, verificación, recuperación y contraseña | ✅ | ✅ | ✅ | ✅ | 20 min |
| M2. Compra | Catálogo, carrito, checkout y pedido | ✅ | — | — | ✅ | 40 min |
| M3. Pedidos y PQRS | Mis pedidos, PQRS y seguimiento | ✅ | ✅ | ✅ | ✅ | 30 min |
| M4. Panel de empresa | Productos, pedidos, estadísticas y perfil | — | ✅ | — | ✅ | 40 min |
| M5. Administración | Empresas, usuarios, PQRS y resumen | — | — | ✅ | ✅ | 40 min |
| M6. Mesa de ayuda | Triage, severidad, evidencia y escalamiento | — | — | — | ✅ | 30 min |

**Rutas:** Usuario final M1 → M2 → M3; Empresa M1 → M3 → M4; Administrador M1 → M3 → M5; Mesa de ayuda M1 → M6.

**Evaluación:** cuestionario de 5 preguntas y práctica del rol sin asistencia; aprobación con al menos 4/5 y la lista PA-01 a PA-06. Detalle en [`Plan_Capacitacion.md`](./Plan_Capacitacion.md).

### 9.2 Guía rápida de uso

[`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md) resume ingreso, compra, pedidos, PQRS, panel de empresa, administración, mesa de ayuda, errores comunes, canales y checklist. Incluye la nota de cold start de Render y la tabla de pestañas **Usuario** / **Empresa**.

### 9.3 Preguntas frecuentes (FAQ)

[`FAQ_Usuarios.md`](./FAQ_Usuarios.md) organiza 36 preguntas en siete bloques: acceso y cuenta, usuario final, empresa, administrador, PQRS y soporte, seguridad y privacidad, y ayudas en línea. Remite al manual 1.1.10 y no inventa canales ni tiempos distintos a los documentados.

### 9.4 Prueba de la guía rápida por un compañero

**Evidencia:** [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md)

| Criterio | Resultado |
|---|---|
| Tareas completadas sin ayuda | 5/5 |
| Tiempo promedio por tarea | 4 min |
| Dudas resueltas en la guía | 5/5 |
| Resultado global | **PASS** |

Hallazgos aplicados: tabla de pestañas, ubicación de **Mis pedidos**, ejemplo de contraseña válida, nota de cold start y enlace al canal de soporte.

### 9.5 Evidencias y criterios de aceptación

- [x] Plan de capacitación por roles diseñado.
- [x] Guía rápida redactada en Markdown.
- [x] FAQ redactada en Markdown y organizada por perfil.
- [x] Aportes de todo el equipo consolidados.
- [x] Guía rápida probada por un compañero (PASS 5/5).
- [x] Sección 9 integrada en el plan de implantación.
- [x] Entregables enlazados desde el README y el plan operativo.

### 9.6 Ensamblaje y control de cambios

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0.0 | 2026-11-26 | Integración de la sección 9: plan por roles, guía rápida, FAQ, prueba por par y evidencias | @nacoooobit |

**Responsable:** @nacoooobit. **Revisión:** @lunethZ · @juanpineda. **Estado:** integrado y listo para revisión.
