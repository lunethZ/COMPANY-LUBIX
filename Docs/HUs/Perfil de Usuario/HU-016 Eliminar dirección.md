# HU-016 — Eliminar dirección

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-016 |
| Título | Eliminar dirección |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-016 |

---

## Historia

Como usuario de Lubix, quiero eliminar una dirección guardada, para quitar las direcciones que ya no utilizo.

---

## Criterios de aceptación

### CA-016.1 — Botón de eliminar

**Dado que** el usuario visualiza el listado de direcciones,

**cuando** quiera quitar una dirección concreta,

**entonces** el sistema muestra una opción de eliminar asociada a esa dirección.

### CA-016.2 — Confirmación de eliminación

**Dado que** el usuario pulsa el botón de eliminar,

**cuando** se solicite la acción,

**entonces** el sistema muestra un diálogo de confirmación y solo elimina la dirección si el usuario confirma de forma explícita.

### CA-016.3 — Imposibilidad de eliminar la dirección predeterminada

**Dado que** la dirección está marcada como predeterminada,

**cuando** el usuario intente eliminarla,

**entonces** el sistema no permite eliminarla mientras sea la predeterminada y solicita elegir otra antes de poder continuar.

### CA-016.4 — Actualización del listado

**Dado que** la dirección ha sido eliminada,

**cuando** se complete la eliminación,

**entonces** el sistema actualiza el listado y la dirección ya no aparece ni se ofrece para envíos.

---
