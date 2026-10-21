# HU-062 — Gestionar usuarios

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-062 |
| Título | Gestionar usuarios |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-062 |

---

## Historia

Como administrador de Lubix, quiero consultar y eliminar usuarios de la plataforma, para mantener el control sobre las cuentas registradas.

---

## Criterios de aceptación

### CA-062.1 — Listado de usuarios

**Dado que** soy administrador y accedo a la gestión de usuarios,

**cuando** se carga la vista,

**entonces** debo ver el listado de usuarios con su nombre, correo, rol, estado de verificación y fecha de creación.

---

### CA-062.2 — Acción de eliminar

**Dado que** reviso un usuario del listado,

**cuando** selecciono la opción de eliminar,

**entonces** el sistema solicita confirmación antes de realizar la eliminación.

---

### CA-062.3 — Eliminación exitosa

**Dado que** confirmo la eliminación del usuario,

**cuando** se procesa la solicitud,

**entonces** el usuario y sus datos asociados se eliminan y el listado se actualiza.

---

### CA-062.4 — Bloqueo de eliminación de administradores

**Dado que** intento eliminar a otro administrador,

**cuando** envía la solicitud,

**entonces** el sistema muestra un error indicando que no se puede eliminar un administrador.

---

### CA-062.5 — Usuario no encontrado

**Dado que** intento eliminar un usuario inexistente,

**cuando** se procesa la petición,

**entonces** el sistema muestra un mensaje de "usuario no encontrado".

---

### CA-062.6 — Estado vacío

**Dado que** no existen usuarios registrados,

**cuando** se carga el listado,

**entonces** se muestra un mensaje indicando que no hay usuarios.
