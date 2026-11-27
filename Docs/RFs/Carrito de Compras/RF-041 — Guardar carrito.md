# RF-041 — Guardar carrito de compras

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-041 |
| Nombre | Guardar carrito |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir guardar el estado del carrito para futuras sesiones del usuario.

---

## Proceso

- Carrito se almacena en base de datos.
- Se asocia al usuario.
- Se mantiene persistente.

---

## Reglas de negocio

RN-001: El carrito debe persistir entre sesiones.