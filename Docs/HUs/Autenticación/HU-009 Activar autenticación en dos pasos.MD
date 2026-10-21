# HU-009 — Activar autenticación en dos pasos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-009 |
| Título | Activar autenticación en dos pasos |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-009 |

---

## Historia

Como usuario de Lubix, quiero activar la autenticación en dos pasos, para agregar una capa extra de seguridad a mi cuenta.

---

## Criterios de aceptación

### CA-009.1 — Opción para activar autenticación en dos pasos

**Dado que** el usuario accede a la configuración de seguridad de su cuenta,

**cuando** visualiza las opciones de autenticación,

**entonces** debe existir una opción clara para activar la autenticación en dos pasos, mostrando su estado actual (activada o desactivada).

---

### CA-009.2 — Configuración con código QR o código de configuración

**Dado que** el usuario selecciona activar la autenticación en dos pasos,

**cuando** el sistema genera la configuración,

**entonces** debe presentarse un código QR para escanear con una aplicación de autenticación (como Google Authenticator), así como un código alfanumérico alternativo para configuración manual.

---

### CA-009.3 — Confirmación con código de verificación

**Dado que** el usuario ha escaneado el código QR o ingresado el código manualmente,

**cuando** completa la configuración ingresando el código generado por la aplicación de autenticación,

**entonces** el sistema debe validar el código y confirmar que la autenticación en dos pasos se ha activado correctamente, mostrando un mensaje de éxito.

---

### CA-009.4 — Opción para desactivar la autenticación en dos pasos

**Dado que** el usuario tiene activada la autenticación en dos pasos,

**cuando** accede a la configuración de seguridad y selecciona desactivarla,

**entonces** el sistema debe solicitar una confirmación y, una vez confirmada, desactivar la autenticación en dos pasos de la cuenta.

---

### CA-009.5 — Códigos de recuperación

**Dado que** el usuario activa la autenticación en dos pasos,

**cuando** se completa la configuración,

**entonces** el sistema debe generar y mostrar una lista de códigos de recuperación de un solo uso que el usuario puede utilizar si pierde acceso a su aplicación de autenticación.

---

### CA-009.6 — Verificación obligatoria en el siguiente inicio de sesión

**Dado que** el usuario tiene activada la autenticación en dos pasos,

**cuando** intenta iniciar sesión en la plataforma,

**entonces** después de ingresar correo y contraseña, el sistema debe solicitar el código de verificación generado por la aplicación de autenticación antes de permitir el acceso.

---
