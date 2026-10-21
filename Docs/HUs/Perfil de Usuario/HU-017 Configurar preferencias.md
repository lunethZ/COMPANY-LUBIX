# HU-017 — Configurar preferencias

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-017 |
| Título | Configurar preferencias |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-017 |

---

## Historia

Como usuario de Lubix, quiero configurar mis preferencias, para personalizar notificaciones, tema, idioma y otros ajustes de la aplicación.

---

## Criterios de aceptación

### CA-017.1 — Configuración de notificaciones

**Dado que** el usuario accede a sus preferencias,

**cuando** configure las notificaciones,

**entonces** el sistema le permite activar o desactivar tipos de notificaciones, como ofertas, estados de pedido o novedades.

### CA-017.2 — Preferencia de tema

**Dado que** el usuario quiere personalizar la aplicación,

**cuando** seleccione una opción de tema,

**entonces** el sistema aplica el tema elegido (claro u oscuro) en la interfaz de forma inmediata.

### CA-017.3 — Selección de idioma

**Dado que** el usuario quiere usar la aplicación en otro idioma,

**cuando** seleccione un idioma disponible,

**entonces** el sistema muestra la interfaz en el idioma elegido.

### CA-017.4 — Preferencia de moneda

**Dado que** el usuario quiere ver los precios en otra moneda,

**cuando** seleccione una moneda,

**entonces** el sistema muestra los precios de productos y pedidos en la moneda elegida.

### CA-017.5 — Persistencia de las preferencias

**Dado que** el usuario ha guardado sus preferencias,

**cuando** inicie sesión en un nuevo dispositivo posteriormente,

**entonces** el sistema conserva y aplica las preferencias configuradas previamente.

---
