# Plan de Actualizaciones, Soporte, Monitoreo y Capacitación — LUBIX

> Documento operativo que consolida cómo se actualiza, soporta, monitorea y capacita a los usuarios de LUBIX.
> Documentos relacionados: [`BC-Implantacion.md`](./BC-Implantacion.md) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`monitoreo.md`](./monitoreo.md) · [`Plan_Capacitacion.md`](./Plan_Capacitacion.md) · [`Sesion_Simulada_Capacitacion.md`](./Sesion_Simulada_Capacitacion.md) · [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) · [`Manual Tecnico De Usuario/`](./Manual%20Tecnico%20De%20Usuario/)

## Metadatos del documento

| Campo | Valor |
|-------|-------|
| Nombre del sistema | LUBIX — Plataforma de Gestión Empresarial |
| Repositorio | `lunethZ/COMPANY-LUBIX` |
| Versión del sistema | 1.0.0 |
| Versión del documento | 1.0.0 |
| Estado | Vigente |
| Fecha de elaboración | 2026-11-26 |
| Autor(es) | Equipo LUBIX |
| Clasificación de la información | Interno |
| Idioma | Español |

---

## 1. Objetivo y alcance

Definir las secciones operativas que garantizan la continuidad de LUBIX después de la entrega:

1. **Actualizaciones:** cómo se versiona, despliega y comunica cada cambio.
2. **Soporte:** canales, niveles, tiempos de respuesta y escalamiento.
3. **Monitoreo:** señales, herramientas, umbrales y respuesta ante incidentes.
4. **Guía de capacitación para usuarios:** perfiles, materiales, sesiones, evaluación y evidencias.

Aplica a los entornos de desarrollo, staging (CI) y producción descritos en [`BC-Implantacion.md`](./BC-Implantacion.md) §1.3. El detalle técnico de cada tema se mantiene en los documentos especializados enlazados; este plan es el punto de entrada y el acuerdo de operación del equipo.

---

## 2. Actualizaciones

### 2.1 Versionado

LUBIX usa **Versionado Semántico (SemVer)** `MAYOR.MENOR.PARCHE`:

| Componente | Versión actual | Archivo de referencia |
|---|---|---|
| Sistema | 1.0.0 | `README.md` |
| Backend / API | 1.1.1b | `backend/pyproject.toml` · `backend/CHANGELOG.md` |
| Frontend web | 0.1.0 | `frontend/package.json` |
| App móvil | Pendiente (APK en otro carril) | `mobile/` |

Reglas:

- **MAYOR:** cambios incompatibles en API o datos.
- **MENOR:** funcionalidades nuevas compatibles.
- **PARCHE:** correcciones y ajustes sin cambio de contrato.
- Todo cambio funcional se registra en `backend/CHANGELOG.md` y en la descripción del Pull Request.

### 2.2 Ciclo de actualización

```text
Rama feat/* o fix/*  →  Pull Request a Develop  →  CI (lint + pruebas + cobertura ≥ 80 %)
        →  Quality Gate SonarCloud  →  Revisión de código  →  Merge a Develop
        →  PR Develop → main  →  Deploy automático en Render  →  Smoke test (/health + login)
        →  Registro en CHANGELOG y notas de versión
```

El pipeline vive en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) y [`sonarcloud.yml`](../.github/workflows/sonarcloud.yml). El despliegue está declarado en [`render.yaml`](../render.yaml).

### 2.3 Tipos de actualización

| Tipo | Qué incluye | Frecuencia | Evidencia |
|---|---|---|---|
| Correctiva | Corrección de defectos reportados vía Issues/PQRS | Según incidencia | PR + test de regresión |
| Preventiva | Actualización de dependencias, revisión de logs, respaldos, rotación de credenciales | Continua / por iteración | Reporte de CI, `pg_backup.py`, auditoría |
| Evolutiva | Nuevas historias de usuario por sprint | Por sprint | PR, pruebas E2E y acta de sprint |
| Seguridad | Parches de vulnerabilidades, revisión de CORS y secretos, auditoría de dependencias | Por release y ante incidente | `pip-audit`, SonarCloud, issue cerrado |

### 2.4 Procedimiento de despliegue

1. Confirmar CI en verde y Quality Gate aprobado.
2. Fusionar el PR a `main`; Render ejecuta el deploy automático.
3. Verificar `GET /health`, `GET /health/database` y un inicio de sesión de prueba.
4. Revisar logs y métricas durante los primeros 15 minutos.
5. Registrar la versión y el resumen del cambio en el CHANGELOG y en las notas de versión.
6. Si falla un criterio, aplicar **rollback**: Render → *Deploys* → *Redeploy* del despliegue anterior y restaurar variables de entorno si cambiaron (ver [`DEPLOYMENT.md`](./DEPLOYMENT.md) §9).

