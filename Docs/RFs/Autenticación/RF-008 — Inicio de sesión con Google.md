# RF-008 — Inicio de sesión con Google

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-008 |
| Nombre | Login con Google |
| Módulo | Autenticación |
| Prioridad | Media |
| Estado | No implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir autenticación mediante Google OAuth.

---

## Proceso

- Usuario selecciona Google Login.
- Se redirige a OAuth.
- Google retorna token.
- Se valida y crea usuario si no existe.

---

## Reglas de negocio

RN-001: Se crea usuario automáticamente si no existe.