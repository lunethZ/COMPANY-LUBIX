# HU-022 — Editar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-022 |
| Título | Editar producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-022 |

---

## Historia

Como vendedor de Lubix, quiero editar mis productos, para mantener la información actualizada.

---

## Criterios de aceptación

### CA-022.1 — Acceso a la edición

**Dado que** soy un vendedor autenticado con productos registrados,

**cuando** selecciono un producto de mi catálogo,

**entonces** veo una opción de editar que abre el formulario con los datos actuales precargados.

### CA-022.2 — Edición de campos editables

**Dado que** estoy en el formulario de edición,

**cuando** modifico nombre, precio o descripción del producto,

**entonces** el sistema permite guardar cada uno de estos cambios.

### CA-022.3 — Validación de los nuevos valores

**Dado que** intento guardar un precio inválido o dejo vacío un campo obligatorio,

**cuando** envío el formulario de edición,

**entonces** el sistema muestra un error, indica qué campo es inválido y no guarda los cambios.

### CA-022.4 — Guardado correcto de cambios

**Dado que** ingreso datos válidos al editar un producto,

**cuando** confirmo los cambios,

**entonces** el sistema guarda la información actualizada y me lo confirma.

### CA-022.5 — Persistencia de los datos editados

**Dado que** guardé cambios en un producto,

**cuando** abro nuevamente el producto o lo veo en el catálogo,

**entonces** la información actualizada se muestra sin requerir volver a cargar manualmente.

### CA-022.6 — Cancelación de la edición

**Dado que** tengo modificaciones sin guardar en el formulario de edición,

**cuando** cancelo la edición,

**entonces** el sistema descarta los cambios y conserva los datos anteriores del producto.

---

