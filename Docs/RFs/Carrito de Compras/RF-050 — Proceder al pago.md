# RF-050 — Proceder al pago

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-050 |
| Nombre | Proceder al pago |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir iniciar el proceso de pago con los productos del carrito.

---

## Proceso

- Usuario confirma carrito.
- Sistema valida stock final.
- Se genera orden de compra.
- Se redirige a módulo de pagos.

---

## Reglas de negocio

RN-001: No se puede proceder si el carrito está vacío.  
RN-002: Se debe bloquear stock al iniciar pago.