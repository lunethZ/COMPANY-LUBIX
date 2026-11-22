# RF-047 — Aplicar cupón de descuento

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-047 |
| Nombre | Aplicar cupón |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | No implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir aplicar cupones de descuento válidos al carrito de compras.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| coupon_code | Texto | Sí | Debe existir y estar activo |

---

## Proceso

- Usuario ingresa cupón.
- Backend valida existencia.
- Se verifica vigencia.
- Se aplica descuento al total.

---

## Reglas de negocio

RN-001: Un cupón puede tener límite de uso.  
RN-002: No acumulable con otros descuentos.