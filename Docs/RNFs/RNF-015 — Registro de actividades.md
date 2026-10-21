# RNF-015 — Registro de actividades

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-015 |
| Nombre | Registro de actividades |
| Categoría | Seguridad |
| Prioridad | Alta |
| Estado | Definido |

---

## Descripción

El sistema debe registrar de forma estructurada todas las peticiones API, eventos de autenticación y operaciones CRUD sobre datos sensibles, utilizando formato JSON con política de retención y rotación de logs.

---

## Especificación

### Meta principal
Toda actividad relevante del sistema debe quedar registrada de forma trazable para auditoría, diagnóstico y cumplimiento de seguridad.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Peticiones API | 100% registradas con timestamp, método, ruta y status |
| Eventos de autenticación | Login, logout, registro, cambio de contraseña registrados |
| Operaciones CRUD sensibles | Crear, actualizar y eliminar de datos sensibles registrados |
| Formato de logs | JSON estructurado con campos estándar |
| Rotación de logs | Rotación diaria o por tamaño (max 50MB) |
| Retención de logs | Mínimo 30 días disponibles |

### Estrategia de validación
Ejecutar peticiones API y verificar aparición en los logs con el formato correcto. Realizar login/logout y confirmar registro de eventos. Inspeccionar rotación de archivos de log. Revisar que los logs contienen los campos necesarios para auditoría.

### Dependencias
- Sistema de logging configurado en FastAPI (structlog o similar)
- Política de almacenamiento de logs definida
- Mecanismo de rotación y limpieza de archivos de log
