# HU-029 — Duplicar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-029 |
| Título | Duplicar producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-029 |

---

## Historia

Como vendedor de Lubix, quiero duplicar un producto existente, para crear fácilmente nuevos productos con características similares.

---

## Criterios de aceptación

### CA-029.1 — Lista de pedidos recibidos

**Dado que** soy un vendedor autenticado con pedidos realizados,

**cuando** accedo a la sección de pedidos,

**entonces** veo una lista con todos los pedidos recibidos sobre mis productos.

### CA-029.2 — Información resumida del pedido

**Dado que** reviso la lista de pedidos,

**cuando** observo cada pedido,

**entonces** veo información resumida como número de pedido, fecha y estado.

### CA-029.3 — Detalle completo del pedido

**Dado que** selecciono un pedido de la lista,

**cuando** abro su detalle,

**entonces** veo los productos, cantidades, precio total, dirección de envío y datos del comprador.

### CA-029.4 — Cambio de estado del pedido

**Dado que** estoy en el detalle de un pedido,

**cuando** avanzo el pedido por su proceso,

**entonces** puedo cambiar su estado a las etapas definidas, como "En preparación" o "Enviado".

### CA-029.5 — Notificación de cambio de estado

**Dado que** cambio el estado de un pedido,

**cuando** el sistema registra el cambio,

**entonces** el comprador es notificado del nuevo estado de su pedido.

### CA-029.6 — Restricción de estados permitidos

**Dado que** intento cambiar el estado de un pedido,

**cuando** el nuevo estado no es válido para la etapa actual,

**entonces** el sistema impide el cambio y muestra un aviso.

---

