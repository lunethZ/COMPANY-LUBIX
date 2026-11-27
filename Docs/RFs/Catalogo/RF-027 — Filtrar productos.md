# RF-027 — Filtrar productos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-027 |
| Nombre | Filtrar productos |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir filtrar productos según atributos como categoría, precio, disponibilidad, marca u otros parámetros.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| category_id | UUID | No | Debe existir |
| min_price | Decimal | No | ≥ 0 |
| max_price | Decimal | No | ≥ min_price |
| in_stock | Boolean | No | true/false |

---

## Proceso

- El usuario selecciona filtros en la interfaz.
- El backend construye consulta dinámica.
- Se aplican filtros a la base de datos.
- Se retornan productos filtrados.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Filtrado exitoso | 200 | Lista filtrada |
| Sin resultados | 200 | Lista vacía |

---

## Reglas de negocio

RN-001: Los filtros deben poder combinarse.  
RN-002: Solo se muestran productos publicados.