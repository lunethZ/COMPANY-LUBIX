# RF-064 — Gestionar PQRS

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-064 |
| Nombre | Gestionar PQRS |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al administrador consultar todas las solicitudes PQRS del sistema y cambiar su estado a resuelto cuando corresponda.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| token_administrador | JWT | Sí | Rol administrador |
| pqrs_id | UUID | Sí (para resolver) | Debe existir |

---

## Proceso

- El administrador accede a la sección de PQRS.
- El backend devuelve todas las solicitudes con tipo, asunto, descripción, estado y usuario.
- El administrador revisa cada solicitud.
- Al resolver, se actualiza el estado de la PQRS a `resolved`.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Listado de PQRS | 200 | Solicitudes con tipo, estado y autor |
| PQRS resuelta | 200 | "PQRS marcada como resuelta" |
| PQRS no encontrada | 404 | "PQRS no encontrada" |

---

## Reglas de negocio

RN-001: Solo el administrador puede gestionar todas las PQRS.  
RN-002: Una PQRS resuelta no puede volver a estado pendiente.
