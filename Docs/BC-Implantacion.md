# Documento de Implantación — LUBIX

> Plantilla: `bc-implantacion`
> Criterio de "hecho": las secciones 1 a 7 contienen alcance, evidencia verificable y responsable; los pendientes quedan identificados con su acción de cierre.
> Documentos relacionados: [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) · [`Plan_Migracion_v0.md`](./Plan_Migracion_v0.md) · [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) · [`Instalacion_v0.md`](./Instalacion_v0.md) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`monitoreo.md`](./monitoreo.md)

## Metadatos del documento

| Campo | Valor |
|-------|-------|
| Nombre del sistema | LUBIX — Plataforma de Gestión Empresarial |
| Repositorio / módulo | `lunethZ/COMPANY-LUBIX` |
| Repositorio (URL) | https://github.com/lunethZ/COMPANY-LUBIX |
| Versión del sistema | 1.0.0 |
| Versión Backend | 1.1.1b |
| Versión Frontend | 0.1.0 |
| Versión del documento | 1.0.0 |
| Estado | En revisión |
| Fecha de creación | 2026-10-18 |
| Última actualización | 2026-11-22 |
| Autor(es) | @nacoooobit (responsable de implantación) |
| Revisado por | Solicitado a @lunethZ y @juanpineda en PR #81 y PR #82 |
| Aprobado por | Pendiente de aprobación |
| Clasificación de la información | Interno |
| Entornos cubiertos | Desarrollo · Staging · Producción |
| Idioma | Español |
| Plantilla | `bc-implantacion` |
| Criterio de aceptación | Secciones 1 a 7 con evidencia real y enlaces a documentos existentes |

---

## 1. Ficha Técnica

> Fuente principal: [`Docs/Ficha_Tecnica.md`](./Ficha_Tecnica.md).

### 1.1 Resumen del sistema

LUBIX es una plataforma web de gestión empresarial con autenticación de usuarios y empresas, catálogo de productos, carrito de compras, pedidos, favoritos y PQRS. El backend expone una API REST FastAPI; el frontend web usa React + TypeScript + Vite y la app móvil se distribuye de forma independiente.

### 1.2 Arquitectura y componentes

- **Backend:** FastAPI con capas de routers, servicios y repositorios; migraciones Alembic; SQLAlchemy sobre PostgreSQL.
- **Frontend web:** React + Vite, Vitest para pruebas y Playwright para E2E.
- **Base de datos:** PostgreSQL 16 en Docker local y Neon en producción.
- **Almacenamiento de archivos:** MinIO/S3 compatible mediante `NasService`.
- **Despliegue:** Render (API y sitio estático) según [`render.yaml`](../render.yaml) y [`DEPLOYMENT.md`](./DEPLOYMENT.md).
- **Monitoreo:** healthchecks HTTP y alerta externa documentada en [`monitoreo.md`](./monitoreo.md).

### 1.3 Tecnologías y versiones

Las versiones exactas de Python, Node, PostgreSQL y dependencias están en [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) y en los manifiestos `backend/requirements.txt`, `backend/pyproject.toml`, `frontend/package.json` y `mobile/package.json`.

### 1.4 Integraciones y dependencias externas

| Dependencia | Uso | Evidencia |
|---|---|---|
| Neon | PostgreSQL gestionado en producción | [`DEPLOYMENT.md`](./DEPLOYMENT.md) |
| Render | Host de API y frontend | [`render.yaml`](../render.yaml) |
| GitHub Actions | CI, pruebas, cobertura y publicación GHCR | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| SonarCloud | Quality Gate y análisis estático | [`.github/workflows/sonarcloud.yml`](../.github/workflows/sonarcloud.yml) |
| MinIO / S3 | Imágenes y archivos | [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) |
| SMTP | Correos de verificación y recuperación | [`.env.example`](../.env.example) |

### 1.5 Requisitos previos (hardware, software, red)

Se requieren Docker con Compose, Python 3.13, Node.js 20+, PostgreSQL 16, acceso HTTPS a Render/Neon y las variables de entorno listadas en [`.env.example`](../.env.example). El detalle está en [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) §6.

**Responsable:** @nacoooobit. **Estado:** completo.

---

## 2. Migración

> Fuentes: [`Plan_Migracion_v0.md`](./Plan_Migracion_v0.md) y [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md).

### 2.1 Alcance de la migración

Migrar el esquema y los datos desde el entorno local/dockerizado hacia PostgreSQL en Neon, conservando roles, revisión de Alembic y conteo de filas. No se migra el bucket de archivos como parte de esta actividad; se gestiona según [`Respaldo_v0.md`](./Respaldo_v0.md) §5.2.

