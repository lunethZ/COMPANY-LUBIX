# RF-030 — Ver productos relacionados

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-030 |
| Nombre | Ver productos relacionados |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe mostrar productos relacionados o similares basados en categoría, atributos o historial de navegación.

---

## Proceso

- Se identifica producto actual.
- Se buscan productos similares.
- Se excluye el producto actual.
- Se retornan recomendaciones.

---

## Reglas de negocio

RN-001: Deben pertenecer a la misma categoría o similar.