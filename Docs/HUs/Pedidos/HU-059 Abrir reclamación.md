# HU-059 — Abrir reclamación

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-059 |
| Título | Abrir reclamación |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-059 |

---

## Historia

Como usuario de Lubix, quiero abrir una reclamación sobre mi pedido, para reportar problemas con mi compra.

---

## Criterios de aceptación

### CA-059.1 — Formulario de reclamación

**Dado que** el usuario tiene un pedido con algún problema,

**cuando** acceda a la opción de abrir reclamación,

**entonces** el sistema muestra un formulario para registrar la reclamación asociada al pedido.

### CA-059.2 — Selección de categoría

**Dado que** el usuario está completando la reclamación,

**cuando** deba clasificar el problema,

**entonces** el sistema muestra una lista de categorías (producto dañado, producto incorrecto, envío incompleto, entre otras) y exige seleccionar una.

### CA-059.3 — Descripción del problema

**Dado que** el usuario quiere explicar su reclamación,

**cuando** redacte la solicitud,

**entonces** el sistema exige una descripción del problema con un mínimo de caracteres antes de permitir enviar.

### CA-059.4 — Adjuntar archivos

**Dado que** el usuario quiere aportar evidencia,

**cuando** adjunte fotografías u otros documentos,

**entonces** el sistema permite subir los archivos en formatos y tamaños admitidos y los asocia a la reclamación.

### CA-059.5 — Seguimiento de la reclamación

**Dado que** el usuario ha enviado la reclamación,

**cuando** consulte su estado,

**entonces** el sistema mantiene un registro y muestra el estado actual, como "recibida", "en revisión" o "resuelta".

### CA-059.6 — Notificación de respuesta

**Dado que** el equipo atiende la reclamación,

**cuando** respondan o actualicen el estado,

**entonces** el sistema notifica al usuario y refleja la respuesta dentro del detalle de la reclamación.

---
