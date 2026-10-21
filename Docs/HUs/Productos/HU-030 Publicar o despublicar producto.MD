# HU-030 — Publicar o despublicar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-030 |
| Título | Publicar o despublicar producto |
| Módulo | Productos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-030 |

---

## Historia

Como vendedor de Lubix, quiero publicar o despublicar mis productos, para controlar su visibilidad en el catálogo.

---

## Criterios de aceptación

### CA-030.1 — Sección de preguntas en el producto

**Dado que** un producto tiene preguntas de clientes,

**cuando** accedo al detalle del producto como vendedor,

**entonces** veo una sección que lista las preguntas pendientes de responder.

### CA-030.2 — Visualización de la pregunta

**Dado que** hay una pregunta pendiente en un producto,

**cuando** abro la sección de preguntas,

**entonces** puedo leer la pregunta completa y el cliente que la realizó.

### CA-030.3 — Redacción y envío de la respuesta

**Dado que** tengo una pregunta pendiente de responder,

**cuando** escribo y envío mi respuesta,

**entonces** el sistema guarda la respuesta y la asocia a la pregunta.

### CA-030.4 — Validación de la respuesta vacía

**Dado que** intento enviar una respuesta vacía,

**cuando** envío el formulario,

**entonces** el sistema impide el envío y solicita redactar un contenido.

### CA-030.5 — Publicación de la respuesta

**Dado que** respondí a una pregunta de un cliente,

**cuando** la respuesta queda guardada,

**entonces** esta se vuelve visible públicamente para todos los usuarios en la página del producto.

### CA-030.6 — Notificación de la respuesta

**Dado que** respondí a una pregunta de un cliente,

**cuando** la respuesta se publica,

**entonces** el cliente que realizó la pregunta recibe una notificación con la respuesta.

---

