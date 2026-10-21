# HU-053 — Ver detalle del pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-053 |
| Título | Ver detalle del pedido |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-053 |

---

## Historia

Como usuario de Lubix, quiero ver el detalle de un pedido, para consultar la información completa de mis compras.

---

## Criterios de aceptación

### CA-053.1 — Datos generales del pedido

**Dado que** el usuario selecciona un pedido de su historial,

**cuando** se abra la pantalla de detalle,

**entonces** el sistema muestra el número de pedido, la fecha de creación, el estado actual y el método de pago utilizado.

### CA-053.2 — Lista de artículos

**Dado que** el pedido contiene productos,

**cuando** se visualice el detalle,

**entonces** el sistema muestra cada artículo con su nombre, imagen, cantidad, precio unitario y subtotal.

### CA-053.3 — Línea de tiempo de estados

**Dado que** el pedido ha pasado por varias etapas del proceso,

**cuando** se muestre la información del pedido,

**entonces** el sistema presenta una línea de tiempo con las fechas de cada cambio de estado, desde la confirmación hasta el estado actual.

### CA-053.4 — Dirección de envío

**Dado que** el pedido incluye un envío físico,

**cuando** se visualice el detalle,

**entonces** el sistema muestra la dirección de envío completa con nombre del destinatario y números de contacto.

### CA-053.5 — Desglose del total

**Dado que** el usuario quiere conocer el costo final,

**cuando** se visualice la sección de totales,

**entonces** el sistema desglosa el subtotal de productos, el costo de envío, los descuentos aplicados y los impuestos, mostrando el total a pagar.

### CA-053.6 — Acceso desde el historial

**Dado que** el usuario se encuentra en el listado de pedidos,

**cuando** pulse sobre un pedido concreto,

**entonces** el sistema navega al detalle completo de ese pedido en lugar de otro.

---
