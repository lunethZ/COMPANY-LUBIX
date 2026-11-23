# Plan de Aseguramiento de Calidad (QA) — LUBIX

**Estándar de referencia:** ISO/IEC 25010 (modelo de calidad del producto software)
**Documento complementario:** `Docs/estrategia-pruebas.md`
**Última actualización:** 2026-11-20

---

## 1. Propósito y alcance

Definir cómo se asegura la calidad de LUBIX durante el ciclo de desarrollo, qué características de calidad se miden, con qué fórmulas y herramientas, cuáles son las metas y qué decisiones se tomaron a partir de los resultados obtenidos.

El plan cubre el backend (FastAPI / Python), el frontend web (React / TypeScript), la aplicación móvil (React Native / Expo) en lo relativo a pruebas automatizadas disponibles y los procesos manuales de verificación de la plataforma desplegada. No cubre la infraestructura de servidores ni la operación de la mesa de ayuda, que se documentan en `1.1.8` y en `Seguridad_Servidor.md`.

## 2. Modelo de calidad aplicado (ISO/IEC 25010)

| Característica | Subcaracterísticas evaluadas | Cómo se verifica en LUBIX | Evidencia |
|---|---|---|---|
| **Adecuación funcional** | Completitud, corrección, pertinencia | Pruebas unitarias, de API e integración sobre los flujos de auth, catálogo, carrito, pedidos, PQRS y dashboards | `backend/tests/`, `frontend/src/**/*.test.tsx` |
| **Eficiencia de desempeño** | Comportamiento temporal, utilización de recursos | Medición manual de tiempos de respuesta y revisión de consultas; RNF-001 como meta | `Docs/Pruebas_No_Funcionales.txt`, métricas de Render |
| **Compatibilidad** | Coexistencia, interoperabilidad | Pruebas del contrato REST entre web, móvil y API; CORS y JWT compartidos | `backend/tests/api/`, `frontend/src/api/*.test.ts` |
| **Usabilidad** | Reconocibilidad, aprendibilidad, operabilidad, protección frente a errores, accesibilidad | Revisión heurística con las capturas reales del manual; mensajes de error documentados en 1.1.9 | `Docs/Manual Tecnico De Usuario/` |
| **Fiabilidad** | Ausencia de fallos, disponibilidad, tolerancia a fallos, recuperabilidad | Suite automatizada, health checks, pruebas de repositorio contra PostgreSQL real | `ci.yml`, `/health/database` |
| **Seguridad** | Confidencialidad, integridad, autenticidad, responsabilidad | Pruebas de autenticación y autorización por rol, auditoría de dependencias, revisión de middlewares | `tests/test_auth_middleware.py`, `test_jwt_service.py`, `AUDITORIA.md` |
| **Mantenibilidad** | Analizabilidad, capacidad de ser modificado, capacidad de ser probado | ESLint, TypeScript, SonarQube Cloud, estructura por capas y umbrales de cobertura | `sonarcloud.yml`, `ci.yml` |
| **Portabilidad** | Adaptabilidad, instalabilidad, reemplazabilidad | Despliegue en Render, configuración por variables de entorno, contenedores | `DEPLOYMENT.md`, `Estrategia_Hosting_y_Dominio.md` |

## 3. Objetivos medibles

| Objetivo | Meta | Estado (2026-11-20) |
|---|---|---|
| Cobertura del backend | ≥ 75 % | Cumple (~89 %) |
| Pruebas del backend aprobadas | 100 % de la suite | Cumple (528/528) |
| Cobertura global del frontend (líneas) | ≥ 80 % | Umbral configurado en Vitest y aplicado en CI |
| Cobertura de código nuevo en SonarQube Cloud | ≥ 80 % | Activo en CI |
| Vulnerabilidades críticas abiertas | 0 | Criterio del Quality Gate; se verifica en cada PR |
| Flujos críticos cubiertos por E2E | Login, catálogo, carrito, checkout | Suite `frontend/e2e/` disponible |
| Defectos P1 abiertos | 0 al cierre de iteración | Sin P1 abiertos |

## 4. Métricas, fórmulas y fuentes

| ID | Métrica | Fórmula | Herramienta / fuente | Meta | Último resultado | Fecha |
|---|---|---|---|---|---|---|
| M-01 | Cobertura backend (`app/`) | líneas cubiertas ÷ líneas ejecutables × 100 | `coverage.py` vía `pytest --cov=app` | ≥ 75 % | ~89 % | 2026-11-16 |
| M-02 | Tasa de éxito backend | pruebas aprobadas ÷ pruebas ejecutadas × 100 | `pytest` | 100 % | 528/528 (100 %) | 2026-11-16 |
| M-03 | Cobertura frontend | líneas cubiertas ÷ líneas × 100 | Vitest (v8) + `thresholds` | ≥ 80 % global; ≥ 40 % por página crítica | Reportada en CI y Sonar | 2026-11-20 |
| M-04 | Cobertura de código nuevo | líneas nuevas cubiertas ÷ líneas nuevas × 100 | SonarQube Cloud | ≥ 80 % | Quality Gate activo | 2026-11-20 |
| M-05 | Densidad de defectos | defectos confirmados ÷ KLOC | Revisión + Sonar | < 2 por KLOC | En seguimiento | 2026-11-20 |
| M-06 | Cumplimiento de SLA de soporte | tickets respondidos en plazo ÷ tickets totales × 100 | Mesa de ayuda (1.1.8) | ≥ 90 % | Sin medición formal | — |
| M-07 | Tiempo medio de resolución (MTTR) | Σ tiempo de resolución ÷ tickets cerrados | Mesa de ayuda | ≤ 2 días hábiles (P3) | Sin medición formal | — |
| M-08 | Tiempo de respuesta API | percentil 95 de latencia | Render + pruebas manuales | < 200 ms (RNF-001) | Pendiente de prueba formal | — |
| M-09 | Cobertura del manual | secciones con capturas ÷ secciones del manual × 100 | Revisión documental | 100 % de secciones verificables | 1.1.5, 1.1.7, 1.1.9 con capturas reales | 2026-11-20 |

