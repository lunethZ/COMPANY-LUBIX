# HU-033 — Ordenar resultados

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-033 |
| Título | Ordenar resultados |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-033 |

---

## Historia

Como comprador de Lubix, quiero ordenar los resultados de búsqueda por precio, nombre y fecha, para encontrar los productos de forma más rápida.

---

## Criterios de aceptación

### CA-033.1 — Ordenar por precio

**Dado que** estoy en la página de catálogo de productos,

**cuando** selecciono la opción de ordenar "Precio: menor a mayor" o "Precio: mayor a menor",

**entonces** los productos deben reorganizarse según el precio de forma ascendente o descendente respectivamente.

### CA-033.2 — Ordenar por nombre

**Dado que** estoy en la página de catálogo de productos,

**cuando** selecciono la opción de ordenar "Nombre: A-Z" o "Nombre: Z-A",

**entonces** los productos deben reorganizarse alfabéticamente por nombre de forma ascendente o descendente.

### CA-033.3 — Ordenar por más recientes

**Dado que** estoy en la página de catálogo de productos,

**cuando** selecciono la opción de ordenar "Más recientes",

**entonces** los productos deben mostrarse ordenados por fecha de publicación, mostrando los más nuevos primero.

### CA-033.4 — Cambio de dirección de orden

**Dado que** tengo un criterio de ordenamiento seleccionado,

**cuando** hago clic nuevamente en el mismo criterio de orden,

**entonces** la dirección del orden debe invertirse (de ascendente a descendente o viceversa).

---