### 2.2 Inventario de datos y esquemas

La prueba de restauración documentó **16 tablas y 79 filas**, con revisión Alembic `d1e2f3a4b5c6`, en [`Evidencias/Prueba_Restauracion_2026-11-19.md`](./Evidencias/Prueba_Restauracion_2026-11-19.md).

### 2.3 Estrategia de migración

1. Aplicar `alembic upgrade head` sobre la base destino.
2. Verificar la revisión activa.
3. Cargar datos semilla solo en entornos no productivos (`RUN_SEED=false` en producción).
4. Validar conteos por tabla contra el manifiesto del respaldo.

### 2.4 Plan de ejecución y ventana de mantenimiento

La ventana recomendada es de baja concurrencia. Secuencia: respaldo previo → migración → verificación del healthcheck → validación de conteos → cierre o rollback. El procedimiento operativo está en [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### 2.5 Validación y rollback de migración

La validación usa SHA-256, `pg_restore`, conteo de tablas/filas y revisión Alembic; la evidencia disponible reporta **19/19 validaciones correctas**. El rollback se ejecuta con `python scripts/pg_backup.py restore --file <respaldo>.dump.gpg` y se describe en [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) §7.

**Responsable:** @lunethZ. **Estado:** ejecutado en entorno aislado; pendiente de repetir en máquina distinta.

---

## 3. Respaldo

> Fuentes: [`Respaldo_v0.md`](./Respaldo_v0.md), [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) y [`scripts/pg_backup.py`](../scripts/pg_backup.py).

### 3.1 Alcance de los respaldos (base de datos, archivos, configuración)

- **Base de datos:** volcado lógico PostgreSQL con `pg_dump -Fc`, cifrado GPG AES-256.
- **Archivos de MinIO:** procedimiento descrito en [`Respaldo_v0.md`](./Respaldo_v0.md) §5.2.
- **Configuración:** variables de entorno versionadas en [`.env.example`](../.env.example) y secretos gestionados fuera del repositorio.

### 3.2 Frecuencia y retención

La política operativa define respaldo automático cada **6 horas** y retención de **30 días**, con copia externa del `.dump.gpg`, `.sha256` y `.manifest.json`.

### 3.3 Almacenamiento y cifrado de respaldos

Cada respaldo genera tres archivos: volcado cifrado, checksum SHA-256 y manifiesto con conteos por tabla y revisión Alembic. La frase de paso se entrega por archivo con permisos restringidos o variable de entorno; nunca se versiona.

### 3.4 Procedimiento de restauración

```bash
python scripts/pg_backup.py restore --file lubix_db_YYYYmmddTHHMMSSZ.dump.gpg
python scripts/pg_backup.py verify --file lubix_db_YYYYmmddTHHMMSSZ.dump.gpg
```

El modo `verify` levanta un PostgreSQL desechable y valida contenido sin tocar la base de origen.

### 3.5 Pruebas de restauración

Evidencia: [`Evidencias/Prueba_Restauracion_2026-11-19.md`](./Evidencias/Prueba_Restauracion_2026-11-19.md) → **PASS**, 19/19 validaciones, 16 tablas, 79 filas y 12.03 s. Pendiente: completar el registro en máquina destino (sección 4 de esa evidencia) para cerrar formalmente RNF-009 con un tercero.

**Responsable:** @lunethZ. **Estado:** operativo; evidencia de segunda máquina pendiente.

---

## 4. Instalación

> Fuentes: [`Instalacion_v0.md`](./Instalacion_v0.md) y [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### 4.1 Entornos (desarrollo, staging, producción)

| Entorno | Base | Despliegue | Rama |
|---|---|---|---|
| Desarrollo | Docker Compose `postgres:16` | `docker compose up` | `feature/*` |
| Staging | PostgreSQL de prueba en CI / Neon de prueba | GitHub Actions | `Develop` |
| Producción | Neon | Render desde `main` | `main` |

### 4.2 Requisitos del servidor

Ver [`Ficha_Tecnica.md`](./Ficha_Tecnica.md) §6: Docker, Python 3.13, Node.js 20+, PostgreSQL 16, GPG y cliente `pg_dump`/`pg_restore`.

### 4.3 Pasos de instalación (backend, frontend, base de datos, almacenamiento)

1. Clonar `https://github.com/lunethZ/COMPANY-LUBIX.git`.
2. Copiar `.env.example` a `.env` y completar secretos.
3. Levantar servicios con `docker compose up -d`.
4. Aplicar migraciones con `alembic upgrade head`.
5. Iniciar backend con `bash start.sh` y frontend con `npm install && npm run dev`.
6. En producción, Render construye ambos servicios desde `main` según [`render.yaml`](../render.yaml).

### 4.4 Variables de entorno y configuración

Las variables críticas son `URL_DATABASE`/`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `CORS_ORIGINS`, `MINIO_*`, `SMTP_*` y `RUN_SEED`. La lista completa está en [`.env.example`](../.env.example).

### 4.5 Verificación posterior a la instalación

- `GET /health` → 200 con estado `ok`.
- `GET /health/database` → 200 cuando PostgreSQL responde; 503 cuando no.
- Frontend público → 200 en `https://lubix-frontend.onrender.com/`.
- CI verde en `Develop` y `main`.

**Responsable:** @nacoooobit. **Estado:** documentado y verificado en URLs públicas.

---

## 5. Pipeline

> Fuentes: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) y [`.github/workflows/sonarcloud.yml`](../.github/workflows/sonarcloud.yml).

### 5.1 Etapas del pipeline (build, test, análisis, despliegue)

1. Instalación de dependencias Python y Node.
2. Pruebas de repositorio contra PostgreSQL real.
3. Backend pytest con cobertura mínima **80 %**.
4. Frontend Vitest con umbral global de líneas **80 %**, ESLint y build.
5. E2E con Playwright.
6. SonarCloud Quality Gate (≥80 % en código nuevo).
7. Publicación de imágenes GHCR en `main` y despliegue automático de Render.

### 5.2 Herramientas y agentes

GitHub Actions, pytest, pytest-cov, Vitest, Playwright, ESLint, SonarCloud, Render y GitHub Container Registry.

### 5.3 Control de versiones y ramas

`Develop` es la rama de integración; las tareas se trabajan en ramas `feature/*`, `fix/*` o `test/*` y llegan a `Develop` mediante PR. `main` es la rama de producción y su protección (PR obligatoria, 1 aprobación y checks verdes) está pendiente de activar con PR #82.

### 5.4 Gestión de artefactos y versionado

Los artefactos son `coverage.xml`, `frontend/coverage/lcov.info`, resultados JUnit y las imágenes `ghcr.io/<propietario>/<repositorio>-backend:sha-<commit>` y `-frontend:sha-<commit>`.

### 5.5 Estrategia de despliegue y rollback

Render despliega automáticamente desde `main`. El rollback consiste en revertir el commit en `main` y, si hay afectación de datos, restaurar el respaldo verificado según la sección 3.4.

**Responsable:** @lunethZ. **Estado:** CI verde; protección y merge final pendientes de aprobación.

---

## 6. Seguridad

> Fuentes: [`Seguridad_Servidor.md`](./Seguridad_Servidor.md), [`Matriz_Usuarios_Roles.md`](./Matriz_Usuarios_Roles.md) y [`Evidencias/p4-s5-seguridad.txt`](./Evidencias/p4-s5-seguridad.txt).

### 6.1 Gestión de secretos y credenciales

Los secretos se entregan por variables de entorno y GitHub Secrets. La frase de paso de respaldos se guarda fuera del repositorio. No hay credenciales reales en `.env.example` ni en las pruebas.

### 6.2 Autenticación y autorización

JWT de access/refresh, contraseñas con bcrypt y control de acceso por roles `admin`, `company` y `user`. Los scripts [`roles_postgresql.sql`](../scripts/seguridad/roles_postgresql.sql) y `roles_postgresql_neon.sql` aplican el principio de mínimo privilegio.

### 6.3 Cifrado en tránsito y en reposo

Tránsito: HTTPS/TLS en Render y Neon. Reposo: contraseñas hash con bcrypt y respaldos cifrados con GPG AES-256.

### 6.4 Superficie de exposición y hardening

CORS usa lista de orígenes permitidos y las respuestas de error del middleware reflejan el origen permitido sin wildcard con credenciales. Queda como mejora pendiente la revisión de cabeceras HTTP adicionales registrada en [`Tabla_Calidad_Producto_Software_ISO25010.md`](./Tabla_Calidad_Producto_Software_ISO25010.md).

### 6.5 Auditoría, trazabilidad y cumplimiento

Las PRs conservan revisión y checks; SonarCloud publica el Quality Gate; los respaldos generan manifiesto y reporte; las evidencias de seguridad se agrupan en [`Evidencias/p4-s5-seguridad.txt`](./Evidencias/p4-s5-seguridad.txt).

**Responsable:** @lunethZ. **Estado:** controles principales aplicados; hardening adicional en seguimiento.

---

## 7. Mantenimiento

> Fuentes: [`monitoreo.md`](./monitoreo.md), [`Plan_QA_ISO25010.md`](./Plan_QA_ISO25010.md) y [`Backlog_Final.md`](./Backlog_Final.md).

### 7.1 Mantenimiento correctivo

Los defectos se gestionan como issues de GitHub con plantilla, severidad y criterio de cierre. Los issues #42, #43 y #46 se cerraron con evidencia de umbrales y URL pública.

### 7.2 Mantenimiento preventivo

Respaldo cada 6 horas con retención de 30 días, prueba de restauración periódica, actualización de dependencias y ejecución de SonarCloud en cada PR.

### 7.3 Monitoreo y alertas

El API expone `/health` y `/health/database`; Render usa `/health` como `healthCheckPath`. La configuración de Uptime Kuma y Healthchecks.io está en [`monitoreo.md`](./monitoreo.md). Pendiente: configurar la alerta externa real y adjuntar la captura de la alerta activa.

### 7.4 Actualizaciones y parches

Toda actualización entra por PR a `Develop`, con CI en verde y al menos una revisión. Los cambios de producción se promueven mediante PR `Develop → main`.

### 7.5 Contactos y escalamiento de soporte

| Rol | Responsable |
|---|---|
| Implantación y despliegue | @nacoooobit |
| Backend y base de datos | @lunethZ |
| Frontend y QA | @WinStormX |
| Revisión / aprobación | @lunethZ · @juanpineda |

**Responsable:** @nacoooobit. **Estado:** monitoreo documentado; alerta externa pendiente.

---

## 8. Aceptación, simulacro y acta

| ID | Prueba de aceptación | Evidencia | Resultado |
|---|---|---|---|
| A-01 | Registro e inicio de sesión de usuario | `backend/tests/test_auth.py`, `frontend/e2e/register.spec.ts`, CI 45089479684 | PASS |
| A-02 | Gestión de empresa y catálogo | `backend/tests/test_company.py`, `backend/tests/test_products.py` | PASS |
| A-03 | Carrito y compra completa | `backend/tests/test_cart.py`, `frontend/e2e/` | PASS |
| A-04 | PQRS y validaciones | `backend/tests/test_pqrs.py`, `backend/tests/test_pqrs_validation.py` | PASS |
| A-05 | Healthcheck y respuesta de base de datos | `backend/tests/test_health.py`, `/health`, `/health/database` | PASS |

### 8.1 Simulacro de implantación

Pendiente de ejecución por un compañero distinto al autor. Checklist: clonar `https://github.com/lunethZ/COMPANY-LUBIX.git` en limpio, copiar `.env.example`, levantar `docker compose up -d`, ejecutar `alembic upgrade head`, verificar `/health`, `/health/database` y frontend, ejecutar `python scripts/pg_backup.py verify`, y adjuntar salida o captura. No se pudo completar desde la máquina de edición porque Docker daemon no está disponible.

### 8.2 Acta de seguimiento y cierre

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Modalidad | Remota / seguimiento en GitHub |
| Responsable de implantación | @nacoooobit |
| Participantes | @nacoooobit · @lunethZ · @WinStormX · @juanpineda (revisión pendiente) |
| Temas tratados | Despliegue en Render, respaldo y restauración, CI/Sonar, RNFs y acciones correctivas |
| Evidencias revisadas | CI 45089479684; `/health`, `/health/database`, `/health/internet`; [`Prueba_Restauracion_2026-11-19.md`](./Evidencias/Prueba_Restauracion_2026-11-19.md); [`p4-s5-seguridad.txt`](./Evidencias/p4-s5-seguridad.txt) |
| Acuerdos | Revisar y fusionar PR #81, #82, #83 y #85; activar protección de `main`; configurar Healthchecks.io cuando se entregue el ping URL; corregir issue #84 |
| Observaciones | RNF-001 no cumple p95 < 200 ms en Render (medición 2026-11-24: catálogo p95 605 ms; en local p95 30.7 ms, sí cumple). Mitigación en PNF-001: ping externo y plan siempre activo. RNF-009 quedó con hallazgos de error 401/500, registrados en issue #84. |
| Firmas | Pendiente de @lunethZ y @juanpineda tras aprobación de PRs y simulacro |
