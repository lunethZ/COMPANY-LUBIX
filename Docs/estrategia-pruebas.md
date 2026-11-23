# Estrategia de Pruebas — LUBIX

## 1. Propósito y alcance

Definir la estrategia, niveles de prueba, herramientas, criterios de aceptación y métricas vigentes de aseguramiento de calidad para el backend (FastAPI / Python) y el frontend (React / TypeScript) de la plataforma **LUBIX**, sustituyendo la línea base inicial del 18 de octubre de 2026.

## 2. Niveles y tipos de prueba

- **Pruebas unitarias (`pytest`):** Validación aislada de servicios (`AuthService`, `JWTService`, `EmailService`, `NasService`, catálogo, carrito, pedidos y PQRS), validadores y utilidades usando dobles (`unittest.mock`).
- **Pruebas de API e integración (`pytest` + `TestClient`):** Verificación de endpoints REST, códigos HTTP, esquemas Pydantic, autenticación JWT y flujos completos contra base de datos SQLite en memoria.
- **Pruebas de componentes y frontend (`Vitest` + Testing Library):** Validación de vistas, contextos (`AuthModalContext`, `CartContext`) y flujos de usuario en `frontend/src/`. La configuración de `frontend/vite.config.ts` exige un umbral global de **80 % de líneas** y umbrales por página de **40 %** en las vistas críticas (`Home`, `buscar-producto`, `carrito`, `dashboard-empresa`, entre otras).
- **Pruebas de extremo a extremo (Playwright):** Suite `frontend/e2e/` ejecutable con `npm run test:e2e` para los flujos principales sobre el navegador.
- **Análisis estático y calidad de código:** Ejecución automatizada de linters (`ESLint`) y análisis continuo en **SonarQube Cloud** en cada Pull Request hacia `Develop` y `main`.

## 3. Entorno y herramientas de ejecución

- **Backend:** Python 3.14, `pytest`, `pytest-cov`, `coverage`, SQLite en memoria para aislamiento de datos.
- **Frontend:** Node.js, `Vitest`, `ESLint`, TypeScript.
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml` y `.github/workflows/sonarcloud.yml`).
- **Comando de ejecución backend:**
  ```bash
  python -m pytest --cov=app --cov-report=term-missing
  ```
- **Comando de ejecución frontend:** `npm run test:coverage` (Vitest) y `npm run test:e2e` (Playwright).

## 4. Evolución y línea base histórica

- **Línea base inicial (2026-10-18):** `0 %` de cobertura (`0/309` líneas cubiertas) con un único test de humo en `tests/test_main.py`.
- **Iteración 1 — Primeras pruebas unitarias (2026-10-18):** `22 %` de cobertura (`309/397` statements) con **13 pruebas** (`test_main.py`, `test_email_service.py`, `test_nas_service.py`) y umbral inicial configurado en `50 %`.
- **Consolidación actual (2026-11-16):** Unificación de suites de prueba (`p03-p04-unificar-suites-umbral-80`), alcanzando **528 pruebas** ejecutadas con éxito y una cobertura global de **~89 %** en el backend.

## 5. Estado actual de cobertura y métricas

- **Fecha de actualización:** 2026-11-16

| Métrica / Componente | Valor registrado (2026-11-16) | Referencia anterior (2026-10-18) | Estado |
|----------------------|-------------------------------|------------------------------------|--------|
| **Suite backend (`pytest`)** | **528 pruebas aprobadas** | 13 pruebas | Actualizado |
| **Cobertura global backend (`app/`)** | **~89 %** | 22 % | Supera umbral |
| **Umbral mínimo exigido (`fail_under`)** | **75 %** | 50 % | Cumple |
| **Quality Gate (SonarQube Cloud)** | **>= 80 % en código nuevo** | — | Activo en CI |

## 6. Criterios de aceptación y umbrales de calidad

- **Umbral de cobertura backend:** Configurado en **75 %** (`fail_under = 75` en `backend/pyproject.toml` y `--cov-fail-under=75` en `backend/pytest.ini`). Todo Pull Request que descienda por debajo de este porcentaje falla automáticamente en CI.
- **Umbral de cobertura frontend:** Cobertura global mínima de **80 % de líneas** mediante los `thresholds` de Vitest en `frontend/vite.config.ts`, con exigencias específicas por página en las vistas críticas.
- **Cero fallos en suite:** El 100 % de las **528 pruebas** deben aprobar antes de fusionar cambios en `Develop` o `main`.
- **Estándar SonarCloud:** Cobertura mínima del **80 %** sobre código nuevo y cero vulnerabilidades críticas bloqueantes.

## 7. Mantenimiento y próximos pasos

- Mantener la cobertura del backend por encima del umbral obligatorio del **75 %** (actualmente en **~89 %**) ante cada nuevo endpoint o regla de negocio.
- Ampliar la cobertura de pruebas end-to-end y de componentes en el frontend (`Vitest`).
- Incorporar pruebas unitarias para el módulo de compartir producto (`RF-040`) cuando salga de deuda técnica e ingrese al alcance funcional.
- Dar seguimiento a las métricas por característica de calidad (ISO/IEC 25010) en el documento complementario `Docs/Plan_QA_ISO25010.md`.
