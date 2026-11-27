# RF-046 — Cancelar pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-046 |
| Nombre | Cancelar pedido |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir cancelar pedidos siempre que no hayan sido enviados o procesados.

---

## Proceso

- Usuario solicita cancelación.
- Backend valida estado del pedido.
- Si es válido, se cambia estado a “cancelado”.
- Se libera stock reservado.

---

## Reglas de negocio

RN-001: No se puede cancelar pedidos enviados.  
RN-002: El stock debe liberarse automáticamente.