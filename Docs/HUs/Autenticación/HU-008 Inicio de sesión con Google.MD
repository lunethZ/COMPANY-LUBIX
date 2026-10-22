# HU-008 — Inicio de sesión con Google

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-008 |
| Título | Inicio de sesión con Google |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-008 |

---

## Historia

Como usuario de Lubix, quiero iniciar sesión con mi cuenta de Google, para acceder rápidamente a la plataforma sin necesidad de recordar un correo y contraseña.

---

## Criterios de aceptación

### CA-008.1 — Botón de inicio de sesión con Google

**Dado que** el usuario se encuentra en la pantalla de inicio de sesión,

**cuando** visualiza las opciones de autenticación,

**entonces** debe mostrarse un botón claramente identificado con el logo de Google que permita iniciar sesión con una cuenta de Google.

---

### CA-008.2 — Redirección a Google

**Dado que** el usuario presiona el botón de inicio de sesión con Google,

**cuando** se activa la acción,

**entonces** el sistema debe redirigir al usuario a la página de autenticación de Google para que seleccione o ingrese su cuenta de Google.

---

### CA-008.3 — Inicio de sesión exitoso crea o vincula la cuenta

**Dado que** el usuario se autentica correctamente con Google,

**cuando** el sistema recibe la respuesta de autenticación,

**entonces** si el correo de Google no está registrado, se crea una nueva cuenta asociada a ese correo y se inicia sesión; si ya existe una cuenta con ese correo, se vincula la sesión con la cuenta existente.

---

### CA-008.4 — Cuenta ya existente vinculada

**Dado que** el usuario intenta iniciar sesión con Google utilizando un correo que ya tiene una cuenta registrada en Lubix,

**cuando** completa la autenticación en Google,

**entonces** el sistema debe iniciar sesión directamente vinculando la cuenta existente, sin solicitar registro adicional.

---

### CA-008.5 — Cancelación del proceso

**Dado que** el usuario es redirigido a la página de autenticación de Google,

**cuando** cancela el proceso de autenticación o cierra la ventana,

**entonces** el sistema debe redirigir al usuario de vuelta a la pantalla de inicio de sesión de Lubix sin iniciar sesión, mostrando un mensaje informativo.

---

### CA-008.6 — Cierre de sesión normal

**Dado que** el usuario inició sesión mediante su cuenta de Google,

**cuando** presiona la opción de cerrar sesión,

**entonces** la sesión se cierra correctamente y el usuario es redirigido a la pantalla de inicio de sesión, pudiendo volver a autenticarse con Google o con otro método.

---
