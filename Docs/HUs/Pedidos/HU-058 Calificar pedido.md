# HU-058 — Calificar pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-058 |
| Título | Calificar pedido |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-058 |

---

## Historia

Como usuario de Lubix, quiero calificar un pedido entregado, para compartir mi experiencia con otros clientes.

---

## Criterios de aceptación

### CA-058.1 — Calificación por estrellas

**Dado que** el usuario quiere calificar un pedido entregado,

**cuando** acceda a la opción de calificar,

**entonces** el sistema permite asignar una puntuación de una a cinco estrellas de forma obligatoria.

### CA-058.2 — Reseña de texto

**Dado que** el usuario ha asignado las estrellas,

**cuando** complete la calificación,

**entonces** el sistema permite añadir una reseña escrita opcional con un límite máximo de caracteres.

### CA-058.3 — Solo para pedidos entregados

**Dado que** el pedido aún no ha sido entregado,

**cuando** el usuario intente calificarlo,

**entonces** el sistema no permite calificar el pedido y muestra un aviso de que la calificación estará disponible tras la entrega.

### CA-058.4 — Edición de la calificación

**Dado que** el usuario ya ha publicado una calificación,

**cuando** acceda de nuevo a la calificación del pedido,

**entonces** el sistema le permite modificar las estrellas o el texto de la reseña y guardar los cambios.

### CA-058.5 — Eliminación de la calificación

**Dado que** el usuario ya no desea mostrar su calificación,

**cuando** seleccione la opción de eliminar,

**entonces** el sistema solicita confirmación y, al aceptarla, elimina la calificación del pedido.

---
