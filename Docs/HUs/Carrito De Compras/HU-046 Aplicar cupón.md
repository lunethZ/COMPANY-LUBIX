# HU-046 — Aplicar cupones de descuento

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-046 |
| Título | Aplicar cupones de descuento |
| Módulo | Carrito |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-046 |

---

## Historia

Como usuario de Lubix, quiero aplicar cupones de descuento, para obtener beneficios en mis compras.

---

## Criterios de aceptación

### CA-046.1 — Campo de entrada de cupón

**Dado que** estoy en la página del carrito de compras,

**cuando** visualizo el resumen del pedido,

**entonces** debe existir un campo de texto para ingresar un código de cupón junto con un botón "Aplicar".

### CA-046.2 — Cupón válido

**Dado que** ingresé un código de cupón que existe y está vigente en el sistema,

**cuando** hago clic en "Aplicar",

**entonces** el descuento asociado al cupón debe calcularse y restarse del subtotal, mostrando el monto descontado en el resumen.

### CA-046.3 — Cupón inválido o expirado

**Dado que** ingresé un código de cupón que no existe o que ya expiró,

**cuando** hago clic en "Aplicar",

**entonces** el sistema debe mostrar un mensaje de error indicando que el cupón no es válido o ha expirado, sin modificar el total.

### CA-046.4 — Cupón ya aplicado

**Dado que** ya tengo un cupón de descuento aplicado en el carrito,

**cuando** intento ingresar y aplicar un nuevo código de cupón,

**entonces** el sistema debe mostrar un mensaje indicando que ya existe un cupón activo y debe solicitar confirmación para reemplazarlo.

### CA-046.5 — Descuento reflejado en el total

**Dado que** un cupón con un descuento del 10% fue aplicado correctamente,

**cuando** se actualiza el resumen del carrito,

**entonces** debe visualizarse el porcentaje o monto descontado y el total a pagar debe reducirse en consecuencia.

---
