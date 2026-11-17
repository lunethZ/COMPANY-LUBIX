# HU-003 — Recuperar contraseña

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-003 |
| Título | Recuperar contraseña |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Implementado |
| RF asociados | RF-003 |

---

## Historia

Como usuario de Lubix, quiero poder recuperar mi contraseña mediante mi correo electrónico, para restablecer el acceso a mi cuenta cuando la haya olvidado.

---

## Criterios de aceptación

### CA-003.1 — Visualización del formulario

**Dado que** ingreso a la sección "Recuperar contraseña",

**cuando** carga la página,

**entonces** debo ver un campo para ingresar mi correo electrónico y un botón para enviar la solicitud.

---

### CA-003.2 — Correo obligatorio

**Dado que** estoy en el formulario,

**cuando** dejo el campo de correo vacío,

**entonces** debo ver el mensaje:

> El correo electrónico es obligatorio.

---

### CA-003.3 — Formato de correo válido

**Dado que** ingreso un correo inválido,

**cuando** envío el formulario,

**entonces** debo ver el mensaje:

> Ingrese un correo electrónico válido.

---

### CA-003.4 — Usuario no registrado

**Dado que** ingreso un correo que no existe en el sistema,

**cuando** envío la solicitud,

**entonces** debo ver el mensaje:

> El correo no se encuentra registrado.

---

### CA-003.5 — Solicitud enviada correctamente

**Dado que** ingreso un correo registrado,

**cuando** envío el formulario correctamente,

**entonces** debo ver un mensaje indicando que se envió un enlace de recuperación al correo.

---

### CA-003.6 — Envío de correo de recuperación

**Dado que** la solicitud fue válida,

**cuando** el sistema procesa la petición,

**entonces** debo recibir un correo con un enlace para restablecer la contraseña.

---

### CA-003.7 — Estado de carga

**Dado que** envié la solicitud,

**cuando** el sistema está procesando,

**entonces** el botón debe deshabilitarse y mostrar un indicador de carga.

---

### CA-003.8 — Enlace único de recuperación

**Dado que** recibo el correo,

**cuando** abro el enlace,

**entonces** este debe ser único, seguro y válido por tiempo limitado.

---

### CA-003.9 — Expiración del enlace

**Dado que** el enlace ha expirado,

**cuando** intento usarlo,

**entonces** debo ver el mensaje:

> El enlace de recuperación ha expirado.

---

### CA-003.10 — Redirección a restablecer contraseña

**Dado que** el enlace es válido,

**cuando** lo abro,

**entonces** debo ser redirigido a la pantalla para crear una nueva contraseña.

---

### CA-003.11 — Confirmación de solicitud

**Dado que** solicité recuperación,

**cuando** el proceso se completa,

**entonces** debo ver un mensaje indicando que revise mi correo electrónico.

---

### CA-003.12 — Prevención de abuso

**Dado que** realizo múltiples solicitudes seguidas,

**cuando** excedo el límite permitido,

**entonces** el sistema debe bloquear temporalmente nuevas solicitudes.

---

### CA-003.13 — Seguridad del enlace

**Dado que** el enlace es generado,

**cuando** es enviado,

**entonces** debe incluir un token seguro e irrepetible.