# RF-066 — Ver mis solicitudes PQRS

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-066 |
| Nombre | Ver mis solicitudes PQRS |
| Módulo | Soporte |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario consultar el historial de sus solicitudes PQRS y conocer el estado actual de cada una.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| token | JWT | Sí | Usuario autenticado |

---

## Proceso

- El usuario accede a la sección de PQRS.
- El backend devuelve solo las solicitudes del usuario autenticado.
- Cada solicitud muestra tipo, asunto, descripción, fecha y estado.
- El usuario identifica si su solicitud está pendiente o resuelta.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Listado de mis PQRS | 200 | Solicitudes del usuario con su estado |
| Sin solicitudes | 200 | Listado vacío |
| No autenticado | 401 | "Unauthorized" |

---

## Reglas de negocio

RN-001: Cada usuario solo ve sus propias solicitudes PQRS.  
RN-002: El estado puede ser `pending` (pendiente) o `resolved` (resuelta).
