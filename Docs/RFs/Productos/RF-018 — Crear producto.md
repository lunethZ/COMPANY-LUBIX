# RF-018 — Crear producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-018 |
| Nombre | Crear producto |
| Módulo | Productos |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir que un vendedor cree nuevos productos en el catálogo, incluyendo información básica, precio, stock e imágenes.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| name | Texto | Sí | 2–255 caracteres |
| description | Texto | Sí | Máx 2000 caracteres |
| price | Decimal | Sí | > 0 |
| stock | Entero | Sí | ≥ 0 |
| category_id | UUID | Sí | Debe existir |
| images | Archivo | No | JPG/PNG, máx 5MB |

---

## Proceso

- El vendedor envía los datos del producto.
- El backend valida autenticación y rol vendedor.
- Se validan campos obligatorios.
- Se crea el producto en la base de datos.
- Se almacenan imágenes en storage.
- Se registra el producto en catálogo.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Creación exitosa | 201 | Producto creado |
| Error validación | 422 | Detalle de errores |
| No autorizado | 401 | "Unauthorized" |

---

## Reglas de negocio

RN-001: Solo vendedores o administradores pueden crear productos.  
RN-002: Todo producto debe pertenecer a una categoría válida.  
RN-003: El precio debe ser mayor a 0.