# RF-061 — Panel de administración

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-061 |
| Nombre | Panel de administración |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al administrador visualizar un panel con métricas globales del sistema, que resuman la actividad de usuarios, empresas y solicitudes en un solo lugar.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| token_administrador | JWT | Sí | Rol administrador |

---

## Proceso

- El administrador accede al panel principal.
- El backend consulta los totales de usuarios, empresas, empresas pendientes y usuarios activos/inactivos.
- Se calculan las métricas agregadas.
- Se muestran los indicadores clave (KPIs) en la interfaz.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Consulta exitosa | 200 | Total de usuarios, empresas, pendientes, activos e inactivos |
| No autorizado | 401 | "Unauthorized" |

---

## Reglas de negocio

RN-001: Solo el rol administrador puede acceder al panel.  
RN-002: Las métricas se calculan sobre datos reales de la base de datos en tiempo real.
