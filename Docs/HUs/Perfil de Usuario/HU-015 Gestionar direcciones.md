# HU-015 — Gestionar direcciones

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-015 |
| Título | Gestionar direcciones |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-015 |

---

## Historia

Como usuario de Lubix, quiero gestionar mis direcciones de entrega, para mantener registrados los lugares donde puedo recibir mis pedidos.

---

## Criterios de aceptación

### CA-015.1 — Listado de direcciones

**Dado que** el usuario accede a la gestión de direcciones,

**cuando** se cargue la sección,

**entonces** el sistema muestra todas las direcciones guardadas con sus datos completos y la dirección marcada como predeterminada.

### CA-015.2 — Agregar nueva dirección

**Dado que** el usuario quiere registrar una nueva dirección,

**cuando** complete el formulario y lo guarde,

**entonces** el sistema almacena la nueva dirección y la incluye en el listado.

### CA-015.3 — Editar dirección

**Dado que** el usuario quiere modificar una dirección existente,

**cuando** pulse la opción de edición y guarde los cambios,

**entonces** el sistema actualiza los datos de esa dirección en el listado.

### CA-015.4 — Eliminar dirección

**Dado que** el usuario quiere quitar una dirección,

**cuando** pulse la opción de eliminar y confirme la acción,

**entonces** el sistema elimina la dirección del listado y ya no la ofrece para envíos.

### CA-015.5 — Establecer dirección predeterminada

**Dado que** el usuario tiene varias direcciones registradas,

**cuando** marque una de ellas como predeterminada,

**entonces** el sistema la establece como opción por defecto para futuros envíos y la destaca en el listado.

---