## 5. Niveles de prueba y responsabilidades

| Nivel | Qué valida | Responsable | Cuándo |
|---|---|---|---|
| Unitarias (`pytest`, marcador `unit`) | Servicios y utilidades aislados | Desarrollo backend | En cada commit / PR |
| API e integración (`pytest`, `TestClient`, marcador `api`/`integration`) | Endpoints, roles, códigos HTTP, flujos con BD de prueba | Desarrollo backend | En cada PR |
| Repositorios (`pytest tests/repositories/`) | Consultas contra PostgreSQL real | Desarrollo backend | CI |
| Componentes y páginas (Vitest + Testing Library) | Vistas, contextos y flujos web | Desarrollo frontend | En cada PR |
| Extremo a extremo (Playwright) | Recorridos completos en navegador | QA | Antes de release |
| Manual / exploratoria | Casos no automatizables, usabilidad y mensajes | QA | Por iteración y antes de release |
| Análisis estático | Lint, tipos y Quality Gate | CI + SonarQube Cloud | En cada PR |

## 6. Entornos y datos de prueba

- **CI:** GitHub Actions (`ci.yml`, `sonarcloud.yml`) con Node.js y Python; SQLite en memoria para la suite de API y PostgreSQL de servicio para `tests/repositories/`.
- **Producción controlada:** frontend y API en Render, base de datos Neon. Las verificaciones manuales se realizan con **cuentas de prueba** (`manual.usuario@`, `manual.empresa@`, `manual.admin@`) y datos ficticios.
- **Regla de datos:** ninguna captura, ticket ni evidencia debe contener datos personales reales; los correos de terceros se difuminan antes de publicar (aplicado en las capturas del manual).

## 7. Criterios de entrada y salida

**Entrada (antes de probar):** build compilando, migraciones aplicadas, variables de entorno configuradas, PR con descripción del cambio.

**Salida (para fusionar a `Develop` o `main`):**

1. `pytest` completo en verde y cobertura ≥ 75 %.
2. `npm run test:coverage` en verde con los umbrales de Vitest.
3. `npm run lint` sin errores.
4. Quality Gate de SonarQube Cloud aprobado (≥ 80 % en código nuevo, sin vulnerabilidades críticas).
5. Cero defectos P1/P2 abiertos sin aceptación documentada.

## 8. Decisiones tomadas a partir de las mediciones

| Medición | Hallazgo | Decisión |
|---|---|---|
| Cobertura backend 22 % (2026-10-18) | Suite insuficiente para el tamaño del backend | Se fijó umbral inicial de 50 % y se priorizaron pruebas de servicios |
| Cobertura backend ~89 % y 528 pruebas (2026-11-16) | La meta inicial quedó corta | Se elevó el umbral obligatorio de 50 % a **80 %** y se unificaron las suites; S6 lo estandariza en **75 %** |
| Brechas de cobertura en páginas del frontend | Cobertura global no garantizaba vistas críticas | Se añadieron umbrales por página (40 %) en `vite.config.ts` para las vistas de mayor riesgo |
| Revisión ISO 25010 (2026-10-05): ASISTENCIA AL USUARIO sin FAQ | El usuario dependía de soporte externo para dudas básicas | Se creó la sección **1.1.10 Preguntas frecuentes** dentro del manual (2026-11-20) |
| Campaña de capturas reales (2026-11-19/20) | El catálogo se queda cargando para sesiones que no son de empresa | Se registró como defecto P2, se documentó la conducta en la FAQ y se añadió a la lista de casos E2E |
| Quality Gate de SonarQube Cloud | El umbral 80 % solo existía en pytest | Se alineó el pipeline de Sonar para exigir el mismo umbral que la suite local |

## 9. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cold start del plan gratuito de Render | Latencias altas en la primera petición; falsos negativos en pruebas de desempeño | Medir tras calentar el servicio y registrar la condición en los reportes |
| Datos de prueba en la base de producción | Contaminación de métricas y del catálogo real | Uso exclusivo de cuentas `@lubix-demo.com` y limpieza periódica |
| Umbrales por página bajos (40 %) | Vistas críticas con cobertura parcial | Plan de subida progresiva a 60 % y luego 80 % |
| Pruebas E2E dependientes del entorno desplegado | Resultados inestables | Ejecutar contra un entorno de staging y con datos precargados |
| Defectos funcionales conocidos (p. ej. catálogo para sesiones no empresariales) | Experiencia afectada en producción | Seguimiento como defecto P2 y verificación en cada release |

## 10. Seguimiento y revisión

- Las métricas M-01 a M-05 se recalculan en cada PR y se revisan al cierre de cada iteración.
- El presente plan se revisa junto con `estrategia-pruebas.md` y se actualiza cuando cambian umbrales, herramientas o alcance funcional.
- Los resultados se registran con fecha para mantener la trazabilidad histórica de la calidad del producto.
