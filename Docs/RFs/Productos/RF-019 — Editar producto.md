# RF-019 — Editar producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-019 |
| Nombre | Editar producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir modificar la información de productos existentes.

---

## Proceso

- Vendedor selecciona producto.
- Se valida propiedad del producto.
- Se actualizan campos permitidos.
- Se guarda en base de datos.

---

## Reglas de negocio

RN-001: Solo el propietario o admin puede editar.  
RN-002: No se permite modificar ID del producto.