# HU-037 — Ver productos nuevos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-037 |
| Título | Ver productos nuevos |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-037 |

---

## Historia

Como comprador de Lubix, quiero ver los productos más recientemente publicados, para estar al tanto de las novedades disponibles en la plataforma.

---

## Criterios de aceptación

### CA-037.1 — Sección de productos nuevos

**Dado que** ingreso a la página principal o al catálogo de la plataforma,

**cuando** se carga el contenido,

**entonces** debe mostrarse una sección identificada como "Productos nuevos" con los productos más recientemente publicados.

### CA-037.2 — Ordenamiento por fecha de publicación

**Dado que** existen varios productos nuevos en el sistema,

**cuando** se carga la sección de productos nuevos,

**entonces** los productos deben ordenarse por fecha de publicación de forma descendente, mostrando los más recientes primero.

### CA-037.3 — Insignia de "Nuevo"

**Dado que** un producto fue publicado en los últimos 30 días,

**cuando** aparece en cualquier sección del catálogo,

**entonces** debe mostrarse una insignia o etiqueta que indique "Nuevo" sobre la imagen del producto.

### CA-037.4 — Navegación al detalle

**Dado que** estoy en la sección de productos nuevos,

**cuando** hago clic en cualquiera de los productos mostrados,

**entonces** debe redirigirme a la página de detalle de ese producto con toda su información.

---
