# RF-051 — Hacer seguimiento de pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-051 |
| Nombre | Seguimiento de pedido |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario rastrear el estado del pedido en tiempo real.

---

## Proceso

- Usuario consulta pedido.
- Backend devuelve estado actual.
- Se muestran etapas: creado, pagado, enviado, entregado.
- Se actualiza según eventos logísticos.

---

## Reglas de negocio

RN-001: El estado debe actualizarse en tiempo real o casi real.  
RN-002: Debe reflejar cambios de logística y pagos.