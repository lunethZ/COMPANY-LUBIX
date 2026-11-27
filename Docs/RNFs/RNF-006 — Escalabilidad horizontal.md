# RNF-006 — Escalabilidad horizontal

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-006 |
| Nombre | Escalabilidad horizontal |
| Categoría | Scalability |
| Prioridad | Media |
| Estado | Verificado (arquitectura) |

---

## Descripción

El sistema debe poder escalar horizontalmente agregando más instancias para soportar incrementos en la carga de trabajo.

---

## Especificación

### Meta principal
El backend debe ser desplegable en múltiples instancias Docker sin estado (stateless) para permitir escalabilidad horizontal.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Backend desplegado en Docker | Si |
| Estado del backend | Stateless (sin datos en memoria) |
| Base de datos escalable | PostgreSQL con réplicas de lectura |
| Almacenamiento de archivos | MinIO distribuido |
| Balanceador de carga | Configurado para distribuir peticiones |

### Estrategia de validación
Despliegue de al menos 2 instancias del backend detrás de un load balancer. Verificar que el sistema funcione correctamente distribuyendo peticiones entre instancias.

### Dependencias
- Docker y Docker Compose para empaquetado
- PostgreSQL con soporte de réplicas
- MinIO configurado en modo distribuido
- Variables de entorno centralizadas (sin estado local)

---

## Estado de verificación

| Estado actual | Método / Evidencia | Fecha |
|---------------|--------------------|-------|
| Verificado (arquitectura) | Backend stateless contenedorizado preparado para réplicas horizontales | 2026-11-24 |
