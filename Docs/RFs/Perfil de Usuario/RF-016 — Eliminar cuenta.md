# RF-016 — Eliminar cuenta

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-016 |
| Nombre | Eliminar cuenta |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario eliminar su cuenta de forma permanente.

---

## Proceso

- Usuario solicita eliminación.
- Backend valida identidad.
- Se desactiva o elimina cuenta.
- Se eliminan datos asociados.

---

## Reglas de negocio

RN-001: La eliminación puede ser irreversible.
RN-002: Se debe confirmar la acción.