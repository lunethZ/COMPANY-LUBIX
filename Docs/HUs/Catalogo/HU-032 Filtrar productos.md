# HU-032 — Filtrar productos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-032 |
| Título | Filtrar productos |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-032 |

---

## Historia

Como comprador de Lubix, quiero filtrar productos por categoría, precio y disponibilidad, para encontrar más fácilmente los productos que necesito.

---

## Criterios de aceptación

### CA-032.1 — Filtro por categoría

**Dado que** estoy en la página de catálogo de productos,

**cuando** selecciono una o varias categorías del filtro lateral,

**entonces** solo deben mostrarse los productos que pertenezcan a las categorías seleccionadas.

### CA-032.2 — Filtro por rango de precio

**Dado que** estoy en la página de catálogo de productos,

**cuando** defino un rango de precio mínimo y máximo en el filtro,

**entonces** solo deben mostrarse los productos cuyo precio se encuentre dentro del rango especificado.

### CA-032.3 — Filtro por disponibilidad

**Dado que** estoy en la página de catálogo de productos,

**cuando** activo el filtro de "Solo productos disponibles",

**entonces** solo deben mostrarse los productos que tengan stock mayor a cero.

### CA-032.4 — Limpiar filtros

**Dado que** tengo uno o varios filtros activos en el catálogo,

**cuando** hago clic en la opción "Limpiar filtros",

**entonces** todos los filtros deben desactivarse y el catálogo debe volver a mostrar todos los productos sin restricciones.

### CA-032.5 — Visualización de filtros activos

**Dado que** tengo filtros aplicados en el catálogo,

**cuando** se muestra la lista de resultados,

**entonces** debe visualizarse una indicación clara de qué filtros están activos y cuántos resultados coinciden con los filtros seleccionados.

---
