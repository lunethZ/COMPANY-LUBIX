# HU-050 — Proceder al pago

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-050 |
| Título | Proceder al pago |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-050 |

---

## Historia

Como usuario de Lubix, quiero proceder al pago desde el carrito, para completar la compra de mis productos.

---

## Criterios de aceptación

### CA-050.1 — Botón de proceder al pago

**Dado que** tengo al menos un producto en el carrito,

**cuando** reviso el resumen del carrito,

**entonces** debe mostrarse un botón identificado como "Proceder al pago" que esté habilitado y sea accesible.

### CA-050.2 — Revalidación de stock

**Dado que** hago clic en "Proceder al pago",

**cuando** el sistema inicia el proceso de checkout,

**entonces** debe revalidarse el stock de cada producto en el carrito y mostrarse un mensaje de advertencia si alguno ya no está disponible o tiene stock insuficiente.

### CA-050.3 — Selección de dirección de envío

**Dado que** estoy en el proceso de pago,

**cuando** avanzo al paso de envío,

**entonces** debo poder seleccionar una dirección de envío registrada o agregar una nueva dirección antes de continuar.

### CA-050.4 — Selección de método de pago

**Dado que** seleccioné mi dirección de envío,

**cuando** avanzo al paso de pago,

**entonces** debo poder elegir entre los métodos de pago disponibles (tarjeta de crédito, débito, transferencia, etc.) y completar los datos requeridos.

### CA-050.5 — Creación del pedido

**Dado que** confirmé la dirección de envío, el método de pago y revisé el resumen final,

**cuando** hago clic en "Confirmar compra",

**entonces** el sistema debe crear el pedido, asignarle un número de orden único, vaciar el carrito y mostrar una pantalla de confirmación con los datos del pedido.