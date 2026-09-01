# HU-049 — Recuperar carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-049 |
| Título | Recuperar carrito |
| Módulo | Carrito de Compras |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-049 |

---

## Historia

Como usuario de Lubix, quiero recuperar mi carrito guardado, para continuar mi compra con los productos que tenía pendientes.

---

## Criterios de aceptación

### CA-049.1 — Restauración al iniciar sesión

**Dado que** tenía productos en el carrito en una sesión anterior y estoy autenticado,

**cuando** inicio sesión en la plataforma,

**entonces** mi carrito debe restaurarse automáticamente con los productos, cantidades y estados que tenía al cerrar la sesión.

### CA-049.2 — Recuperación por sesión activa

**Dado que** estoy navegando en la plataforma y cierra el navegador accidentalmente,

**cuando** vuelvo a abrir el navegador e ingreso al sitio,

**entonces** el carrito debe recuperarse desde el almacenamiento local manteniendo los productos que tenía.

### CA-049.3 — Manejo de productos sin stock

**Dado que** tenía productos en el carrito guardado,

**cuando** el sistema restaura el carrito y detecta que alguno de los productos ya no tiene stock disponible,

**entonces** el producto debe marcarse como no disponible, deshabilitarse la cantidad y mostrarse una notificación al usuario indicando cuáles productos ya no están disponibles.

### CA-049.4 — Notificación de restauración

**Dado que** el carrito fue restaurado exitosamente,

**cuando** se muestra la página del carrito,

**entonces** debe desplegarse un mensaje informativo indicando que el carrito fue recuperado con el número de productos restaurados.

---
