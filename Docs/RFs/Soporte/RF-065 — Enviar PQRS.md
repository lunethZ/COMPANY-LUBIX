# RF-065 — Enviar PQRS

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-065 |
| Nombre | Enviar PQRS |
| Módulo | Soporte |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir a cualquier usuario autenticado enviar una solicitud PQRS (petición, queja, reclamo o sugerencia) indicando el tipo, asunto y una descripción.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| type | Texto | Sí | petición, queja, reclamo, sugerencia o eliminación |
| subject | Texto | Sí | No vacío |
| description | Texto | Sí | No vacío |

---

## Proceso

- El usuario completa el formulario de solicitud.
- El backend valida los campos obligatorios.
- Se registra la PQRS con estado `pending`.
- Se asocia al usuario autenticado.
- La solicitud queda disponible para revisión del administrador.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Solicitud enviada | 200 | "Tu solicitud ha sido enviada" |
| Error de validación | 422 | Detalle de errores |
| No autenticado | 401 | "Unauthorized" |

---

## Reglas de negocio

RN-001: Solo usuarios autenticados pueden enviar PQRS.  
RN-002: Toda PQRS se crea en estado pendiente.
