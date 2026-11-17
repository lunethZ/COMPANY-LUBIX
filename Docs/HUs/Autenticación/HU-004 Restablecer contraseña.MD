# HU-004 — Restablecer contraseña

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-004 |
| Título | Restablecer contraseña |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Implementado |
| RF asociados | RF-004 |

---

## Historia

Como usuario de Lubix, quiero restablecer mi contraseña mediante un enlace seguro enviado a mi correo electrónico, para poder crear una nueva contraseña y recuperar el acceso a mi cuenta.

---

## Criterios de aceptación

### CA-004.1 — Acceso mediante enlace válido
Dado que ingreso desde un enlace de recuperación válido,
cuando se carga la página,
entonces debo ver el formulario para crear una nueva contraseña.

### CA-004.2 — Contraseña obligatoria
Dado que estoy en el formulario,
cuando dejo el campo vacío,
entonces debo ver el mensaje: "La contraseña es obligatoria."

### CA-004.3 — Confirmación obligatoria
Dado que ingreso la nueva contraseña,
cuando no confirmo la contraseña,
entonces debo ver: "Debes confirmar la contraseña."

### CA-004.4 — Coincidencia de contraseñas
Dado que ingreso ambas contraseñas,
cuando no coinciden,
entonces debo ver: "Las contraseñas no coinciden."

### CA-004.5 — Requisitos de seguridad
La contraseña debe cumplir:
- Mínimo 8 caracteres
- Una mayúscula
- Una minúscula
- Un número

### CA-004.6 — Cambio exitoso
Dado que los datos son válidos,
cuando envío el formulario,
entonces la contraseña debe actualizarse correctamente.

---
