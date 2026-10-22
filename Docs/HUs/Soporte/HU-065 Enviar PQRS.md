# HU-065 — Enviar PQRS

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-065 |
| Título | Enviar PQRS |
| Módulo | Soporte |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-065 |

---

## Historia

Como usuario de Lubix, quiero enviar una petición, queja, reclamo o sugerencia, para comunicar mis inquietudes y recibir respuesta de la plataforma.

---

## Criterios de aceptación

### CA-065.1 — Formulario de solicitud

**Dado que** ingreso a la sección de PQRS,

**cuando** pulso "Nueva solicitud",

**entonces** debo ver un formulario con tipo de solicitud, asunto y descripción.

---

### CA-065.2 — Selección de tipo

**Dado que** completo una solicitud,

**cuando** elijo el tipo,

**entonces** puedo seleccionar entre petición, queja, reclamo o sugerencia.

---

### CA-065.3 — Campos obligatorios

**Dado que** intento enviar la solicitud,

**cuando** dejo el asunto o la descripción vacíos,

**entonces** el botón de enviar permanece deshabilitado y no se permite el envío.

---

### CA-065.4 — Envío exitoso

**Dado que** diligencié correctamente la solicitud,

**cuando** confirmo el envío,

**entonces** el sistema guarda la solicitud y muestra un mensaje de confirmación.

---

### CA-065.5 — Estado inicial

**Dado que** envié una solicitud PQRS,

**cuando** esta queda registrada,

**entonces** se crea en estado pendiente a la espera de revisión del administrador.

---

### CA-065.6 — Solicitud de eliminación de cuenta

**Dado que** deseo eliminar mi cuenta,

**cuando** accedo desde la opción de eliminación,

**entonces** el sistema precarga una solicitud de tipo eliminación con el asunto correspondiente.
