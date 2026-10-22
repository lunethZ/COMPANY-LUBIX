# HU-063 — Validar empresas

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-063 |
| Título | Validar empresas |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-063 |

---

## Historia

Como administrador de Lubix, quiero revisar y aprobar las empresas registradas, para asegurar que solo las válidas operen en la plataforma.

---

## Criterios de aceptación

### CA-063.1 — Listado de empresas

**Dado que** soy administrador y accedo a la gestión de empresas,

**cuando** se carga la vista,

**entonces** debo ver las empresas con su NIT, dirección, propietario y estado de verificación.

---

### CA-063.2 — Identificación de empresas pendientes

**Dado que** existe un listado de empresas,

**cuando** reviso los estados,

**entonces** puedo identificar claramente cuáles están pendientes de validación.

---

### CA-063.3 — Validación exitosa

**Dado que** selecciono una empresa pendiente,

**cuando** confirmo la validación,

**entonces** la empresa queda verificada y activa y su estado se actualiza en el listado.

---

### CA-063.4 — Confirmación de la validación

**Dado que** estoy por validar una empresa,

**cuando** pulso el botón de validar,

**entonces** el sistema muestra una confirmación con el nombre de la empresa.

---

### CA-063.5 — Empresa no encontrada

**Dado que** intento validar una empresa inexistente,

**cuando** se procesa la solicitud,

**entonces** el sistema muestra un mensaje de "empresa no encontrada".

---

### CA-063.6 — Empresa validada publica productos

**Dado que** una empresa fue validada correctamente,

**cuando** el propietario inicia sesión,

**entonces** la empresa puede publicar y gestionar productos en la plataforma.
