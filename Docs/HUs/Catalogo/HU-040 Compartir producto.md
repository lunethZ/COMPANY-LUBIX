# HU-040 — Compartir producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-040 |
| Título | Compartir producto |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-040 |

---

## Historia

Como comprador de Lubix, quiero compartir un producto con otros usuarios, para recomendarlo o consultarlo con familiares y amigos antes de comprar.

---

## Criterios de aceptación

### CA-040.1 — Botón de compartir

**Dado que** estoy en la página de detalle de un producto,

**cuando** reviso las acciones disponibles del producto,

**entonces** debe mostrarse un botón o ícono identificado como "Compartir" accesible para el usuario.

### CA-040.2 — Copiar enlace al portapapeles

**Dado que** hago clic en el botón de compartir,

**cuando** selecciono la opción "Copiar enlace",

**entonces** la URL del producto debe copiarse al portapapeles y debe mostrarse una notificación indicando que el enlace fue copiado exitosamente.

### CA-040.3 — Compartir vía aplicaciones del sistema

**Dado que** estoy en un dispositivo móvil y hago clic en el botón de compartir,

**cuando** selecciono la opción de compartir,

**entonces** debe abrirse el menú de compartir nativo del sistema operativo permitiendo enviar el enlace por mensajes, correo u otras aplicaciones instaladas.

### CA-040.4 — Compartir con imagen del producto

**Dado que** comparto un producto desde la aplicación móvil,

**cuando** se envía la solicitud de compartir,

**entonces** el enlace compartido debe incluir como vista previa la imagen principal del producto, el nombre y el precio.

---