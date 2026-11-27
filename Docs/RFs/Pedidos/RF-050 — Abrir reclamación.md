# RF-050 — Abrir reclamación

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-050 |
| Nombre | Abrir reclamación |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir a los usuarios abrir una reclamación sobre un pedido.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| order_id | UUID | Sí | Debe existir |
| description | Texto | Sí | Obligatorio |

---

## Proceso

- Usuario envía reclamación.
- Se registra ticket.
- Se asigna a soporte o vendedor.
- Se cambia estado a “en revisión”.

---

## Reglas de negocio

RN-001: Toda reclamación debe ser registrada como ticket.