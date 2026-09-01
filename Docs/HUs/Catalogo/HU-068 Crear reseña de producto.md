# HU-068 — Crear reseña de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-068 |
| Título | Crear reseña de producto |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-068 |

---

## Historia

Como usuario de Lubix, quiero calificar y comentar los productos que he comprado, para compartir mi experiencia con otros compradores.

---

## Criterios de aceptación

### CA-068.1 — Formulario de reseña

**Dado que** estoy en un producto que he comprado,

**cuando** accedo a la opción de reseñar,

**entonces** debo ver un formulario con calificación, título y comentario.

---

### CA-068.2 — Calificación obligatoria

**Dado que** intento enviar una reseña,

**cuando** no selecciono una calificación,

**entonces** el sistema no permite el envío hasta que elija una calificación entre 1 y 5.

---

### CA-068.3 — Envío exitoso

**Dado que** completo la reseña correctamente,

**cuando** confirmo el envío,

**entonces** la reseña se guarda y se muestra un mensaje de confirmación.

---

### CA-068.4 — Solo productos comprados

**Dado que** intento reseñar un producto que no he comprado,

**cuando** envío la reseña,

**entonces** el sistema muestra un mensaje indicando que solo se pueden reseñar productos comprados.

---

### CA-068.5 — Una reseña por producto

**Dado que** ya reseñé un producto,

**cuando** intento reseñarlo nuevamente,

**entonces** el sistema muestra un mensaje indicando que ya has calificado este producto.

---

### CA-068.6 — Requiere inicio de sesión

**Dado que** no tengo sesión iniciada,

**cuando** intento dejar una reseña,

**entonces** el sistema me solicita iniciar sesión o registrarme.
