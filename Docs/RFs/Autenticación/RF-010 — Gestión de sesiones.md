# RF-010 — Gestión de sesiones

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-010 |
| Nombre | Gestión de sesiones |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe administrar sesiones activas del usuario.

---

## Proceso

- Se crean sesiones al login.
- Se almacenan en base de datos.
- Se pueden invalidar.

---

## Reglas de negocio

RN-001: Una sesión expira automáticamente.  
RN-002: Se pueden cerrar sesiones desde el sistema.