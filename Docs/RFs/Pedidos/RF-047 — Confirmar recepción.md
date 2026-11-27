# RF-047 — Confirmar recepción de pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-047 |
| Nombre | Confirmar recepción |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario confirmar que recibió su pedido correctamente.

---

## Proceso

- Usuario marca pedido como recibido.
- Backend actualiza estado a “entregado confirmado”.
- Se habilitan reseñas y devoluciones.

---

## Reglas de negocio

RN-001: Solo pedidos entregados pueden confirmarse.