# HU-054 — Cancelar pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-054 |
| Título | Cancelar pedido |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-054 |

---

## Historia

Como usuario de Lubix, quiero cancelar un pedido que aún no ha sido enviado, para anular mi compra y evitar costos innecesarios.

---

## Criterios de aceptación

### CA-054.1 — Opción de cancelar

**Dado que** el usuario visualiza el detalle de un pedido,

**cuando** el pedido se encuentre en un estado cancelable,

**entonces** el sistema muestra un botón para cancelar el pedido de forma visible y accesible.

### CA-054.2 — Restricción por estado

**Dado que** el pedido ya ha sido enviado o entregado,

**cuando** el usuario intente cancelarlo,

**entonces** el sistema no permite la cancelación y muestra un mensaje indicando que el pedido ya no puede cancelarse.

### CA-054.3 — Diálogo de confirmación

**Dado que** el usuario pulsa el botón de cancelar,

**cuando** se solicite la cancelación,

**entonces** el sistema muestra un diálogo de confirmación y solo efectúa la cancelación si el usuario confirma de forma explícita.

### CA-054.4 — Restauración de stock

**Dado que** la cancelación se ha confirmado,

**cuando** el sistema procesa la cancelación,

**entonces** las cantidades de los productos del pedido se devuelven al inventario disponible.

### CA-054.5 — Notificación de cancelación

**Dado que** el pedido ha sido cancelado,

**cuando** se complete el proceso,

**entonces** el sistema notifica al usuario de la cancelación y actualiza el estado del pedido a "cancelado".

### CA-054.6 — Proceso de reembolso

**Dado que** el pedido cancelado fue pagado,

**cuando** la cancelación se confirme,

**entonces** el sistema inicia el reembolso del importe por el método de pago original y lo refleja en el estado del pedido.

---
