# HU-049 — Guardar y recuperar carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-049 |
| Título | Guardar y recuperar carrito |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-049 |

---

## Historia

Como usuario de Lubix, quiero guardar mi carrito para conservar los productos que seleccioné y recuperarlo cuando regrese a la plataforma, para continuar mi compra con los productos que tenía pendientes.

### CA-049.5 — Manejo de productos sin stock

**Dado que** tenía productos en el carrito guardado,

**cuando** el sistema restaura el carrito y detecta que alguno de los productos ya no tiene stock disponible,

**entonces** el producto debe marcarse como no disponible, deshabilitarse la cantidad y mostrarse una notificación al usuario indicando cuáles productos ya no están disponibles.

### CA-049.6 — Notificación de restauración

**Dado que** el carrito fue restaurado exitosamente,

**cuando** se muestra la página del carrito,

**entonces** debe desplegarse un mensaje informativo indicando que el carrito fue recuperado con el número de productos restaurados.
---
