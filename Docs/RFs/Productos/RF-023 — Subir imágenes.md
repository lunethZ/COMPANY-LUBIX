# RF-023 — Subir imágenes de producto

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-023 |
| Nombre | Subir imágenes de producto |
| Módulo | Productos |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir subir imágenes asociadas a productos.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| images | Archivo | Sí | JPG/PNG, máx 5MB |

---

## Proceso

- Usuario sube imágenes.
- Backend valida formato.
- Se almacenan en storage.
- Se vinculan al producto.

---

## Reglas de negocio

RN-001: Máximo número de imágenes por producto (ej. 5).