# RF-014 — Eliminar dirección

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-014 |
| Nombre | Eliminar dirección |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir eliminar direcciones registradas por el usuario.

---

## Proceso

- Usuario selecciona dirección.
- Backend valida propiedad.
- Se elimina o desactiva.

---

## Reglas de negocio

RN-001: No se puede eliminar dirección usada en pedidos activos.