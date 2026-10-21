# RF-063 — Validar empresas

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-063 |
| Nombre | Validar empresas |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al administrador consultar las empresas registradas y aprobar o validar aquellas cuyo estado esté pendiente de verificación.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| token_administrador | JWT | Sí | Rol administrador |
| company_id | UUID | Sí | Debe existir |

---

## Proceso

- El administrador accede a la sección de empresas.
- El backend devuelve el listado de empresas con su estado de verificación.
- El administrador selecciona una empresa pendiente.
- Al validar, la empresa cambia a `verified = true` y `isActive = true`.
- Se confirma la activación en la interfaz.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Listado de empresas | 200 | Empresas con NIT, estado y propietario |
| Empresa validada | 200 | "Empresa validada correctamente" |
| Empresa no encontrada | 404 | "Empresa no encontrada" |

---

## Reglas de negocio

RN-001: Solo el administrador puede validar empresas.  
RN-002: Una empresa validada queda activa y puede publicar productos.
