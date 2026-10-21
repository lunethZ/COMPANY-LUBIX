# HU-060 — Hacer seguimiento

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-060 |
| Título | Hacer seguimiento |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-060 |

---

## Historia

Como usuario de Lubix, quiero hacer seguimiento de mi pedido, para conocer el estado de mi envío en todo momento.

---

## Criterios de aceptación

### CA-060.1 — Línea de tiempo de estados

**Dado que** el usuario tiene un pedido en proceso,

**cuando** acceda a la opción de seguimiento,

**entonces** el sistema muestra una línea de tiempo con los estados recorridos y el estado actual del envío.

### CA-060.2 — Fecha estimada de entrega

**Dado que** el pedido está en tránsito,

**cuando** se muestre el seguimiento,

**entonces** el sistema indica la fecha estimada de entrega al usuario.

### CA-060.3 — Información de la empresa de transporte

**Dado que** el pedido ya ha sido enviado,

**cuando** se consulte el seguimiento,

**entonces** el sistema muestra el nombre de la empresa de transporte y el número de guía o tracking del envío.

### CA-060.4 — Actualización en tiempo real

**Dado que** el usuario está visualizando el seguimiento,

**cuando** se produzca un cambio en el estado del envío,

**entonces** el sistema actualiza la información en tiempo real sin requerir recargar la página.

### CA-060.5 — Notificaciones de cambios de estado

**Dado que** el estado del envío cambia,

**cuando** ocurra un evento relevante, como salida del almacén o entrega,

**entonces** el sistema envía una notificación al usuario informando del nuevo estado.

### CA-060.6 — Acceso desde el detalle del pedido

**Dado que** el usuario se encuentra en el detalle de un pedido,

**cuando** pulse sobre la opción de seguimiento,

**entonces** el sistema navega a la pantalla de seguimiento de ese pedido concreto.