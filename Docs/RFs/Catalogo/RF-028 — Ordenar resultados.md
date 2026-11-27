# RF-028 — Ordenar resultados

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-028 |
| Nombre | Ordenar resultados |
| Módulo | Catálogo |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir ordenar los productos mostrados según criterios como precio, relevancia, nombre o fecha de creación.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| sort_by | Texto | Sí | price_asc, price_desc, newest, relevance |

---

## Proceso

- Usuario selecciona criterio de ordenamiento.
- Backend ajusta query de resultados.
- Se retornan productos ordenados.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Ordenamiento exitoso | 200 | Lista ordenada |

---

## Reglas de negocio

RN-001: El orden por defecto es relevancia.  
RN-002: Debe ser consistente con filtros aplicados.