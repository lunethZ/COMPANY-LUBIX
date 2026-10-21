# HU-056 — Confirmar recepción

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-056 |
| Título | Confirmar recepción |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-056 |

---

## Historia

Como usuario de Lubix, quiero confirmar la recepción de mi pedido, para que el sistema registre que he recibiado mi compra.

---

## Criterios de aceptación

### CA-056.1 — Botón de confirmación

**Dado que** el usuario visualiza el detalle de un pedido enviado,

**cuando** el pedido esté en tránsito o en estado de entregado pendiente de confirmación,

**entonces** el sistema muestra un botón para confirmar la recepción del pedido.

### CA-056.2 — Solo para pedidos entregados

**Dado que** el pedido aún no ha sido marcado como entregado,

**cuando** el usuario intente confirmar la recepción,

**entonces** el sistema no permite la confirmación hasta que el pedido haya sido efectivamente entregado.

### CA-056.3 — Solicitud de calificación

**Dado que** el usuario confirma la recepción del pedido,

**cuando** la confirmación se complete,

**entonces** el sistema muestra una invitación para calificar el pedido y sus productos.

### CA-056.4 — Actualización de estado

**Dado que** el usuario ha confirmado la recepción,

**cuando** se registre la confirmación,

**entonces** el sistema actualiza el estado del pedido a "entregado" y guarda la fecha de confirmación.

### CA-056.5 — Accesible solo una vez

**Dado que** el pedido ya fue confirmado como recibido,

**cuando** el usuario vuelva a ver el pedido,

**entonces** el sistema oculta el botón de confirmación y no permite confirmar el mismo pedido más de una vez.

---
