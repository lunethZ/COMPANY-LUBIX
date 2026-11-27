# RF-048 — Descargar factura

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-048 |
| Nombre | Descargar factura |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe generar y permitir la descarga de la factura del pedido en formato PDF.

---

## Proceso

- Usuario solicita factura.
- Backend genera documento PDF.
- Se descarga o envía al correo.

---

## Reglas de negocio

RN-001: Solo pedidos pagados generan factura.