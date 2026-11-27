# RF-038 — Eliminar producto del carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-038 |
| Nombre | Eliminar producto del carrito |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir eliminar un producto específico del carrito.

---

## Proceso

- Usuario selecciona eliminar.
- Backend valida producto en carrito.
- Se elimina la línea del carrito.
- Se actualiza total.

---

## Reglas de negocio

RN-001: La eliminación solo afecta el carrito activo.