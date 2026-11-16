# RF-055 — Solicitar devolución

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-055 |
| Nombre | Solicitar devolución |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | No implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario solicitar devolución o reembolso de un pedido entregado.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| order_id | UUID | Sí | Debe estar entregado |
| reason | Texto | Sí | Obligatorio |

---

## Proceso

- Usuario envía solicitud.
- Se valida estado del pedido.
- Se crea solicitud de devolución.
- Se pasa a revisión administrativa.

---

## Reglas de negocio

RN-001: Solo pedidos entregados pueden devolverse.