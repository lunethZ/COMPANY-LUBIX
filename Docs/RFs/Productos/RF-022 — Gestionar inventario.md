# RF-022 — Gestionar inventario

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-022 |
| Nombre | Gestionar inventario |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Parcial |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir controlar el stock de productos.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| stock | Entero | Sí | ≥ 0 |

---

## Proceso

- Vendedor actualiza stock.
- Backend valida datos.
- Se actualiza inventario.
- Se sincroniza con catálogo.

---

## Reglas de negocio

RN-001: El stock no puede ser negativo.  
RN-002: Cambios afectan disponibilidad en tiempo real.