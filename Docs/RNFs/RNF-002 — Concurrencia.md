# RNF-002 — Concurrencia

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-002 |
| Nombre | Concurrencia |
| Categoría | Scalability |
| Prioridad | Alta |
| Estado | Definido |

---

## Descripción

El sistema debe soportar múltiples usuarios simultáneos sin degradación del rendimiento ni bloqueos en la base de datos.

---

## Especificación

### Meta principal
El sistema debe manejar al menos 100 usuarios concurrentes manteniendo los tiempos de respuesta definidos en RNF-001.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Usuarios concurrentes soportados | >= 100 |
| Pool de conexiones PostgreSQL (SQLAlchemy) | >= 20 conexiones |
| Tiempo de respuesta bajo carga concurrente | Dentro de umbrales RNF-001 |
| Errores por concurrencia (5xx) | < 1% bajo carga normal |

### Estrategia de validación
Pruebas de estrés con Locust simulando incremento progresivo de usuarios. Verificación de comportamiento del connection pool con SQLAlchemy.

### Dependencias
- SQLAlchemy configurado con pool de conexiones
- PostgreSQL con configuración de max_connections adecuada
- FastAPI con workers asíncronos (uvicorn)

