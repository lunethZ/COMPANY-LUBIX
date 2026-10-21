# HU-031 — Buscar productos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-031 |
| Título | Buscar productos |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-031 |

---

## Historia

Como usuario de Lubix, quiero buscar productos escribiendo texto, para encontrar rápidamente lo que necesito dentro del catálogo.

---

## Criterios de aceptación

### CA-031.1 — Campo de búsqueda visible

**Dado que** estoy en el catálogo de productos,

**cuando** accedo a la vista principal,

**entonces** veo un campo de búsqueda disponible en la parte superior.

### CA-031.2 — Resultados con información relevante

**Dado que** escribo un término de búsqueda,

**cuando** el sistema ejecuta la búsqueda,

**entonces** muestra los productos coincidentes con su nombre, precio e imagen.

### CA-031.3 — Búsqueda sin distinción de mayúsculas

**Dado que** escribo un término de búsqueda,

**cuando** el texto contiene mayúsculas, minúsculas o una mezcla de ambas,

**entonces** el sistema encuentra los mismos resultados sin diferenciar mayúsculas de minúsculas.

### CA-031.4 — Sin resultados encontrados

**Dado que** el texto buscado no coincide con ningún producto,

**cuando** se ejecuta la búsqueda,

**entonces** el sistema muestra un estado vacío con un mensaje indicando que no hay resultados.

### CA-031.5 — Búsqueda en tiempo real

**Dado que** estoy escribiendo en el campo de búsqueda,

**cuando** completo al menos un carácter,

**entonces** los resultados se actualizan de forma inmediata conforme escribo.

### CA-031.6 — Limpieza de la búsqueda

**Dado que** tengo resultados de una búsqueda aplicada,

**cuando** borro el texto del campo de búsqueda,

**entonces** vuelvo a ver el catálogo completo de productos.

---

