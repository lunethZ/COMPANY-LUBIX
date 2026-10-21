# HU-020 — Descargar datos personales

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-020 |
| Título | Descargar datos personales |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-020 |

---

## Historia

Como usuario de Lubix, quiero descargar mis datos personales, para tener una copia de la información que la plataforma almacena sobre mí.

---

## Criterios de aceptación

### CA-020.1 — Solicitud de descarga de datos

**Dado que** soy un usuario registrado y con sesión iniciada,

**cuando** solicito la descarga de mis datos personales desde mi perfil,

**entonces** el sistema registra la solicitud y confirma que se está generando el archivo.

### CA-020.2 — Contenido completo de los datos

**Dado que** acepté descargar mis datos personales,

**cuando** el sistema genera el archivo,

**entonces** este incluye mi nombre, correo electrónico, direcciones registradas e historial de pedidos.

### CA-020.3 — Formato de exportación

**Dado que** se genera el archivo con mis datos,

**cuando** se completa la exportación,

**entonces** se ofrece el archivo en formato JSON o CSV para facilitar su lectura.

### CA-020.4 — Envío del enlace de descarga

**Dado que** la solicitud de descarga fue procesada,

**cuando** el archivo está listo,

**entonces** el sistema envía un enlace de descarga a mi correo y también lo pone disponible en mi perfil.

### CA-020.5 — Exclusión de datos sensibles no solicitados

**Dado que** se genera el archivo con mis datos,

**cuando** se prepara la exportación,

**entonces** no se incluyen contraseñas ni datos de tarjetas de pago en el archivo.

### CA-020.6 — Caducidad del enlace de descarga

**Dado que** recibí un enlace de descarga de mis datos,

**cuando** intento usar el enlace después de su vigencia,

**entonces** el enlace expira y debo solicitar nuevamente la descarga por seguridad.

---

