# HU-064 — Gestionar PQRS

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-064 |
| Título | Gestionar PQRS |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-064 |

---

## Historia

Como administrador de Lubix, quiero revisar y resolver las solicitudes PQRS de los usuarios, para atender oportunamente sus peticiones, quejas, reclamos y sugerencias.

---

## Criterios de aceptación

### CA-064.1 — Listado de solicitudes

**Dado que** soy administrador y accedo a la gestión de PQRS,

**cuando** se carga la vista,

**entonces** debo ver todas las solicitudes con su tipo, asunto, descripción, estado y autor.

---

### CA-064.2 — Filtro por estado

**Dado que** reviso el listado de PQRS,

**cuando** aplico un filtro,

**entonces** puedo ver solo las solicitudes pendientes o solo las resueltas.

---

### CA-064.3 — Resolución de solicitud

**Dado que** selecciono una solicitud pendiente,

**cuando** confirmo la resolución,

**entonces** el estado de la PQRS cambia a "resuelta".

---

### CA-064.4 — Confirmación de resolución

**Dado que** estoy por resolver una PQRS,

**cuando** pulso el botón de resolver,

**entonces** el sistema muestra una confirmación antes de cambiar el estado.

---

### CA-064.5 — Solicitud no encontrada

**Dado que** intento resolver una PQRS inexistente,

**cuando** se procesa la solicitud,

**entonces** el sistema muestra un mensaje de "PQRS no encontrada".

---

### CA-064.6 — Notificación de resolución

**Dado que** resolví una solicitud PQRS,

**cuando** se actualiza el estado,

**entonces** el usuario autor puede ver su solicitud marcada como resuelta.
