# RF-020 — Eliminar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-020 |
| Nombre | Eliminar producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir eliminar productos del catálogo.

---

## Proceso

- Vendedor selecciona producto.
- Se valida propiedad.
- Se elimina o desactiva producto.
- Se actualiza catálogo.

---

## Reglas de negocio

RN-001: No se elimina si está en pedidos activos.  
RN-002: Puede hacerse eliminación lógica (soft delete).