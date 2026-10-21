# HU-066 — Ver mis solicitudes PQRS

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-066 |
| Título | Ver mis solicitudes PQRS |
| Módulo | Soporte |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-066 |

---

## Historia

Como usuario de Lubix, quiero consultar el historial de mis solicitudes PQRS y su estado, para hacer seguimiento a las inquietudes que he enviado.

---

## Criterios de aceptación

### CA-066.1 — Listado de solicitudes

**Dado que** accedo a la sección de PQRS,

**cuando** se carga la vista,

**entonces** debo ver todas las solicitudes que he enviado.

---

### CA-066.2 — Detalle de cada solicitud

**Dado que** reviso mi listado de solicitudes,

**cuando** observo una solicitud,

**entonces** puedo ver su tipo, asunto, descripción y fecha de creación.

---

### CA-066.3 — Estado de cada solicitud

**Dado que** reviso mis solicitudes,

**cuando** observo el estado,

**entonces** puedo identificar si está pendiente o resuelta.

---

### CA-066.4 — Estado vacío

**Dado que** no he enviado solicitudes,

**cuando** se carga el listado,

**entonces** se muestra un mensaje indicando que no hay solicitudes aún.

---

### CA-066.5 — Solo mis solicitudes

**Dado que** consulto mis PQRS,

**cuando** se procesa la solicitud,

**entonces** solo veo las solicitudes asociadas a mi cuenta.
