# RF-036 — Ver carrito de compras

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-036 |
| Nombre | Ver carrito de compras |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario visualizar los productos agregados al carrito con sus cantidades, precios y subtotal.

---

## Proceso

- Usuario abre el carrito.
- Backend obtiene carrito activo del usuario.
- Se listan productos con detalle.
- Se calcula subtotal, impuestos y total.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Carrito cargado | 200 | Lista de productos |
| Carrito vacío | 200 | "Cart is empty" |

---

## Reglas de negocio

RN-001: Solo el usuario dueño puede ver su carrito.  
RN-002: El total debe calcularse dinámicamente.