# HU-012 — Editar perfil

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-012 |
| Título | Editar perfil |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-012 |

---

## Historia

Como usuario de Lubix, quiero editar mi perfil, para actualizar mis datos personales cuando sea necesario.

---

## Criterios de aceptación

### CA-012.1 — Formulario de edición

**Dado que** el usuario accede a la opción de editar su perfil,

**cuando** se cargue el formulario,

**entonces** el sistema muestra los campos editables con los valores actuales precargados.

### CA-012.2 — Validación de campos

**Dado que** el usuario modifica los campos del formulario,

**cuando** un campo contenga un valor inválido, como un correo mal formado o un teléfono incompleto,

**entonces** el sistema muestra un mensaje de error e impide guardar hasta corregir el valor.

### CA-012.3 — Guardado de los cambios

**Dado que** el usuario ha completado correctamente los campos,

**cuando** pulse el botón de guardar,

**entonces** el sistema actualiza los datos del perfil en la base de datos.

### CA-012.4 — Mensaje de éxito

**Dado que** los cambios se han guardado correctamente,

**cuando** se complete la actualización,

**entonces** el sistema muestra un mensaje de confirmación informando que el perfil ha sido actualizado.

### CA-012.5 — Actualización parcial

**Dado que** el usuario modifica solo algunos campos,

**cuando** guarde los cambios,

**entonces** el sistema actualiza únicamente los campos modificados y conserva el resto de datos sin alterar.

---
