# HU-055 — Solicitar devolución

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-055 |
| Título | Solicitar devolución |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-055 |

---

## Historia

Como usuario de Lubix, quiero solicitar la devolución de un pedido entregado, para devolver los productos con los que no estoy satisfecho.

---

## Criterios de aceptación

### CA-055.1 — Formulario de solicitud

**Dado que** el usuario tiene un pedido entregado dentro del plazo de devolución,

**cuando** acceda a la opción de solicitar devolución,

**entonces** el sistema muestra un formulario con los campos necesarios para iniciar la solicitud.

### CA-055.2 — Selección del motivo

**Dado que** el usuario está completando la solicitud de devolución,

**cuando** deba indicar el motivo,

**entonces** el sistema ofrece una lista de motivos predefinidos y exige seleccionar al menos uno para poder continuar.

### CA-055.3 — Subida de fotos

**Dado que** el usuario quiere aportar evidencia del estado del producto,

**cuando** agregue fotografías a la solicitud,

**entonces** el sistema permite adjuntar una o varias imágenes en un formato y tamaño admitidos.

### CA-055.4 — Consulta del estado de la devolución

**Dado que** el usuario ha enviado una solicitud de devolución,

**cuando** consulte el historial de solicitudes,

**entonces** el sistema muestra el estado actual de la misma, como "en revisión", "aprobada" o "rechazada".

### CA-055.5 — Procesamiento del reembolso

**Dado que** la solicitud de devolución ha sido aprobada,

**cuando** se valide la devolución del producto,

**entonces** el sistema procesa el reembolso por el método de pago original y notifica al usuario del resultado.

### CA-055.6 — Validación del plazo de devolución

**Dado que** el pedido supera el plazo máximo establecido para devoluciones,

**cuando** el usuario intente solicitar la devolución,

**entonces** el sistema no permite crear la solicitud y muestra un mensaje indicando que el plazo ha expirado.

---
