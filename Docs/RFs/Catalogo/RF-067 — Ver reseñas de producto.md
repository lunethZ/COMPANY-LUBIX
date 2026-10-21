# RF-067 — Ver reseñas de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-067 |
| Nombre | Ver reseñas de producto |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir visualizar las reseñas y calificaciones que otros usuarios han dejado sobre un producto, junto con la calificación promedio.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| product_id | UUID | Sí | Debe existir |

---

## Proceso

- El usuario abre el detalle de un producto.
- El backend consulta las reseñas asociadas.
- Se calcula la calificación promedio y el número de reseñas.
- Se muestran las reseñas ordenadas de más reciente a más antigua.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Reseñas encontradas | 200 | Listado con calificación, título, comentario y autor |
| Producto no existe | 404 | "Producto no encontrado" |

---

## Reglas de negocio

RN-001: Las reseñas son visibles para cualquier usuario.  
RN-002: La calificación varía entre 1 y 5 estrellas.
