# HU-041 — Agregar productos al carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-041 |
| Título | Agregar productos al carrito |
| Módulo | Carrito |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-041 |

---

## Historia

Como usuario de Lubix, quiero agregar productos al carrito, para poder comprarlos posteriormente.

---

## Criterios de aceptación

### CA-041.1 — Botón visible

**Dado que** estoy en la página de detalle de un producto con stock disponible,

**cuando** visualizo la información del producto,

**entonces** debe mostrarse un botón claramente identificado como "Agregar al carrito".

### CA-041.2 — Selección de cantidad

**Dado que** estoy en la página de detalle de un producto,

**cuando** deseo agregar el producto al carrito,

**entonces** debo poder seleccionar la cantidad unidades antes de agregar, comenzando por defecto en 1.

### CA-041.3 — Mensaje de confirmación

**Dado que** he hecho clic en "Agregar al carrito" con una cantidad válida,

**cuando** el sistema procesa la acción,

**entonces** debe mostrarse un mensaje de notificación indicando que el producto fue agregado exitosamente al carrito.

### CA-041.4 — Actualización del contador del carrito

**Dado que** agregué un producto al carrito,

**cuando** se completa la acción,

**entonces** el contador del ícono del carrito en la barra de navegación debe incrementarse según la cantidad agregada.

### CA-041.5 — Manejo de productos duplicados

**Dado que** ya tengo un producto en el carrito,

**cuando** vuelvo a agregar el mismo producto desde la página de detalle,

**entonces** el sistema debe incrementar la cantidad del producto existente en lugar de crear una nueva entrada duplicada.

### CA-041.6 — Validación de stock

**Dado que** un producto tiene stock disponible de 5 unidades,

**cuando** intento agregar una cantidad mayor al stock disponible,

**entonces** el sistema debe mostrar un mensaje de advertencia indicando que la cantidad solicitada supera el stock y limitar la cantidad al máximo disponible.

---
