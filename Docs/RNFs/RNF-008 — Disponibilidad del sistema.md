# RNF-008 — Disponibilidad del sistema

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-008 |
| Nombre | Disponibilidad del sistema |
| Categoría | Availability |
| Prioridad | Alta |
| Estado | Verificado |

---

## Descripción

El sistema debe mantener un nivel de disponibilidad elevado que garantice el acceso continuo de los usuarios a la plataforma.

---

## Especificación

### Meta principal
El sistema debe estar disponible al menos el 99.5% del tiempo en un período mensual, con recuperación automática ante fallos.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Uptime mensual | >= 99.5% |
| Endpoints de health check | /health, /health/database, /health/storage y /health/internet operativos |
| Manejo de errores | Errores 500 devuelven respuesta graceful |
| Reinicio automático | Docker restart policy: always |
| Tiempo de recuperación ante caída | < 2 minutos |

### Estrategia de validación
Monitoreo continuo con herramientas como UptimeRobot o Prometheus Alertmanager. Simulación de fallos para verificar recuperación automática de Docker.

### Dependencias
- Docker con restart policy configurada
- Health check endpoints implementados en FastAPI
- Monitoreo de infraestructura activo

---

## Estado de verificación

| Estado actual | Método / Evidencia | Fecha |
|---------------|--------------------|-------|
| Verificado | Endpoints /health, /health/database, /health/storage y /health/internet activos + políticas restart en Docker | 2026-11-27 |
