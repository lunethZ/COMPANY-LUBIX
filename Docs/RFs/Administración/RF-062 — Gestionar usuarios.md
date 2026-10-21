# RF-062 — Gestionar usuarios

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-062 |
| Nombre | Gestionar usuarios |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al administrador consultar el listado completo de usuarios del sistema y eliminar usuarios cuando sea necesario.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| token_administrador | JWT | Sí | Rol administrador |
| user_id | UUID | Sí (para eliminar) | Debe existir |

---

## Proceso

- El administrador accede a la sección de usuarios.
- El backend devuelve el listado ordenado por fecha de creación.
- El administrador revisa el detalle de cada usuario.
- Al eliminar, se verifica que no sea un administrador.
- Se elimina la empresa asociada (si existe) y el usuario.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Listado de usuarios | 200 | Usuarios con rol, verificación y estado |
| Usuario eliminado | 200 | "Usuario eliminado correctamente" |
| Usuario no encontrado | 404 | "Usuario no encontrado" |
| No se puede eliminar admin | 400 | "No se puede eliminar un administrador" |

---

## Reglas de negocio

RN-001: Solo el administrador puede eliminar usuarios.  
RN-002: No se puede eliminar la cuenta de otro administrador.  
RN-003: Al eliminar una empresa se eliminan también sus datos asociados.
