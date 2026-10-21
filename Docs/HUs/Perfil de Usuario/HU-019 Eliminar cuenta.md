# HU-019 — Eliminar cuenta

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-019 |
| Título | Eliminar cuenta |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-019 |

---

## Historia

Como usuario de Lubix, quiero eliminar mi cuenta, para retirarme de la plataforma y borrar mis datos personales de forma permanente.

---

## Criterios de aceptación

### CA-019.1 — Opción de eliminar cuenta

**Dado que** el usuario está en la configuración de su cuenta,

**cuando** busque la opción de eliminación,

**entonces** el sistema muestra una opción para eliminar la cuenta de forma accesible.

### CA-019.2 — Confirmación con contraseña

**Dado que** el usuario intenta eliminar su cuenta,

**cuando** se solicite el cambio,

**entonces** el sistema exige ingresar la contraseña actual para verificar la identidad antes de proceder.

### CA-019.3 — Advertencia de irreversibilidad

**Dado que** el usuario está a punto de eliminar la cuenta,

**cuando** se confirme la acción,

**entonces** el sistema muestra una advertencia clara de que la eliminación es permanente e irreversible.

### CA-019.4 — Eliminación de datos

**Dado que** la cuenta ha sido eliminada,

**cuando** el sistema procese la solicitud,

**entonces** se eliminan los datos personales del usuario de la plataforma, cumpliendo con la normativa de protección de datos.

### CA-019.5 — Cierre de la sesión

**Dado que** la cuenta ha sido eliminada,

**cuando** finalice el proceso,

**entonces** el sistema cierra la sesión del usuario y lo redirige a la pantalla de inicio sin permitirle volver a ingresar con esas credenciales.

---
