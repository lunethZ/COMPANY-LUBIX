# HU-067 — Ver reseñas de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-067 |
| Título | Ver reseñas de producto |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-067 |

---

## Historia

Como usuario de Lubix, quiero ver las reseñas y calificaciones de un producto, para decidir mejor antes de comprarlo.

---

## Criterios de aceptación

### CA-067.1 — Calificación promedio visible

**Dado que** estoy en el detalle de un producto,

**cuando** se carga la página,

**entonces** debo ver la calificación promedio y el número de reseñas del producto.

---

### CA-067.2 — Listado de reseñas

**Dado que** accedo a la sección de reseñas de un producto,

**cuando** se carga el listado,

**entonces** debo ver cada reseña con su calificación, título, comentario y autor.

---

### CA-067.3 — Orden de las reseñas

**Dado que** reviso las reseñas de un producto,

**cuando** se ordena el listado,

**entonces** las reseñas se muestran de la más reciente a la más antigua.

---

### CA-067.4 — Estado sin reseñas

**Dado que** un producto no tiene reseñas,

**cuando** se carga la sección,

**entonces** se muestra un mensaje indicando que aún no hay reseñas.

---

### CA-067.5 — Acceso público

**Dado que** navego el catálogo,

**cuando** veo un producto,

**entonces** las reseñas son visibles sin necesidad de tener una cuenta.
