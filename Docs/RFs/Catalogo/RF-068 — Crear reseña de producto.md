# RF-068 — Crear reseña de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-068 |
| Nombre | Crear reseña de producto |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir a un usuario autenticado calificar y comentar un producto que haya comprado, aportando su experiencia a otros compradores.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| product_id | UUID | Sí | Debe existir |
| rating | Entero | Sí | 1 a 5 |
| title | Texto | Opcional | Máx 255 caracteres |
| comment | Texto | Opcional | Máx 500 caracteres |

---

## Proceso

- El usuario accede a las reseñas de un producto comprado.
- El backend valida que el usuario haya comprado el producto.
- Se verifica que el usuario no haya reseñado ya ese producto.
- Se crea la reseña con la calificación y comentario.
- Se actualiza la calificación promedio del producto.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Reseña creada | 200 | "Reseña creada correctamente" |
| Ya reseñado | 400 | "Ya has calificado este producto" |
| Solo productos comprados | 403 | "Solo puedes reseñar productos que hayas comprado" |
| No autenticado | 401 | "Unauthorized" |

---

## Reglas de negocio

RN-001: Solo usuarios que hayan comprado el producto pueden reseñarlo.  
RN-002: Un usuario solo puede dejar una reseña por producto.  
RN-003: La calificación es obligatoria y debe estar entre 1 y 5.
