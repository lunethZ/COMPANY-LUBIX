# HU-043 — Eliminar producto del carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-043 |
| Título | Eliminar producto del carrito |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-043 |

---

## Historia

Como usuario de Lubix, quiero eliminar un producto del carrito, para retirarlo de mi compra cuando ya no lo deseo.

---

## Criterios de aceptación

### CA-043.1 — Botón de eliminar visible

**Dado que** tengo al menos un producto en el carrito,

**cuando** visualizo la lista de productos del carrito,

**entonces** cada producto debe contar con un botón o ícono de eliminar claramente identificado.

### CA-043.2 — Diálogo de confirmación

**Dado que** hago clic en el botón de eliminar de un producto,

**cuando** el sistema detecta la acción,

**entonces** debe mostrarse un diálogo de confirmación preguntando si deseo eliminar el producto del carrito.

### CA-043.3 — Actualización del carrito tras eliminación

**Dado que** confirmé la eliminación de un producto del carrito,

**cuando** el sistema procesa la eliminación,

**entonces** el producto debe desaparecer de la lista, el carrito debe actualizarse inmediatamente y el total debe recalcularse.

### CA-043.4 — Estado de carrito vacío

**Dado que** eliminé el último producto del carrito,

**cuando** el carrito queda sin productos,

**entonces** debe mostrarse un mensaje indicando que el carrito está vacío junto con un enlace para explorar el catálogo.

### CA-043.5 — Opción de deshacer

**Dado que** eliminé un producto del carrito,

**cuando** se muestra la notificación de eliminación,

**entonces** debe ofrecerse una opción temporal de "Deshacer" que permita restaurar el producto eliminado con su cantidad original.

---
