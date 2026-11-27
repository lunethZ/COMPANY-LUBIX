# RF-026 — Buscar productos

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-026 |
| Nombre | Buscar productos |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir a los usuarios buscar productos dentro del catálogo mediante palabras clave como nombre, SKU o atributos del producto.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| query | Texto | Sí | 1–255 caracteres |

---

## Proceso

- El usuario ingresa una palabra en el buscador.
- El frontend envía la consulta al backend.
- El sistema realiza búsqueda en productos por nombre, descripción y SKU.
- Se aplican algoritmos de relevancia.
- Se retornan resultados ordenados.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Búsqueda exitosa | 200 | Lista de productos |
| Sin resultados | 200 | Lista vacía |
| Error sistema | 500 | Error interno |

---

## Endpoints asociados

| Método | Ruta | Auth requerida | Descripción |
|--------|------|---------------|-------------|
| GET | /api/v1/products/search | No | Búsqueda de productos |

---

## Reglas de negocio

RN-001: La búsqueda debe ser tolerante a errores de escritura (fuzzy search).  
RN-002: Debe priorizar coincidencias en nombre sobre descripción.