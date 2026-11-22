# HU-001 — Registro de cuenta

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-001 |
| Título | Registro de cuenta |
| Módulo | Autenticación |
| Prioridad | Alta |
| Estado | Implementado |
| RF asociados | RF-001 |

---

## Historia

Como visitante de Lubix, quiero crear una cuenta proporcionando mis datos personales y credenciales de acceso, para poder utilizar las funcionalidades de compra, venta y gestión disponibles en la plataforma.

---

## Criterios de aceptación

### CA-001.1 — Visualización del formulario

**Dado que** ingreso a la página de registro,

**cuando** se carga la interfaz,

**entonces** debo visualizar los campos nombre y apellidos, correo electrónico, contraseña, confirmación de contraseña y botón de registro.

---

### CA-001.2 — Nombre obligatorio

**Dado que** estoy completando el formulario,

**cuando** dejo el campo nombre vacío,

**entonces** debo visualizar el mensaje:

> El nombre es obligatorio.

---

### CA-001.3 — Longitud mínima del nombre

**Dado que** estoy completando el formulario,

**cuando** ingreso un nombre con menos de 2 caracteres,

**entonces** debo visualizar el mensaje:

> El nombre debe tener al menos 2 caracteres.

---

### CA-001.4 — Correo obligatorio

**Dado que** estoy completando el formulario,

**cuando** dejo vacío el campo correo electrónico,

**entonces** debo visualizar el mensaje:

> El correo electrónico es obligatorio.

---

### CA-001.5 — Formato válido de correo

**Dado que** estoy completando el formulario,

**cuando** ingreso un correo electrónico inválido,

**entonces** debo visualizar el mensaje:

> Ingrese un correo electrónico válido.

---

### CA-001.6 — Contraseña obligatoria

**Dado que** estoy completando el formulario,

**cuando** dejo vacío el campo contraseña,

**entonces** debo visualizar el mensaje:

> La contraseña es obligatoria.

---

### CA-001.7 — Requisitos mínimos de contraseña

**Dado que** estoy completando el formulario,

**cuando** ingreso una contraseña que no cumple los requisitos mínimos,

**entonces** debo visualizar un mensaje indicando los requisitos pendientes.

Los requisitos son:

- Mínimo 8 caracteres.
- Al menos una letra mayúscula.
- Al menos una letra minúscula.
- Al menos un número.

---

### CA-001.8 — Confirmación de contraseña

**Dado que** estoy completando el formulario,

**cuando** la contraseña y la confirmación no coinciden,

**entonces** debo visualizar el mensaje:

> Las contraseñas no coinciden.

---

### CA-001.9 — Correo duplicado

**Dado que** intento registrarme con un correo ya existente,

**cuando** envío el formulario,

**entonces** debo visualizar el mensaje:

> Este correo ya se encuentra registrado.

---

### CA-001.10 — Registro exitoso

**Dado que** diligencié correctamente todos los campos,

**cuando** envío el formulario,

**entonces** el sistema debe crear mi cuenta exitosamente.

---

### CA-001.11 — Envío de correo de verificación

**Dado que** mi cuenta fue creada exitosamente,

**cuando** finaliza el proceso de registro,

**entonces** debo recibir un correo electrónico con un enlace de activación.

---

### CA-001.12 — Bloqueo de acceso sin verificar correo

**Dado que** aún no he verificado mi correo electrónico,

**cuando** intento iniciar sesión,

**entonces** debo visualizar el mensaje:

> Debes verificar tu correo electrónico antes de iniciar sesión.

---

### CA-001.13 — Activación exitosa de cuenta

**Dado que** recibí el correo de activación,

**cuando** hago clic en el enlace dentro del tiempo permitido,

**entonces** mi cuenta debe quedar activa y disponible para iniciar sesión.

---

### CA-001.14 — Enlace de activación expirado

**Dado que** el enlace de activación ha expirado,

**cuando** intento utilizarlo,

**entonces** debo visualizar el mensaje:

> El enlace de verificación ha expirado.

---

### CA-001.15 — Indicador de carga

**Dado que** envié el formulario de registro,

**cuando** la solicitud está siendo procesada,

**entonces** el botón "Crear cuenta" debe permanecer deshabilitado y mostrar un indicador de carga.