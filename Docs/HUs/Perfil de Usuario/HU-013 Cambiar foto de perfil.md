# HU-013 — Cambiar foto de perfil

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-013 |
| Título | Cambiar foto de perfil |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Pendiente |
| RF asociados | RF-013 |

---

## Historia

Como usuario de Lubix, quiero cambiar mi foto de perfil, para mantener mi imagen actualizada en la plataforma.

---

## Criterios de aceptación

### CA-013.1 — Botón de subir foto

**Dado que** el usuario está en su perfil,

**cuando** quiera cambiar la foto,

**entonces** el sistema muestra una opción visible para subir o seleccionar una nueva imagen desde el dispositivo.

### CA-013.2 — Vista previa de la imagen

**Dado que** el usuario selecciona una imagen,

**cuando** se cargue el archivo,

**entonces** el sistema muestra una vista previa de la foto antes de confirmar el cambio.

### CA-013.3 — Recorte y redimensionamiento

**Dado que** el usuario ha cargado la imagen,

**cuando** la imagen supere las proporciones admitidas,

**entonces** el sistema ofrece herramientas de recorte o redimensionamiento para ajustarla al formato cuadrado del perfil.

### CA-013.4 — Validación de formato y tamaño

**Dado que** el usuario intenta subir un archivo no admitido,

**cuando** el archivo tenga un formato distinto al permitido o exceda el tamaño máximo,

**entonces** el sistema rechaza la carga y muestra un mensaje indicando los formatos y tamaños aceptados.

### CA-013.5 — Confirmación del cambio

**Dado que** el usuario confirma la nueva foto,

**cuando** se guarde el perfil,

**entonces** el sistema actualiza la foto de perfil en todos los lugares donde se muestra el avatar.

---
