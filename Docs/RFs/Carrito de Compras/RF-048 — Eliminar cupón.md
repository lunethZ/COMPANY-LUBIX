# RF-048 — Eliminar cupón de descuento

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-048 |
| Nombre | Eliminar cupón |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | No implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir remover un cupón aplicado al carrito.

---

## Proceso

- Usuario elimina cupón.
- Se recalcula total sin descuento.
- Se actualiza carrito.

---

## Reglas de negocio

RN-001: El cupón puede reutilizarse si sigue vigente.