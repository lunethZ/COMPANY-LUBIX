# HU-023 — Eliminar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-023 |
| Título | Eliminar producto |
| Módulo | Productos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-023 |

---

## Historia

Como vendedor de Lubix, quiero eliminar productos, para gestionar mi catálogo.

---

## Criterios de aceptación

### CA-023.1 — Opción de eliminar producto

**Dado que** soy un vendedor autenticado con productos registrados,

**cuando** veo un producto en mi catálogo,

**entonces** encuentro una opción para eliminarlo.

### CA-023.2 — Confirmación antes de eliminar

**Dado que** selecciono eliminar un producto,

**cuando** el sistema recibe la acción,

**entonces** muestra un mensaje de confirmación preguntando si estoy seguro antes de ejecutar la eliminación.

### CA-023.3 — Cancelación de la eliminación

**Dado que** aparece el mensaje de confirmación para eliminar un producto,

**cuando** decido cancelar,

**entonces** el producto se conserva intacto y no se realiza ningún cambio en el catálogo.

### CA-023.4 — Eliminación efectiva del producto

**Dado que** confirmo la eliminación de un producto,

**cuando** el sistema procesa la acción,

**entonces** el producto desaparece del catálogo y deja de estar disponible para los usuarios.

### CA-023.5 — Restricción por pedidos activos

**Dado que** un producto a eliminar está asociado a pedidos en curso,

**cuando** intento eliminarlo,

**entonces** el sistema lo impide o deshabilita la publicación del producto sin eliminar el historial de pedidos.

### CA-023.6 — Confirmación de eliminación exitosa

**Dado que** confirmé la eliminación de un producto,

**cuando** el sistema la completa,

**entonces** me muestra una notificación confirmando que el producto fue eliminado correctamente.

---

