# Informe Final de Verificación de Calidad — LUBIX

**Actividad:** semana 3 · aceptación y sustentación (T7-10)
**Carril:** D · josearmenta2163
**Fecha:** 2026-11-24
**Versión evaluada:** `main` (`2b85add`), desplegada en Render
**Documentos de entrada:** `Docs/Plan_Capacitacion.md`, `Docs/Sesion_Simulada_Capacitacion.md`, `Docs/Pruebas_Aceptacion_Cliente_Simulado.md`

---

## 1. Objetivo

Consolidar los resultados de la verificación de calidad del cierre: capacitación, pruebas de aceptación por rol y estado de los controles técnicos, para decidir si el producto es aceptable para la entrega.

## 2. Alcance verificado

| Frente | Qué se verificó | Evidencia |
|---|---|---|
| Aceptación funcional | Casos PA-01 a PA-06 sobre la plataforma desplegada | `Docs/Evidencias/semana3/` |
| Capacitación | Guion de dos sesiones, asistencia y práctica por rol | `Docs/Sesion_Simulada_Capacitacion.md` |
| Integración continua | Umbrales 80/80, lint, build y pruebas PostgreSQL | `.github/workflows/ci.yml`, `.github/workflows/sonarcloud.yml` |
| Operación | Healthchecks y despliegue en Render | `/health`, `/health/database` |

## 3. Resultados de aceptación

| Caso | Rol | Resultado |
|---|---|---|
| PA-01 Ingreso | Usuario Final | Aprobado |
| PA-02 Compra completa | Usuario Final | Aprobado |
| PA-03 Publicación de producto | Empresa | Aprobado |
| PA-04 Estados del pedido | Empresa | Aprobado |
| PA-05 Validación de empresa | Administrador | No aprobado (bloqueado por D-01) |
| PA-06 Resolución de PQRS | Administrador | Aprobado |

**Resultado:** 5 de 6 casos aprobados. Se cumple el criterio mínimo (5 de 6) con observaciones y defecto registrado.

## 4. Defectos y hallazgos

| ID | Descripción | Severidad | Estado | Acción |
|---|---|---|---|---|
| D-01 | En producción el registro de empresa devuelve HTTP 500 y la subida de archivos falla porque el host `minio` no resuelve; el certificado del registro y las imágenes dependen de ese almacenamiento | P2 | Abierto | Configurar MinIO/S3 en Render o desacoplar el certificado del registro |
| D-02 | La acción **Validar empresa** está en **Resumen**, no en **Empresas** como indica el manual | P4 | Abierto | Alinear manual o mover la acción |
| H-01 | Catálogo con latencia alta en el plan gratuito de Render (RNF-001) | P3 | Con mitigación | Mantener la instancia activa y medir con monitor externo |
| H-02 | Códigos de error inconsistentes en rutas inexistentes y UUID inválidos (RNF-009) | P3 | En seguimiento | Issue #84 |

## 5. Controles técnicos

- **CI:** lint, pruebas con cobertura mínima del 80 %, build de producción y pruebas de integración contra PostgreSQL 16 en cada PR; imágenes Docker solo se publican al fusionar a `main`.
- **Calidad estática:** SonarCloud con Quality Gate y cobertura alineada al mismo umbral.
- **Respaldos:** procedimiento cifrado con verificación de restauración documentado en `Docs/Respaldo_v1_Operativo.md`.

## 6. Conclusión

La versión evaluada es **aceptable con observaciones**. Los flujos de Usuario Final y Empresa funcionan de extremo a extremo sobre la plataforma desplegada, la administración de PQRS opera y los controles de CI y respaldo están documentados y verificados. El registro de empresas y la subida de archivos no operan en producción por la ausencia de almacenamiento compatible (D-01); debe resolverse antes de la puesta en producción definitiva. Se recomienda registrar el defecto en el repositorio y repetir PA-05 cuando el almacenamiento esté disponible.

## 7. Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Facilitador (josearmenta2163) | Jose Armenta | Pendiente de rúbrica | 2026-11-24 |
| Responsable de calidad | Equipo de calidad LUBIX | Pendiente de rúbrica | 2026-11-24 |
| Cliente simulado | Perfiles demo | Pendiente de rúbrica | 2026-11-24 |