### 2.5 Comunicación de cambios

| Audiencia | Medio | Momento |
|---|---|---|
| Equipo técnico | PR, CHANGELOG, GitHub Releases | En cada merge |
| Usuarios finales | Aviso en la plataforma y FAQ actualizada | Antes o durante el despliegue |
| Empresas | Correo o aviso en panel + soporte | Para cambios que afecten su operación |
| Cliente / acta | Notas de versión y acta de implantación | Al cierre de cada release |

Las actualizaciones que impliquen mantenimiento programado se anuncian con al menos **48 horas** de anticipación y se ejecutan en ventana de baja actividad (ver §3.6).

---

## 3. Soporte

### 3.1 Canales de atención

| Canal | Uso | Registro |
|---|---|---|
| PQRS en la plataforma | Solicitudes, quejas, reclamos y sugerencias de usuarios y empresas | Módulo PQRS (panel admin) |
| GitHub Issues | Defectos técnicos y solicitudes de cambio del equipo | Repositorio `COMPANY-LUBIX` |
| Mesa de ayuda | Atención guiada de primer nivel | Manual 1.1.8 (GLPI y tiempos) |
| Correo institucional | Comunicaciones formales y escalamiento | Bandeja de soporte |

### 3.2 Niveles y tiempos de respuesta (SLA)

| Severidad | Descripción | Primera respuesta | Resolución objetivo | Escala a |
|---|---|---|---|---|
| P1 — Crítica | Plataforma caída, login o pagos inoperantes, pérdida de datos | 30 min | 4 h | Backend + implantación |
| P2 — Alta | Función principal degradada (catálogo, carrito, panel) sin workaround | 2 h | 24 h | Responsable del módulo |
| P3 — Media | Error con workaround disponible | 8 h (día hábil) | 3 días hábiles | Soporte N2 |
| P4 — Baja | Mejora, duda o solicitud cosmética | 1 día hábil | Próximo release | Backlog |

Los tiempos son objetivos de servicio; el plan gratuito de Render puede añadir latencia por *cold start* (~39 s), lo que se informa al usuario al abrir el ticket.

### 3.3 Roles y escalamiento

| Rol | Responsable | Alcance |
|---|---|---|
| Soporte N1 / mesa de ayuda | Personal de soporte | Recepción, clasificación, respuestas de la FAQ y uso del manual |
| Soporte N2 / aplicación | @lunethZ | API, base de datos, migraciones, respaldos |
| Soporte N2 / frontend | @WinStormX | UI web, pruebas E2E, verificación funcional |
| Implantación e infraestructura | @nacoooobit | Render, variables, monitoreo y acta |
| Revisión y aprobación | @lunethZ · @juanpineda | Code review, Quality Gate y cierre |

**Escalamiento:** incidencia → responsable del componente → revisión conjunta → decisión de mitigación o rollback, registrada en GitHub Issues. Toda incidencia P1 se documenta con línea de tiempo y causa raíz.

### 3.4 Flujo de una solicitud

1. **Recepción:** entra por PQRS, Issue o mesa de ayuda.
2. **Clasificación:** se asigna severidad (P1–P4) y componente.
3. **Diagnóstico:** se reproduce, se revisan logs y `/health`.
4. **Solución:** se aplica workaround o se corrige en rama y se despliega según §2.4.
5. **Cierre:** se confirma con el usuario y se actualiza el estado.
6. **Mejora:** se registra la lección aprendida; si aplica, se crea una acción preventiva.

### 3.5 PQRS vs. ticket técnico

- Una **PQRS** es una solicitud del usuario sobre el servicio (queja, reclamo, sugerencia o consulta) y se gestiona en el módulo PQRS.
- Un **ticket técnico** es un defecto o tarea de ingeniería que se registra en GitHub Issues.
- Si una PQRS revela un defecto, se crea un Issue enlazado y se informa al usuario del seguimiento.

### 3.6 Horario y ventanas de mantenimiento

- **Soporte:** lunes a viernes, 08:00–18:00 (hora de Colombia); P1 fuera de horario se atiende por guardia.
- **Mantenimiento programado:** ventana preferida domingos 22:00–00:00, con aviso previo de 48 h.
- **Respaldos:** automáticos cada 6 h según [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md).

---

## 4. Monitoreo

### 4.1 Objetivos

- Detectar caídas o degradaciones antes que el usuario.
- Confirmar disponibilidad de API y base de datos.
- Vigilar la latencia frente a los RNF (especialmente RNF-001, p95 < 200 ms).
- Conservar evidencia para auditoría y mejora continua.

### 4.2 Señales y fuentes

