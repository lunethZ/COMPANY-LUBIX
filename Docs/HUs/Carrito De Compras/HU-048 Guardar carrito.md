# HU-048 — Guardar carrito

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-048 |
| Título | Guardar carrito |
| Módulo | Carrito de Compras |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-048 |

---

## Historia

Como usuario de Lubix, quiero guardar mi carrito, para conservar los productos que seleccioné y continuar mi compra más adelante.

---

## Criterios de aceptación

### CA-048.1 — Persistencia para usuarios autenticados

**Dado que** soy un usuario registrado e inicié sesión,

**cuando** agrego, modifico o elimino productos del carrito,

**entonces** los cambios deben guardarse automáticamente en el servidor y estar disponibles al acceder desde cualquier dispositivo.

### CA-048.2 — Sincronización al iniciar sesión

**Dado que** tenía un carrito guardado antes de cerrar sesión,

**cuando** inicio sesión nuevamente,

**entonces** el carrito debe restaurarse automáticamente con los productos, cantidades y cupones que tenía previamente.

### CA-048.3 — Almacenamiento local para invitados

**Dado que** no estoy autenticado en la plataforma,

**cuando** agrego productos al carrito,

**entonces** el carrito debe almacenarse en el almacenamiento local del navegador para mantenerlo disponible durante la sesión.

### CA-048.4 — Fusión de carritos al autenticarse

**Dado que** tengo productos en el carrito como invitado y poseo un carrito guardado como usuario registrado,

**cuando** inicio sesión,

**entonces** el sistema debe fusionar ambos carritos, sumando las cantidades de productos duplicados y conservando los productos únicos de cada uno.

---
