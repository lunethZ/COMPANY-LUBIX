# RF-045 — Ver detalle del pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-045 |
| Nombre | Detalle del pedido |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir visualizar toda la información detallada de un pedido específico.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| order_id | UUID | Sí | Debe existir |

---

## Proceso

- Usuario selecciona pedido.
- Backend valida propiedad.
- Se consultan productos, totales y estado.
- Se retorna información completa.

---

## Reglas de negocio

RN-001: No se puede ver pedidos de otros usuarios.