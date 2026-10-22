# HU-024 — Cambiar precio de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-024 |
| Título | Cambiar precio de producto |
| Módulo | Productos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-024 |

---

## Historia

Como vendedor de Lubix, quiero cambiar el precio de mis productos, para ajustarlos según el mercado.

---

## Criterios de aceptación

### CA-024.1 — Campo de precio editable

**Dado que** estoy editando un producto de mi catálogo,

**cuando** accedo a su detalle,

**entonces** el campo de precio es editable y muestra el valor actual.

### CA-024.2 — Validación numérica del precio

**Dado que** ingreso un nuevo precio,

**cuando** el valor no es numérico,

**entonces** el sistema rechaza la entrada y solicita un número válido.

### CA-024.3 — Validación de precio no negativo

**Dado que** ingreso un nuevo precio,

**cuando** el valor es negativo o cero,

**entonces** el sistema muestra un error indicando que el precio debe ser mayor que cero.

### CA-024.4 — Redondeo y formato del precio

**Dado que** guardo un nuevo precio,

**cuando** el valor tiene más decimales de los permitidos,

**entonces** el sistema lo redondea o ajusta al formato de moneda de la plataforma.

### CA-024.5 — Guardado del nuevo precio

**Dado que** ingreso un precio válido,

**cuando** confirmo el cambio,

**entonces** el sistema guarda el nuevo precio y me lo confirma.

### CA-024.6 — Aplicación inmediata del cambio

**Dado que** guardé un nuevo precio,

**cuando** el producto se muestra en el catálogo o en el carrito de compras,

**entonces** el precio actualizado se refleja de inmediato.

---

