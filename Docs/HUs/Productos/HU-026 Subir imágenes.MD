# HU-026 — Subir imágenes de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-026 |
| Título | Subir imágenes de producto |
| Módulo | Productos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-026 |

---

## Historia

Como vendedor de Lubix, quiero subir imágenes de mis productos, para que los usuarios puedan verlos claramente.

---

## Criterios de aceptación

### CA-026.1 — Opción de subir imágenes

**Dado que** estoy creando o editando un producto,

**cuando** accedo a la sección de imágenes,

**entonces** veo una opción para subir imágenes desde mi dispositivo.

### CA-026.2 — Formatos de imagen admitidos

**Dado que** subo una imagen,

**cuando** el archivo tiene un formato distinto a JPG o PNG,

**entonces** el sistema lo rechaza e indica que el formato no es válido.

### CA-026.3 — Límite de tamaño de imagen

**Dado que** subo una imagen,

**cuando** el archivo supera el tamaño máximo permitido,

**entonces** el sistema lo rechaza e informa que la imagen es demasiado grande.

### CA-026.4 — Vista previa de la imagen

**Dado que** selecciono una imagen válida,

**cuando** esta se carga,

**entonces** el sistema muestra una vista previa antes de guardarla en el producto.

### CA-026.5 — Guardado de la imagen

**Dado que** tengo una imagen válida con vista previa,

**cuando** confirmo el guardado del producto,

**entonces** la imagen se almacena y queda asociada al producto.

### CA-026.6 — Imagen principal del producto

**Dado que** un producto tiene varias imágenes subidas,

**cuando** visualizo el producto en la tienda,

**entonces** se muestra una imagen principal seleccionada y las demás como adicionales.

### CA-026.7 — Eliminación de imágenes

**Dado que** tengo imágenes asociadas a un producto,

**cuando** decido quitar una de ellas,

**entonces** el sistema permite eliminarla sin afectar a las demás imágenes.

---

