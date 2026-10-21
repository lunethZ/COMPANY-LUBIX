# HU-007 — Reenviar correo de verificación

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-007 |
| Título | Reenviar correo de verificación |
| Módulo | Autenticación |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-007 |

---

## Historia

Como usuario de Lubix, quiero reenviar el correo de verificación, para obtener un nuevo código cuando el anterior expiró o no fue recibido.

---

## Criterios de aceptación

### CA-007.1 — Botón de reenvío visible

**Dado que** el usuario no ha verificado su correo electrónico,

**cuando** accede a la pantalla de verificación o a la sección de configuración de su cuenta,

**entonces** debe visualizarse un botón o enlace que permita solicitar el reenvío del correo de verificación.

---

### CA-007.2 — Confirmación de reenvío

**Dado que** el usuario presiona el botón de reenvío de correo de verificación,

**cuando** la solicitud se procesa correctamente,

**entonces** el sistema debe mostrar un mensaje de confirmación indicando que se ha enviado un nuevo correo de verificación a la dirección registrada.

---

### CA-007.3 — Intervalo mínimo entre envíos

**Dado que** el usuario solicita el reenvío del correo de verificación,

**cuando** el intervalo de tiempo mínimo entre envíos no ha transcurrido,

**entonces** el sistema debe mostrar un mensaje informando que debe esperar antes de solicitar un nuevo reenvío, deshabilitando temporalmente el botón.

---

### CA-007.4 — Solo para cuentas no verificadas

**Dado que** el usuario tiene una cuenta cuyo correo ya fue verificado,

**cuando** accede a su perfil o configuración,

**entonces** la opción de reenvío de correo de verificación no debe estar disponible, ya que no es necesaria.

---

### CA-007.5 — Notificación enviada al correo

**Dado que** el usuario solicita el reenvío del correo de verificación,

**cuando** el sistema procesa la solicitud,

**entonces** se debe enviar un nuevo correo electrónico al usuario que contenga un código de verificación válido y vigente.

---
