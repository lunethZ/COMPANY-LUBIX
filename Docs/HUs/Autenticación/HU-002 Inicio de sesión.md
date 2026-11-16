# HU-002 — Inicio de sesión

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-002 |
| Título | Inicio de sesión |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Implementado |
| RF asociados | RF-002 |

---

## Historia

Como usuario registrado de Lubix, quiero iniciar sesión con mi correo electrónico y contraseña, para acceder a mi cuenta y utilizar las funcionalidades de la plataforma según mi rol.

---

## Criterios de aceptación

### CA-002.1 — Visualización del formulario de login

**Dado que** ingreso a la página de inicio de sesión,

**cuando** la interfaz carga,

**entonces** debo visualizar los campos de correo electrónico, contraseña y el botón "Iniciar sesión".

---

### CA-002.2 — Correo obligatorio

**Dado que** estoy en el formulario de login,

**cuando** dejo el campo de correo vacío,

**entonces** debo ver el mensaje:

> El correo electrónico es obligatorio.

---

### CA-002.3 — Contraseña obligatoria

**Dado que** estoy en el formulario de login,

**cuando** dejo el campo de contraseña vacío,

**entonces** debo ver el mensaje:

> La contraseña es obligatoria.

---

### CA-002.4 — Formato válido de correo

**Dado que** ingreso un correo inválido,

**cuando** intento iniciar sesión,

**entonces** debo ver el mensaje:

> Ingrese un correo electrónico válido.

---

### CA-002.5 — Credenciales incorrectas

**Dado que** ingreso un correo o contraseña incorrectos,

**cuando** envío el formulario,

**entonces** debo ver el mensaje:

> Credenciales incorrectas.

---

### CA-002.6 — Usuario no registrado

**Dado que** ingreso un correo que no existe en el sistema,

**cuando** intento iniciar sesión,

**entonces** debo ver el mensaje:

> El usuario no se encuentra registrado.

---

### CA-002.7 — Usuario sin verificación de correo

**Dado que** mi cuenta no ha sido verificada,

**cuando** intento iniciar sesión,

**entonces** debo ver el mensaje:

> Debes verificar tu correo electrónico antes de iniciar sesión.

---

### CA-002.8 — Inicio de sesión exitoso

**Dado que** ingreso credenciales válidas,

**cuando** envío el formulario,

**entonces** debo ser autenticado y redirigido al dashboard correspondiente a mi rol.

---

### CA-002.9 — Redirección por rol

**Dado que** inicio sesión exitosamente,

**cuando** el sistema valida mi rol,

**entonces** debo ser enviado a:

- Usuario → Dashboard de cliente
- Vendedor → Dashboard de vendedor
- Administrador → Panel administrativo

---

### CA-002.10 — Opción "Recordarme"

**Dado que** estoy en el login,

**cuando** activo la opción "Recordarme",

**entonces** mi sesión debe mantenerse activa por un periodo extendido.

---

### CA-002.11 — Estado de carga

**Dado que** he enviado el formulario,

**cuando** el sistema está validando credenciales,

**entonces** el botón "Iniciar sesión" debe deshabilitarse y mostrar carga.

---

### CA-002.12 — Enlace a registro

**Dado que** estoy en la pantalla de login,

**cuando** no tengo cuenta,

**entonces** debo ver un enlace "Crear cuenta" que me lleve al registro.

---

### CA-002.13 — Enlace a recuperación de contraseña

**Dado que** olvidé mi contraseña,

**cuando** estoy en el login,

**entonces** debo ver un enlace "¿Olvidaste tu contraseña?" que me lleve al módulo de recuperación.