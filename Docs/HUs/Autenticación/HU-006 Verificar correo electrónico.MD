# HU-006 — Verificar correo electrónico

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-006 |
| Título | Verificar correo electrónico |
| Módulo | Autenticación |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-006 |

---

## Historia

Como usuario de Lubix, quiero verificar mi correo electrónico ingresando un código de verificación, para activar mi cuenta y acceder a todas las funcionalidades de la plataforma.

---

## Criterios de aceptación

### CA-006.1 — Formulario de ingreso de código

**Dado que** el usuario acaba de registrarse y ha recibido un correo con un código de verificación,

**cuando** accede a la pantalla de verificación,

**entonces** debe visualizarse un campo de entrada para ingresar el código de verificación.

---

### CA-006.2 — Código correcto activa la cuenta

**Dado que** el usuario ingresa a la pantalla de verificación,

**cuando** ingresa un código que coincide con el enviado por correo,

**entonces** la cuenta se activa correctamente y el usuario recibe un mensaje de confirmación indicando que su cuenta está verificada.

---

### CA-006.3 — Código incorrecto muestra error

**Dado que** el usuario está en la pantalla de verificación,

**cuando** ingresa un código que no coincide con el enviado,

**entonces** el sistema debe mostrar un mensaje de error indicando que el código ingresado es incorrecto, sin desactivar la cuenta.

---

### CA-006.4 — Código expirado

**Dado que** el usuario recibe un código de verificación,

**cuando** transcurre el tiempo de vigencia del código y el usuario intenta ingresarlo,

**entonces** el sistema debe informar que el código ha expirado y ofrecer la opción de solicitar uno nuevo.

---

### CA-006.5 — Opción de reenviar código

**Dado que** el usuario se encuentra en la pantalla de verificación,

**cuando** no recibió el correo o el código expiró,

**entonces** debe existir un botón o enlace que permita solicitar el reenvío del correo de verificación.

---

### CA-006.6 — Mensaje de éxito

**Dado que** el usuario ingresa un código válido,

**cuando** el sistema valida el código correctamente,

**entonces** debe mostrarse un mensaje claro de éxito y el usuario debe ser redirigido al inicio de sesión o al panel principal de la plataforma.

---
