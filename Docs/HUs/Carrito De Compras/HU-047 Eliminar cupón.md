# HU-047 — Eliminar cupón

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-047 |
| Título | Eliminar cupón |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-047 |

---

## Historia

Como usuario de Lubix, quiero eliminar un cupón aplicado en el carrito, para quitarlo cuando ya no deseo usar el descuento.

---

## Criterios de aceptación

### CA-047.1 — Botón de eliminar cupón

**Dado que** tengo un cupón de descuento aplicado en el carrito,

**cuando** visualizo el resumen del pedido,

**entonces** debe mostrarse un botón o ícono junto al código del cupón que permita eliminarlo.

### CA-047.2 — Confirmación de eliminación

**Dado que** hago clic en el botón de eliminar cupón,

**cuando** el sistema detecta la acción,

**entonces** debe mostrarse un diálogo de confirmación preguntando si deseo remover el cupón de descuento aplicado.

### CA-047.3 — Recálculo del total

**Dado que** confirmé la eliminación del cupón,

**cuando** el sistema procesa la acción,

**entonces** el descuento debe removese del resumen, los impuestos deben recalcularse sobre el subtotal original y el total general debe actualizarse.

### CA-047.4 — Mensaje de confirmación

**Dado que** el cupón fue eliminado exitosamente,

**cuando** se completa la acción,

**entonces** debe mostrarse un mensaje de notificación indicando que el cupón fue removido correctamente del carrito.

---