| Señal | Fuente | Valor esperado |
|---|---|---|
| Disponibilidad de API | `GET https://lubix-api.onrender.com/health` | `200` con `status: ok` |
| Estado de base de datos | `GET /health/database` | `200` con `database: ok` |
| Conectividad externa | `GET /health/internet` | `200` |
| Logs y métricas de ejecución | Panel de Render | Sin errores 5xx sostenidos |
| Conexiones y salud de PostgreSQL | Consola de Neon | Dentro del pool configurado |
| Calidad y cobertura | GitHub Actions + SonarCloud | Cobertura ≥ 80 %, Quality Gate OK |
| Disponibilidad externa | Uptime Kuma o Healthchecks.io | Monitor en *Up* |

### 4.3 Herramientas

- **Uptime Kuma** (recomendado): sondeo HTTP directo cada 300 s, timeout 60 s y 2 reintentos. Configuración detallada en [`monitoreo.md`](./monitoreo.md).
- **Healthchecks.io**: alternativa por *push* con verificación previa de `/health`.
- **Render**: logs, métricas, historial de despliegues y *cold start*.
- **Neon**: estado del clúster, conexiones y almacenamiento.
- **GitHub Actions / SonarCloud**: salud del pipeline y de la calidad.

### 4.4 Alertas y umbrales

| Condición | Umbral | Acción |
|---|---|---|
| `/health` no responde | 3 intentos fallidos | Alerta a guardia; revisar Render |
| `/health` responde `503` | 1 vez | Revisar Neon y conexiones; considerar rollback |
| Errores 5xx | > 5 % en 5 min | Revisar logs y desplegar corrección |
| Latencia p95 | > 200 ms (RNF-001) | Analizar consultas y plan de Render |
| Cobertura | < 80 % | Bloquear merge hasta corregir |
| Respaldo fallido | 1 ejecución | Repetir y validar con `pg_backup.py verify` |

### 4.5 Rutina de monitoreo

| Frecuencia | Actividad | Responsable |
|---|---|---|
| Diaria | Revisar estado del monitor y errores en logs | Soporte N1 |
| Semanal | Revisar métricas de latencia, conexiones y respaldos | Implantación |
| Mensual | Revisar tendencias, capacidad y actualizaciones pendientes | Backend + implantación |
| Por release | Smoke test, healthchecks y Quality Gate | QA + revisión |

### 4.6 Respuesta ante incidentes

1. **Detectar:** alerta del monitor, reporte de usuario o revisión de logs.
2. **Clasificar:** aplicar severidad P1–P4 (§3.2).
3. **Mitigar:** reiniciar servicio, aplicar rollback o restaurar respaldo según [`BC-Implantacion.md`](./BC-Implantacion.md) §5.
4. **Comunicar:** informar estado y ETA a los usuarios afectados.
5. **Cerrar:** confirmar recuperación con `/health`, `/health/database` y login.
6. **Aprender:** registrar causa raíz y acción preventiva en GitHub Issues.

---

## 5. Guía de capacitación para usuarios

### 5.1 Perfiles y objetivos de aprendizaje

| Perfil | Quién asiste | Objetivos |
|---|---|---|
| Usuario final | Clientes y personal de apoyo | Registrarse, iniciar sesión, comprar, consultar pedidos y radicar PQRS |
| Empresa | Dueño o administrador de tienda | Publicar productos, gestionar pedidos y consultar estadísticas |
| Administrador | Personal de LUBIX | Validar empresas, gestionar usuarios y resolver PQRS |
| Mesa de ayuda | Personal de soporte | Interpretar PQRS, mensajes de error y tiempos de atención |

El detalle de objetivos, metodología y evaluación está en [`Plan_Capacitacion.md`](./Plan_Capacitacion.md).

### 5.2 Materiales de apoyo

| Contenido | Material |
|---|---|
| Ingreso, perfiles, verificación y recuperación | Manual 1.1.5 |
| Funciones de Usuario, Empresa y Administrador | Manual 1.1.7 |
| Canal de soporte, tiempos y escalamiento | Manual 1.1.8 |
| Mensajes de error y qué hacer ante cada uno | Manual 1.1.9 |
| Preguntas frecuentes | Manual 1.1.10 (FAQ) |
| Guion de la sesión | [`Sesion_Simulada_Capacitacion.md`](./Sesion_Simulada_Capacitacion.md) |
| Casos de aceptación | [`Pruebas_Aceptacion_Cliente_Simulado.md`](./Pruebas_Aceptacion_Cliente_Simulado.md) |

Materiales operativos: enlace del frontend desplegado, cuentas de demostración (Usuario, Empresa, Administrador), un producto con stock, una empresa y una PQRS en estado **Pendiente**, formato de asistencia y formulario de evaluación.

