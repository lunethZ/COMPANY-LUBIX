# HU-027 — Organizar categorías

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-027 |
| Título | Organizar categorías |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-027 |

---

## Historia

Como vendedor de Lubix, quiero organizar mis productos en categorías, para que sean más fáciles de encontrar y gestionar.

---

## Criterios de aceptación

### CA-027.1 — Control del estado de publicación

**Dado que** soy un vendedor autenticado con un producto guardado,

**cuando** accedo al detalle del producto,

**entonces** encuentro una opción para activar o desactivar su publicación.

### CA-027.2 — Publicación exitosa del producto

**Dado que** acciono publicar un producto,

**cuando** el sistema procesa la acción,

**entonces** el producto pasa a estado "Publicado" y queda disponible en el catálogo.

### CA-027.3 — Visibilidad en el catálogo

**Dado que** un producto está publicado,

**cuando** los usuarios navegan por el catálogo o realizan búsquedas,

**entonces** el producto aparece en los resultados.

### CA-027.4 — Productos no publicados ocultos

**Dado que** un producto tiene la publicación desactivada,

**cuando** un usuario navega por el catálogo,

**entonces** el producto no aparece y solo es visible para el vendedor en su panel.

### CA-027.5 — Confirmación de la publicación

**Dado que** cambio el estado de publicación de un producto,

**cuando** el sistema registra el cambio,

**entonces** me muestra una confirmación de que la publicación se activó o se desactivó.

### CA-027.6 — Publicación solo con datos completos

**Dado que** intento publicar un producto sin nombre, precio o imagen,

**cuando** activo la publicación,

**entonces** el sistema impide publicarlo y me indica qué datos faltan.

---

