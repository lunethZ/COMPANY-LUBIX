# RF-044 — Ver historial de pedidos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-044 |
| Nombre | Historial de pedidos |
| Módulo | Pedidos |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario visualizar todos los pedidos realizados con su estado actual.

---

## Proceso

- Usuario accede a sección de pedidos.
- Backend consulta pedidos asociados al usuario.
- Se retorna lista ordenada por fecha.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Lista obtenida | 200 | Lista de pedidos |

---

## Reglas de negocio

RN-001: Solo el usuario dueño puede ver sus pedidos.