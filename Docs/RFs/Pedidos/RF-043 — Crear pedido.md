# RF-043 — Crear pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-043 |
| Nombre | Crear pedido |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir la creación automática de un pedido a partir de los productos confirmados en el carrito de compras.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| user_id | UUID | Sí | Debe existir |
| cart_id | UUID | Sí | Debe contener productos |
| shipping_address | UUID | Sí | Debe ser válida |
| payment_method | Texto | Sí | Método válido |

---

## Proceso

- Usuario confirma el carrito.
- Se valida stock de todos los productos.
- Se genera orden de compra.
- Se asigna número único de pedido.
- Se guarda en estado inicial “pendiente de pago”.
- Se bloquea temporalmente el stock.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Pedido creado | 201 | Pedido generado |
| Sin stock | 400 | "Insufficient stock" |
| Carrito vacío | 400 | "Cart is empty" |

---

## Reglas de negocio

RN-001: Un pedido solo puede crearse desde un carrito válido.  
RN-002: El stock se reserva al crear el pedido.