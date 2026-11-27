# RF-035 — Agregar al carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-035 |
| Nombre | Agregar al carrito |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir que el usuario agregue productos al carrito de compras, indicando la cantidad deseada.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| product_id | UUID | Sí | Debe existir y estar publicado |
| quantity | Entero | Sí | > 0 y ≤ stock disponible |

---

## Proceso

- Usuario selecciona un producto.
- Frontend envía solicitud al backend.
- Backend valida existencia del producto.
- Se valida stock disponible.
- Si el producto ya existe en el carrito, se incrementa la cantidad.
- Si no existe, se crea una nueva línea en el carrito.
- Se actualiza el total del carrito.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Agregado exitoso | 200 | "Product added to cart" |
| Sin stock | 400 | "Insufficient stock" |
| Producto no existe | 404 | "Product not found" |

---

## Reglas de negocio

RN-001: No se puede agregar un producto sin stock disponible.  
RN-002: El carrito debe actualizarse en tiempo real.