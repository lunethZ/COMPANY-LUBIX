# HU-021 — Crear producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-021 |
| Título | Crear producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-021 |

---

## Historia

Como vendedor de Lubix, quiero crear un producto, para publicarlo y ofrecerlo a los usuarios en la plataforma.

---

## Criterios de aceptación

### CA-021.1 — Acceso al formulario de creación

**Dado que** soy un vendedor autenticado en Lubix,

**cuando** accedo a mi panel de productos,

**entonces** veo una opción para crear un nuevo producto que abre un formulario de creación.

### CA-021.2 — Campos obligatorios del formulario

**Dado que** estoy en el formulario de creación de un producto,

**cuando** intento guardar,

**entonces** el sistema exige como obligatorios el nombre, el precio y la descripción.

### CA-021.3 — Validación de campos obligatorios

**Dado que** dejo vacío alguno de los campos obligatorios,

**cuando** envío el formulario,

**entonces** el sistema muestra un mensaje de error indicando qué campos debo completar y no guarda el producto.

### CA-021.4 — Validación del precio

**Dado que** ingreso el precio del producto,

**cuando** el precio no es un número válido o es negativo,

**entonces** el sistema rechaza el valor y solicita un precio mayor o igual a cero.

### CA-021.5 — Guardado del producto

**Dado que** completo todos los campos obligatorios con datos válidos,

**cuando** envío el formulario,

**entonces** el sistema guarda el producto y me notifica que se ha creado correctamente.

### CA-021.6 — Conflicto con nombres duplicados

**Dado que** intento crear un producto con el mismo nombre que otro ya existente en la tienda,

**cuando** envío el formulario,

**entonces** el sistema muestra un aviso indicando que ya existe un producto con ese nombre.

---

