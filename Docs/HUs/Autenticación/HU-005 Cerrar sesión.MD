# HU-005 — Cerrar sesión

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-005 |
| Título | Cerrar sesión |
| Módulo | Autenticación |
| Prioridad | Media |
| Estado | Implementado |
| RF asociados | RF-005 |

---

## Historia

Como usuario autenticado de Lubix, quiero cerrar sesión, para asegurar la protección de mi cuenta cuando dejo de usar la plataforma.

---

## Criterios de aceptación

### CA-005.1 — Botón de cierre de sesión
Dado que estoy autenticado,
cuando visualizo el sistema,
entonces debo ver la opción "Cerrar sesión".

### CA-005.2 — Eliminación de sesión
Dado que presiono cerrar sesión,
cuando el sistema procesa la acción,
entonces mi sesión debe eliminarse completamente.

### CA-005.3 — Redirección al login
Dado que cierro sesión,
cuando el proceso finaliza,
entonces debo ser redirigido a la pantalla de inicio de sesión.

### CA-005.4 — Seguridad de acceso
Dado que cerré sesión,
cuando intento acceder al dashboard,
entonces no debo poder ingresar sin autenticación.

---
