# RF-040 — Calcular total del carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-040 |
| Nombre | Calcular total |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe calcular automáticamente el total del carrito incluyendo subtotales, impuestos y descuentos.

---

## Proceso

- Se suman precios × cantidades.
- Se aplican descuentos si existen.
- Se calculan impuestos.
- Se retorna total final.

---

## Reglas de negocio

RN-001: El total debe actualizarse en tiempo real.