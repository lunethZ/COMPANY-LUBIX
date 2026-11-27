# RF-010 — Editar perfil de usuario

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-010 |
| Nombre | Editar perfil de usuario |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario actualizar su información personal como nombre, teléfono e información básica del perfil.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| full_name | Texto | Sí | 2–255 caracteres |
| phone | Texto | No | Formato válido |
| image | Archivo | No | JPG/PNG máximo 5MB |

---

## Proceso

- Usuario envía datos actualizados.
- Backend valida autenticación.
- Se validan campos.
- Se actualiza la tabla users.
- Se registra cambio en logs.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Actualización exitosa | 200 | "Profile updated" |
| Error validación | 422 | Detalles |
| No autorizado | 401 | Error |

---

## Reglas de negocio

RN-001: El email no puede ser modificado sin verificación.  
RN-002: Los cambios deben registrarse en auditoría.