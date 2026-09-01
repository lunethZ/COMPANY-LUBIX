# HU-039 — Eliminar de favoritos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-039 |
| Título | Eliminar de favoritos |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-039 |

---

## Historia

Como comprador de Lubix, quiero eliminar productos de mi lista de favoritos, para mantener mi lista organizada y libre de productos que ya no me interesan.

---

## Criterios de aceptación

### CA-039.1 — Desactivar favorito desde el detalle

**Dado que** un producto está en mi lista de favoritos,

**cuando** accedo al detalle del producto y hago clic en el ícono de corazón activo,

**entonces** el ícono debe cambiar a estado inactivo (contorno) y el producto debe eliminarse de mi lista de favoritos.

### CA-039.2 — Eliminar desde la lista de favoritos

**Dado que** estoy en la sección de mis favoritos,

**cuando** hago clic en el botón de eliminar o el ícono de corazón de un producto,

**entonces** el producto debe eliminarse inmediatamente de la lista y la interfaz debe actualizarse.

### CA-039.3 — Confirmación de eliminación

**Dado que** hago clic en eliminar un producto de favoritos,

**cuando** el sistema detecta la acción,

**entonces** debe mostrarse una notificación breve con la opción de "Deshacer" durante unos segundos en caso de que la eliminación haya sido accidental.

### CA-039.4 — Redirección desde catálogo

**Dado que** estoy en mi lista de favoritos y elimino un producto,

**cuando** la lista queda vacía,

**entonces** debe mostrarse un mensaje indicando que no hay productos en favoritos y un enlace para navegar al catálogo.

---
