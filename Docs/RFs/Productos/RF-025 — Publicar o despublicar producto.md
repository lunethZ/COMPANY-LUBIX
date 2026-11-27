# RF-025 — Publicar o despublicar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-025 |
| Nombre | Publicar o despublicar producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir activar o desactivar productos en el catálogo público.

---

## Proceso

- Usuario cambia estado del producto.
- Backend actualiza visibilidad.
- Producto se muestra o se oculta.

---

## Reglas de negocio

RN-001: Solo productos publicados aparecen en el catálogo.  
RN-002: Productos despublicados no pueden ser comprados.