# HU-038 — Agregar a favoritos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-038 |
| Título | Agregar a favoritos |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-038 |

---

## Historia

Como comprador de Lubix, quiero agregar productos a mi lista de favoritos, para guardarlos y poder encontrarlos fácilmente más adelante.

---

## Criterios de aceptación

### CA-038.1 — Botón de favorito visible

**Dado que** estoy en la página de detalle de un producto o visualizando una tarjeta de producto en el catálogo,

**cuando** reviso la interfaz del producto,

**entonces** debe mostrarse un ícono de corazón que permita agregar el producto a favoritos.

### CA-038.2 — Activar y desactivar favorito

**Dado que** un producto no está en mi lista de favoritos,

**cuando** hago clic en el ícono de corazón,

**entonces** el ícono debe cambiar a estado activo (relleno) y el producto debe agregarse a mi lista de favoritos.

### CA-038.3 — Requiere autenticación

**Dado que** no estoy autenticado en la plataforma,

**cuando** hago clic en el ícono de favorito de un producto,

**entonces** el sistema debe redirigirme a la página de inicio de sesión antes de permitir agregar el producto a favoritos.

### CA-038.4 — Notificación de agregado

**Dado que** hice clic en el ícono de favorito estando autenticado,

**cuando** el sistema procesa la acción,

**entonces** debe mostrarse un mensaje de notificación indicando que el producto fue agregado a favoritos exitosamente.

### CA-038.5 — Contador de favoritos

**Dado que** agregué un producto a mi lista de favoritos,

**cuando** se actualiza la interfaz,

**entonces** el contador de favoritos visible en mi perfil o barra de navegación debe incrementarse en una unidad.

---
