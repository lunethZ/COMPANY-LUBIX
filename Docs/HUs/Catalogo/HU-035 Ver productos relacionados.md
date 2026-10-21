# HU-035 — Ver productos relacionados

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-035 |
| Título | Ver productos relacionados |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-035 |

---

## Historia

Como comprador de Lubix, quiero ver productos relacionados al producto que estoy visualizando, para descubrir opciones similares que puedan interesarme.

---

## Criterios de aceptación

### CA-035.1 — Sección de productos relacionados

**Dado que** estoy en la página de detalle de un producto,

**cuando** desplazo hacia la parte inferior de la página,

**entonces** debe mostrarse una sección titulada "Productos relacionados" ubicada después de la descripción y reseñas.

### CA-035.2 — Máximo 4 productos mostrados

**Dado que** existen más de 4 productos relacionados disponibles,

**cuando** se carga la sección de productos relacionados,

**entonces** deben mostrarse como máximo 4 productos, seleccionados por relevancia o similitud.

### CA-035.3 — Misma categoría

**Dado que** estoy viendo el detalle de un producto de la categoría "Electrónica",

**cuando** se cargan los productos relacionados,

**entonces** todos los productos mostrados deben pertenecer a la misma categoría o a categorías estrechamente vinculadas.

### CA-035.4 — Navegación al detalle

**Dado que** estoy en la sección de productos relacionados,

**cuando** hago clic en cualquiera de los productos mostrados,

**entonces** debe redirigirme a la página de detalle de ese producto con toda su información.

---
