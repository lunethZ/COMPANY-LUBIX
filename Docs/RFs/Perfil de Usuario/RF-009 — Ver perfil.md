# RF-009 — Ver perfil de usuario

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-009 |
| Nombre | Ver perfil de usuario |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario autenticado visualizar su información personal registrada en la plataforma Lubix, incluyendo datos básicos de cuenta y configuración.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| user_id | UUID | Sí | Debe existir en el sistema |

---

## Proceso

- El usuario accede a la sección de perfil.
- El frontend envía solicitud al backend.
- El backend valida el token de autenticación.
- Se consulta la información del usuario en la base de datos.
- Se retornan los datos del perfil.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Perfil obtenido | 200 | Datos del usuario |
| Usuario no encontrado | 404 | "User not found" |
| No autorizado | 401 | "Unauthorized" |

---

## Endpoints asociados

| Método | Ruta | Auth requerida | Descripción |
|--------|------|---------------|-------------|
| GET | /api/v1/users/profile | Sí | Obtiene perfil |

---

## Reglas de negocio

RN-001: Solo el usuario autenticado puede ver su propio perfil.  
RN-002: No se expone información sensible como contraseña.