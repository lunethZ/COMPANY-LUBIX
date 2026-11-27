# RF-029 — Ver detalle de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-029 |
| Nombre | Ver detalle de producto |
| Módulo | Catálogo |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir visualizar la información completa de un producto específico.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| product_id | UUID | Sí | Debe existir |

---

## Proceso

- Usuario selecciona producto.
- Backend consulta información completa.
- Se incluyen imágenes, precio, stock y atributos.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Producto encontrado | 200 | Detalle completo |
| No existe | 404 | "Product not found" |

---

## Reglas de negocio

RN-001: Solo productos publicados pueden verse.