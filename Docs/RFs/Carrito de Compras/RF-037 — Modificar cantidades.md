# RF-037 — Modificar cantidad de productos en el carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-037 |
| Nombre | Modificar cantidad |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario aumentar o disminuir la cantidad de un producto dentro del carrito.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| product_id | UUID | Sí | Debe existir en carrito |
| quantity | Entero | Sí | > 0 y ≤ stock |

---

## Proceso

- Usuario modifica cantidad.
- Backend valida stock.
- Se actualiza línea del carrito.
- Se recalcula total.

---

## Reglas de negocio

RN-001: No se permite cantidad mayor al stock.  
RN-002: Si cantidad llega a 0, se elimina el producto.