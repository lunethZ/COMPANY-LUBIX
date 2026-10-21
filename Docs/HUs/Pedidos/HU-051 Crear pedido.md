# HU-051 — Crear pedido

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-051 |
| Título | Crear pedido |
| Módulo | Pedidos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-051 |

---

## Historia

Como usuario de Lubix, quiero crear un pedido a partir de mi carrito, para formalizar la compra de los productos que he seleccionado.

---

## Criterios de aceptación

### CA-051.1 — Confirmación del contenido del carrito

**Dado que** tengo productos agregados a mi carrito,

**cuando** inicio el proceso de crear el pedido,

**entonces** el sistema me muestra el resumen de todos los artículos, cantidades y precios antes de confirmar.

### CA-051.2 — Validación de stock disponible

**Dado que** confirmo el contenido de mi carrito,

**cuando** el sistema procesa la creación del pedido,

**entonces** valida que todos los artículos tengan stock suficiente para las cantidades solicitadas.

### CA-051.3 — Bloqueo por falta de stock

**Dado que** alguno de los artículos del carrito no tiene stock suficiente,

**cuando** intento crear el pedido,

**entonces** el sistema impide la creación, indica qué artículo no está disponible y no permite continuar.

### CA-051.4 — Asignación de número de pedido único

**Dado que** la validación de stock fue exitosa,

**cuando** se crea el pedido,

**entonces** el sistema asigna un número de pedido único e irrepetible.

### CA-051.5 — Estado inicial del pedido

**Dado que** el pedido fue creado correctamente,

**cuando** el sistema confirma la creación,

**entonces** el pedido queda en estado "Pago pendiente" y queda a la espera del pago.

### CA-051.6 — Reserva temporal de stock

**Dado que** el pedido fue creado en estado "Pago pendiente",

**cuando** el sistema registra el pedido,

**entonces** reserva temporalmente el stock de los artículos para impedir que otros compradores los adquieran.

### CA-051.7 — Liberación de stock por caducidad

**Dado que** un pedido en "Pago pendiente" no se completa dentro del tiempo límite,

**cuando** expira el periodo de pago,

**entonces** el sistema libera automáticamente el stock reservado.

---

