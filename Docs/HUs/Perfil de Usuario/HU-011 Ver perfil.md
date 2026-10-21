# HU-011 — Ver perfil

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-011 |
| Título | Ver perfil |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-011 |

---

## Historia

Como usuario de Lubix, quiero ver mi perfil, para consultar mis datos personales e información de cuenta registrada.

---

## Criterios de aceptación

### CA-011.1 — Visualización del perfil

**Dado que** el usuario ha iniciado sesión,

**cuando** acceda a la sección de perfil,

**entonces** el sistema muestra la pantalla de perfil con los datos personales del usuario.

### CA-011.2 — Avatar de usuario

**Dado que** el usuario tiene una foto de perfil,

**cuando** se muestre el perfil,

**entonces** el sistema presenta el avatar o imagen de perfil de forma visible en la cabecera.

### CA-011.3 — Información personal

**Dado que** el usuario quiere revisar sus datos,

**cuando** se cargue el perfil,

**entonces** el sistema muestra el nombre, correo electrónico, teléfono y demás datos registrados del usuario.

### CA-011.4 — Fecha de registro

**Dado que** el usuario consulta su perfil,

**cuando** se muestre la información de la cuenta,

**entonces** el sistema indica la fecha o antigüedad desde la que el usuario es miembro de Lubix.

### CA-011.5 — Actualización de la información

**Dado que** el usuario modifica y guarda sus datos desde otra sección,

**cuando** vuelva a la pantalla de perfil,

**entonces** el sistema refleja la información actualizada en lugar de la anterior.

---
