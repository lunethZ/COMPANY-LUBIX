# HU-061 — Panel de administración

## Identificación

| Campo | Valor |
|---------|---------|
| ID | HU-061 |
| Título | Panel de administración |
| Módulo | Administración |
| Prioridad | Alta |
| Estado | Pendiente |
| RF asociados | RF-061 |

---

## Historia

Como administrador de Lubix, quiero ver un panel con métricas globales de usuarios, empresas y solicitudes, para supervisar la actividad de la plataforma en un solo lugar.

---

## Criterios de aceptación

### CA-061.1 — Visualización de métricas

**Dado que** soy administrador y accedo al panel,

**cuando** carga la interfaz,

**entonces** debo ver los totales de usuarios, empresas, empresas pendientes, usuarios activos e inactivos.

---

### CA-061.2 — Información en tiempo real

**Dado que** consulto el panel de administración,

**cuando** se actualizan los datos en la base de datos,

**entonces** las métricas reflejan la información más reciente.

---

### CA-061.3 — Acceso restringido

**Dado que** un usuario sin rol administrador intenta acceder al panel,

**cuando** se procesa la petición,

**entonces** el sistema bloquea el acceso y devuelve un error de autorización.

---

### CA-061.4 — Indicador de carga

**Dado que** estoy cargando el panel,

**cuando** la solicitud está en proceso,

**entonces** se muestra un indicador de carga mientras se obtienen los datos.

---

### CA-061.5 — Navegación a secciones

**Dado que** estoy en el panel de administración,

**cuando** accedo a las tarjetas de métricas o menú lateral,

**entonces** puedo navegar a la gestión de usuarios, empresas y solicitudes.
