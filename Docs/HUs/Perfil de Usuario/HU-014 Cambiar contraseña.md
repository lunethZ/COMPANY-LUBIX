# HU-014 — Cambiar contraseña

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-014 |
| Título | Cambiar contraseña |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-014 |

---

## Historia

Como usuario de Lubix, quiero cambiar mi contraseña, para mantener segura mi cuenta y proteger mis datos personales.

---

## Criterios de aceptación

### CA-014.1 — Contraseña actual obligatoria

**Dado que** el usuario accede a la opción de cambiar su contraseña,

**cuando** intente guardar la nueva contraseña,

**entonces** el sistema exige ingresar y verificar la contraseña actual antes de permitir el cambio.

### CA-014.2 — Validación de la nueva contraseña

**Dado que** el usuario ingresa una nueva contraseña,

**cuando** esta no cumpla los requisitos de longitud o complejidad,

**entonces** el sistema muestra un mensaje de error que indica los requisitos no cumplidos.

### CA-014.3 — Confirmación de la nueva contraseña

**Dado que** el usuario escribe la nueva contraseña,

**cuando** la confirme en el campo correspondiente,

**entonces** el sistema valida que ambas coincidan e impide guardar en caso de discrepancia.

### CA-014.4 — Indicador de fortaleza

**Dado que** el usuario escribe la nueva contraseña,

**cuando** el campo esté activo,

**entonces** el sistema muestra un indicador visual de la fortaleza de la contraseña, como débil, media o fuerte.

### CA-014.5 — Cierre de sesión tras el cambio

**Dado que** la contraseña se ha cambiado correctamente,

**cuando** se complete la actualización,

**entonces** el sistema cierra la sesión actual y solicita al usuario iniciar sesión nuevamente con la nueva contraseña.

### CA-014.6 — Mensaje de confirmación

**Dado que** el cambio de contraseña ha sido exitoso,

**cuando** se guarde la nueva contraseña,

**entonces** el sistema notifica al usuario que la contraseña ha sido actualizada correctamente.

---
