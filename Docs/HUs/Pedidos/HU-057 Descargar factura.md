# HU-057 — Descargar factura

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-057 |
| Título | Descargar factura |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-057 |

---

## Historia

Como usuario de Lubix, quiero descargar la factura de mi pedido, para tener el comprobante oficial de mi compra.

---

## Criterios de aceptación

### CA-057.1 — Botón de descarga

**Dado que** el usuario visualiza el detalle de un pedido,

**cuando** el pedido disponga de factura,

**entonces** el sistema muestra una opción visible para descargar la factura.

### CA-057.2 — Generación de PDF

**Dado que** el usuario pulsa el botón de descargar factura,

**cuando** se solicite el archivo,

**entonces** el sistema genera un documento PDF con el formato oficial de factura de Lubix.

### CA-057.3 — Datos correctos en la factura

**Dado que** el sistema genera la factura,

**cuando** se complete el documento,

**entonces** la factura incluye los datos del emisor y del cliente, los artículos con cantidades y precios, los impuestos, los descuentos y el total, coincidentes con el pedido.

### CA-057.4 — Disponible para pedidos entregados

**Dado que** el pedido ha sido entregado o pagado completamente,

**cuando** la factura este disponible para generar,

**entonces** el sistema permite descargarla únicamente para pedidos en estado entregado o ya pagados.

### CA-057.5 — Persistencia de la factura

**Dado que** el usuario ya ha descargado una factura,

**cuando** acceda nuevamente al pedido,

**entonces** el sistema mantiene la factura disponible para volver a descargarla en cualquier momento.

---
