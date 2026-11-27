# RF-021 — Cambiar precio de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-021 |
| Nombre | Cambiar precio de producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir actualizar el precio de un producto.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| price | Decimal | Sí | > 0 |

---

## Proceso

- Vendedor actualiza precio.
- Backend valida rol.
- Se actualiza producto.
- Se registra cambio en historial.

---

## Reglas de negocio

RN-001: El precio no puede ser negativo.  
RN-002: Cambios deben registrarse (auditoría).