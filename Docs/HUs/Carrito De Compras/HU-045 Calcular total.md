# HU-045 — Calcular total

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-045 |
| Título | Calcular total |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-045 |

---

## Historia

Como usuario de Lubix, quiero ver el total de mi compra, para conocer el costo final con impuestos y envío.

---

## Criterios de aceptación

### CA-045.1 — Visualización del subtotal

**Dado que** tengo productos en el carrito,

**cuando** reviso el resumen del carrito,

**entonces** debe mostrarse el subtotal calculado como la suma del precio unitario multiplicado por la cantidad de cada producto.

### CA-045.2 — Cálculo de impuestos

**Dado que** tengo productos en el carrito,

**cuando** el sistema calcula el total,

**entonces** debe incluirse el monto de impuestos aplicables calculado automáticamente según la legislación vigente.

### CA-045.3 — Costo de envío

**Dado que** tengo productos en el carrito y seleccioné una dirección de envío,

**cuando** se genera el resumen de compra,

**entonces** debe mostrarse el costo de envío estimado según la dirección y el método de envío seleccionado.

### CA-045.4 — Total general

**Dado que** el carrito contiene productos, impuestos y costo de envío,

**cuando** se muestra el resumen completo,

**entonces** el monto total a pagar debe ser la suma del subtotal, los impuestos y el costo de envío, desglosados de forma visible.

### CA-045.5 — Descuento por cupón aplicado

**Dado que** apliqué un cupón de descuento válido en el carrito,

**cuando** se recalcula el total,

**entonces** el monto del descuento debe restarse del subtotal antes de calcular impuestos y el total final debe reflejar dicha reducción.

---
