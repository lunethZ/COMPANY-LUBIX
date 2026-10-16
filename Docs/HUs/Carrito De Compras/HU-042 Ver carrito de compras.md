# HU-042 — Ver carrito de compras

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-042 |
| Título | Ver carrito de compras |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-042 |

---

## Historia

Como usuario de Lubix, quiero ver los productos que tengo en mi carrito con sus cantidades, precios y subtotal, para revisar mi compra antes de proceder al pago.

---

## Criterios de aceptación

### CA-042.1 — Acceso al carrito

**Dado que** estoy navegando en la plataforma,

**cuando** hago clic en el ícono o enlace del carrito,

**entonces** el sistema debe mostrar la pantalla del carrito con los productos agregados.

### CA-042.2 — Visualización de la lista de productos

**Dado que** agrego productos a mi carrito de compras,

**cuando** accedo a la sección del carrito,

**entonces** debo ver la lista de productos agregados con su nombre, precio unitario, cantidad y subtotal de cada línea.

### CA-042.3 — Carrito vacío

**Dado que** no tengo productos en el carrito,

**cuando** accedo a la sección del carrito,

**entonces** debo visualizar un mensaje indicando que el carrito está vacío junto con una opción para explorar el catálogo.

### CA-042.4 — Resumen con subtotal

**Dado que** tengo productos en el carrito,

**cuando** visualizo la pantalla del carrito,

**entonces** debe mostrarse el subtotal calculado como la suma del precio unitario por la cantidad de cada producto.

### CA-042.5 — Acceso restringido al propietario

**Dado que** estoy autenticado en la plataforma,

**cuando** visualizo mi carrito,

**entonces** solo yo, como propietario de la cuenta, debo poder ver los productos de mi carrito.

### CA-042.6 — Cálculo dinámico del total

**Dado que** tengo productos con cantidades en el carrito,

**cuando** actualizo el carrito o modifico una cantidad,

**entonces** el subtotal y el total deben recalcularse dinámicamente.

---