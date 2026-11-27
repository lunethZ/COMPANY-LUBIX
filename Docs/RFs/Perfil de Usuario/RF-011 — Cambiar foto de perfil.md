# RF-011 — Cambiar foto de perfil

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-011 |
| Nombre | Cambiar foto de perfil |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario subir o cambiar su imagen de perfil.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| image | Archivo | Sí | JPG, PNG, máximo 5MB |

---

## Proceso

- Usuario selecciona imagen.
- Backend valida formato.
- Se almacena en storage.
- Se actualiza URL en base de datos.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Imagen actualizada | 200 | "Profile image updated" |
| Formato inválido | 400 | Error |

---

## Reglas de negocio

RN-001: Solo imágenes válidas JPG/PNG.  
RN-002: Se reemplaza imagen anterior.