# HU-052 — Ver historial

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-052 |
| Título | Ver historial |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-052 |

---

## Historia

Como usuario de Lubix, quiero ver mi historial de pedidos, para consultar el registro de mis compras realizadas.

---

## Criterios de aceptación

### CA-052.1 — Visualización de la lista

**Dado que** el usuario tiene pedidos registrados y accede a la sección de historial,

**cuando** la pantalla de historial se cargue,

**entonces** el sistema muestra la lista completa de pedidos realizados con su número, fecha, importe y estado.

### CA-052.2 — Filtro por estado

**Dado que** el usuario está en la sección de historial de pedidos,

**cuando** seleccione un estado específico en el filtro (pendiente, enviado, entregado, cancelado o devuelto),

**entonces** la lista se actualiza mostrando únicamente los pedidos que coinciden con ese estado.

### CA-052.3 — Filtro por rango de fechas

**Dado que** el usuario quiere consultar pedidos de un período concreto,

**cuando** indique una fecha de inicio y una fecha de fin,

**entonces** el sistema muestra únicamente los pedidos comprendidos dentro de ese rango de fechas.

### CA-052.4 — Paginación de resultados

**Dado que** el historial contiene una gran cantidad de pedidos,

**cuando** la lista de resultados supere el tamaño máximo por página,

**entonces** el sistema la organiza en páginas y ofrece controles de navegación para recorrerlas.

### CA-052.5 — Combinación de filtros

**Dado que** el usuario aplica más de un filtro a la vez,

**cuando** combine estado y rango de fechas,

**entonces** el sistema aplica ambos criterios de forma simultánea y muestra el resultado conjunto.

### CA-052.6 — Estado vacío

**Dado que** el usuario no tiene pedidos o ningún pedido coincide con los filtros aplicados,

**cuando** la lista de resultados esté vacía,

**entonces** el sistema muestra un mensaje informativo indicando que no hay pedidos para mostrar.

---
