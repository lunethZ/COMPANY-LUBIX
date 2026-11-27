# RF-049 — Calificar pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-049 |
| Nombre | Calificar pedido |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario calificar un pedido y los productos recibidos.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| rating | Entero | Sí | 1 a 5 |
| comment | Texto | No | Máx 500 caracteres |

---

## Proceso

- Usuario envía calificación.
- Se valida pedido entregado.
- Se guarda en base de datos.
- Se asocia a producto y vendedor.

---

## Reglas de negocio

RN-001: Solo pedidos confirmados pueden ser calificados.