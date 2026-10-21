# HU-025 — Gestionar inventario

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-025 |
| Título | Gestionar inventario |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-025 |

---

## Historia

Como vendedor de Lubix, quiero gestionar el inventario de mis productos, para controlar las cantidades disponibles.

---

## Criterios de aceptación

### CA-025.1 — Consulta del stock por producto

**Dado que** soy un vendedor autenticado,

**cuando** accedo al detalle de un producto,

**entonces** veo la cantidad actual de unidades disponibles en inventario.

### CA-025.2 — Modificación de cantidades

**Dado que** tengo acceso al inventario de un producto,

**cuando** introduzco una nueva cantidad,

**entonces** el sistema permite actualizar el stock registrado.

### CA-025.3 — Validación de la cantidad ingresada

**Dado que** ingreso una nueva cantidad de stock,

**cuando** el valor no es un número entero válido o es negativo,

**entonces** el sistema lo rechaza y solicita una cantidad válida mayor o igual a cero.

### CA-025.4 — Alerta de stock bajo

**Dado que** la cantidad de un producto está por debajo del umbral mínimo configurado,

**cuando** consulto mi inventario,

**entonces** el sistema lo resalta o muestra una alerta indicando que el stock es bajo.

### CA-025.5 — Configuración del stock mínimo

**Dado que** soy un vendedor,

**cuando** gestiono un producto,

**entonces** puedo configurar un nivel mínimo de stock para recibir alertas al alcanzarlo.

### CA-025-6 — Guardado y confirmación del inventario

**Dado que** actualizo la cantidad de un producto,

**cuando** confirmo el cambio,

**entonces** el sistema guarda la nueva cantidad y me lo confirma.

### CA-025.7 — Actualización en tiempo real

**Dado que** se registra una compra o una modificación de stock,

**cuando** el sistema procesa el evento,

**entonces** el inventario se actualiza automáticamente en la vista del vendedor.

---

