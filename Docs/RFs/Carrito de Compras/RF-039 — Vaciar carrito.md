# RF-039 — Vaciar carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-039 |
| Nombre | Vaciar carrito |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir eliminar todos los productos del carrito de compras.

---

## Proceso

- Usuario selecciona “vaciar carrito”.
- Backend elimina todas las líneas del carrito.
- Se reinicia el total a 0.

---

## Reglas de negocio

RN-001: Acción irreversible dentro de la sesión actual.