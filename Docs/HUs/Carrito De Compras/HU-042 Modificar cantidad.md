# HU-042 — Modificar cantidad

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-042 |
| Título | Modificar cantidad |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-042 |

---

## Historia

Como usuario de Lubix, quiero modificar la cantidad de un producto en el carrito, para ajustar las unidades que deseo adquirir.

---

## Criterios de aceptación

### CA-042.1 — Botones de incremento y decremento

**Dado que** tengo productos en el carrito,

**cuando** visualizo un producto dentro del carrito,

**entonces** debo ver botones de "+" y "-" para incrementar o disminuir la cantidad de unidades de ese producto.

### CA-042.2 — Ingreso manual de cantidad

**Dado que** tengo un producto en el carrito,

**cuando** hago clic sobre el campo numérico de la cantidad,

**entonces** debo poder escribir directamente un valor numérico para establecer la cantidad deseada.

### CA-042.3 — Límite máximo por stock

**Dado que** un producto en el carrito tiene un stock disponible de 10 unidades,

**cuando** intento incrementar la cantidad más allá del stock disponible,

**entonces** el sistema no debe permitir que la cantidad supere las 10 unidades y debe mostrar un mensaje indicando que se alcanzó el límite de stock.

### CA-042.4 — Actualización del subtotal y total

**Dado que** modifiqué la cantidad de un producto en el carrito,

**cuando** el sistema procesa el cambio,

**entonces** el subtotal de ese producto y el total general del carrito deben recalcularse automáticamente.

### CA-042.5 — Cantidad mínima

**Dado que** tengo un producto en el carrito con cantidad igual a 1,

**cuando** intento disminuir la cantidad con el botón "-",

**entonces** el sistema no debe permitir valores menores a 1 y el botón "-" debe deshabilitarse.

---
