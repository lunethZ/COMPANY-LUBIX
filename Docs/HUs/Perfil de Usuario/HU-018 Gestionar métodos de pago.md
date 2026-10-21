# HU-018 — Gestionar métodos de pago

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-018 |
| Título | Gestionar métodos de pago |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-018 |

---

## Historia

Como usuario de Lubix, quiero gestionar mis métodos de pago, para agregar, editar o eliminar las formas de pago asociadas a mi cuenta.

---

## Criterios de aceptación

### CA-018.1 — Listado de métodos de pago

**Dado que** el usuario accede a la gestión de métodos de pago,

**cuando** se cargue la sección,

**entonces** el sistema muestra las tarjetas guardadas con sus últimos dígitos y el método marcado como predeterminado.

### CA-018.2 — Agregar nueva tarjeta

**Dado que** el usuario quiere registrar un nuevo método de pago,

**cuando** complete el formulario y lo guarde,

**entonces** el sistema almacena la tarjeta de forma segura y la agrega al listado.

### CA-018.3 — Eliminar método de pago

**Dado que** el usuario quiere quitar una tarjeta,

**cuando** seleccione la opción de eliminar y confirme,

**entonces** el sistema elimina el método de pago del listado y ya no lo ofrece al pagar.

### CA-018.4 — Establecer método predeterminado

**Dado que** el usuario tiene varios métodos de pago,

**cuando** marque uno de ellos como predeterminado,

**entonces** el sistema lo establece como opción por defecto en futuras compras y lo destaca en el listado.

### CA-018.5 — Validación de datos de la tarjeta

**Dado que** el usuario ingresa los datos de una nueva tarjeta,

**cuando** el número, la fecha de vencimiento o el CVV no sean válidos,

**entonces** el sistema muestra un mensaje de error e impide registrar la tarjeta hasta corregir los datos.

---
