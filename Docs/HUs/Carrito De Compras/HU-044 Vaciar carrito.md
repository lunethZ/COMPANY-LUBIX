# HU-044 — Vaciar carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-044 |
| Título | Vaciar carrito |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-044 |

---

## Historia

Como usuario de Lubix, quiero vaciar todo el carrito, para eliminar todos los productos de una sola vez.

---

## Criterios de aceptación

### CA-044.1 — Botón de vaciar carrito

**Dado que** tengo al menos un producto en el carrito,

**cuando** visualizo la página del carrito,

**entonces** debe existir un botón identificado como "Vaciar carrito" accesible para el usuario.

### CA-044.2 — Confirmación antes de vaciar

**Dado que** hago clic en el botón "Vaciar carrito",

**cuando** el sistema detecta la acción,

**entonces** debe mostrarse un diálogo de confirmación advirtiendo que se eliminarán todos los productos y solicitando confirmación para proceder.

### CA-044.3 — Carrito vacío tras la acción

**Dado que** confirmé vaciar el carrito,

**cuando** el sistema procesa la acción,

**entonces** todos los productos deben eliminarse, el total debe restablecerse a cero y el carrito debe quedar completamente vacío.

### CA-044.4 — Mensaje de carrito vacío

**Dado que** el carrito fue vaciado exitosamente,

**cuando** se muestra el estado del carrito,

**entonces** debe desplegarse un mensaje informativo como "Tu carrito está vacío" acompañado de un enlace para navegar al catálogo de productos.

---