### 5.3 Estructura de las sesiones

| Sesión | Duración | Contenido |
|---|---|---|
| Sesión 1 | 90 min | Ingreso, verificación, recuperación, compra completa y PQRS del usuario final |
| Sesión 2 | 90 min | Panel de Empresa, panel de Administración y mesa de ayuda |

**Metodología:** demostración guiada → práctica del participante sin ayuda → resolución de dudas → evaluación.

### 5.4 Guía rápida por rol

**Usuario final**

1. Ingresar por la pestaña **Usuario**.
2. Buscar un producto y agregarlo al carrito.
3. Completar el checkout y confirmar el pedido.
4. Consultar el estado en **Mis pedidos**.
5. Radicar una PQRS y consultarla en **Mis solicitudes**.

**Empresa**

1. Ingresar por la pestaña **Empresa**.
2. Publicar un producto con los campos obligatorios.
3. Consultar y actualizar el estado de un pedido recibido.
4. Revisar estadísticas y el perfil de la tienda.

**Administrador**

1. Ingresar por la pestaña **Usuario** con credenciales administrativas.
2. Validar una empresa pendiente y habilitar o inhabilitar cuentas.
3. Resolver una PQRS pendiente.

### 5.5 Evaluación y criterios de aprobación

- **Cuestionario de 5 preguntas** definido en [`Plan_Capacitacion.md`](./Plan_Capacitacion.md) §8.
- **Aprobación:** al menos 4 de 5 respuestas correctas y práctica del rol sin asistencia.
- **Lista de verificación práctica:** casos PA-01 a PA-06 de [`Pruebas_Aceptacion_Cliente_Simulado.md`](./Pruebas_Aceptacion_Cliente_Simulado.md).

### 5.6 Evidencias y autoformación

La capacitación se considera cumplida cuando existan:

1. Plan de capacitación aprobado.
2. Registro de asistencia de las dos sesiones.
3. Evidencia de la sesión (capturas, presentación o grabación).
4. Resultados del cuestionario y de la práctica por rol.
5. Casos de aceptación ejecutados y firmados.
6. Informe final de verificación de calidad.

Para autoformación se publican el manual de usuario, la FAQ y los mensajes de error; el usuario puede consultarlos sin acompañamiento del equipo.

---

## 6. Matriz de responsabilidades (RACI)

| Actividad | Implantación | Backend | Frontend/QA | Soporte |
|---|---|---|---|---|
| Ejecutar actualizaciones | R | C | C | I |
| Aprobar release | A | R | R | I |
| Atender soporte N1 | I | I | I | R/A |
| Atender soporte N2 | C | R | R | I |
| Configurar y revisar monitoreo | R/A | C | I | I |
| Ejecutar capacitación | C | I | I | R/A |

`R` = responsable · `A` = aprueba · `C` = consultado · `I` = informado.

---

## 7. Criterios de aceptación — «Hecho cuando»

Este plan se considera completo cuando las cuatro secciones están incluidas y enlazadas:

- [x] **Actualizaciones** documentadas (§2): versionado, ciclo, tipos, despliegue, rollback y comunicación.
- [x] **Soporte** documentado (§3): canales, SLA, roles, escalamiento, flujo y ventanas.
- [x] **Monitoreo** documentado (§4): señales, herramientas, umbrales, rutina e incidentes.
- [x] **Guía de capacitación para usuarios** incluida (§5): perfiles, materiales, sesiones, práctica, evaluación y evidencias.
- [x] Documento enlazado desde el README y el documento de implantación.

---

## 8. Referencias

- [`BC-Implantacion.md`](./BC-Implantacion.md) — implantación, contingencia, rollback y acta.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — despliegue en Render y solución de problemas.
- [`monitoreo.md`](./monitoreo.md) — configuración de healthchecks y alertas.
- [`Respaldo_v1_Operativo.md`](./Respaldo_v1_Operativo.md) — respaldo y restauración.
- [`Plan_Capacitacion.md`](./Plan_Capacitacion.md) — plan detallado de capacitación.
- [`Sesion_Simulada_Capacitacion.md`](./Sesion_Simulada_Capacitacion.md) — guion de la sesión.
- [`Pruebas_Aceptacion_Cliente_Simulado.md`](./Pruebas_Aceptacion_Cliente_Simulado.md) — casos de aceptación.
- [`Manual Tecnico De Usuario/`](./Manual%20Tecnico%20De%20Usuario/) — manuales 1.1.1 a 1.1.10.

---

## 9. Control de cambios

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0.0 | 2026-11-26 | Creación del plan con las secciones de actualizaciones, soporte, monitoreo y capacitación | Equipo LUBIX |
