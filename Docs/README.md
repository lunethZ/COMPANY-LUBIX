# Documentación de LUBIX

Índice de la documentación oficial del proyecto. Todo el contenido está en español y se versiona junto al código.

> El banner del README vive en `docs/assets/lubix-banner.png` (ruta en minúsculas tal como está versionada en Git). En Windows esa carpeta y `Docs/` se ven como una sola.

## Despliegue y operación

| Documento | Contenido |
|---|---|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Publicación en Render con PostgreSQL en Neon/Supabase y almacenamiento S3 compatible (Cloudflare R2 y Backblaze B2) |
| [Estrategia_Hosting_y_Dominio.md](Estrategia_Hosting_y_Dominio.md) | Opciones de hosting, dominio y costos |
| [Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md](Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) | Plan operativo consolidado: versionado, soporte, monitoreo y capacitación |
| [monitoreo.md](monitoreo.md) | Monitoreo de disponibilidad y salud del servicio |
| [Respaldo_v1_Operativo.md](Respaldo_v1_Operativo.md) | Respaldo cifrado y restauración con `scripts/pg_backup.py` |
| [Respaldo_v0.md](Respaldo_v0.md) | Versión inicial del plan de respaldos |
| [Seguridad_Servidor.md](Seguridad_Servidor.md) | Endurecimiento del servidor y roles de PostgreSQL con mínimo privilegio |
| [Instalacion_v1.md](Instalacion_v1.md) | Instalación y puesta en marcha (versión vigente) |
| [Instalacion_v0.md](Instalacion_v0.md) | Versión inicial de la guía de instalación |

## Requisitos y planeación

| Documento | Contenido |
|---|---|
| [Backlog_Final.md](Backlog_Final.md) | Backlog consolidado del proyecto |
| [BC-Implantacion.md](BC-Implantacion.md) | Plan de continuidad e implantación |
| [Plan_Migracion_v0.md](Plan_Migracion_v0.md) | Migración de datos y puesta en producción |
| [Matriz_Usuarios_Roles.md](Matriz_Usuarios_Roles.md) | Permisos por rol (usuario, empresa, administrador, soporte) |
| [HUs/](HUs/) | Historias de usuario por módulo |
| [RFs/](RFs/) | Requisitos funcionales detallados por módulo |
| [RNFs/](RNFs/) | Requisitos no funcionales (rendimiento, seguridad, escalabilidad) |
| `planeacion_tecnica_proyecto_completado.xlsx` | Planeación técnica del proyecto (entregable) |
| `requisitos funcionales .xlsx` | Matriz de requisitos funcionales (entregable; el nombre conserva el espacio original) |

## Calidad y pruebas

| Documento | Contenido |
|---|---|
| [Informe_Final_Calidad.md](Informe_Final_Calidad.md) | Informe final de calidad del producto |
| [Plan_QA_ISO25010.md](Plan_QA_ISO25010.md) | Plan de aseguramiento de calidad basado en ISO/IEC 25010 |
| [Plantilla_ISO_IEC_25010.md](Plantilla_ISO_IEC_25010.md) | Plantilla de evaluación de calidad |
| [Tabla_Calidad_Producto_Software_ISO25010.md](Tabla_Calidad_Producto_Software_ISO25010.md) | Criterios y resultados por característica |
| [estrategia-pruebas.md](estrategia-pruebas.md) | Estrategia y niveles de prueba |
| [Pruebas_Aceptacion_Cliente_Simulado.md](Pruebas_Aceptacion_Cliente_Simulado.md) | Guion y resultados de aceptación con cliente simulado |
| `Pruebas_Unitarias.xlsx` | Registro de pruebas unitarias (entregable) |
| `Pruebas_Integracion.txt` | Registro de pruebas de integración |
| `Pruebas_No_Funcionales.txt` | Registro de pruebas no funcionales |
| [Evidencias/](Evidencias/) | Capturas y evidencias de ejecución por semana y simulacro |
| [Diagramas/](Diagramas/) | Diagramas de arquitectura, clases y flujos |

## Usuarios y capacitación

| Documento | Contenido |
|---|---|
| [Guia_Rapida_Usuario.md](Guia_Rapida_Usuario.md) | Pasos esenciales por rol |
| [FAQ_Usuarios.md](FAQ_Usuarios.md) | Preguntas frecuentes consolidadas |
| [Manual Tecnico De Usuario/](Manual%20Tecnico%20De%20Usuario/) | Manual técnico por capítulos |
| [Plan_Capacitacion.md](Plan_Capacitacion.md) | Plan de capacitación por roles |
| [Sesion_Simulada_Capacitacion.md](Sesion_Simulada_Capacitacion.md) | Guion de la sesión de capacitación |
| [Entrega_Final_Capacitacion.md](Entrega_Final_Capacitacion.md) | Entregable final: plan, guía, FAQ y evidencias |
| [Ficha_Tecnica.md](Ficha_Tecnica.md) | Ficha técnica resumida del sistema |

## Herramientas

[`herramientas/`](herramientas/) contiene scripts de apoyo a la documentación:

- `actualizar_estados.py` — actualiza estados en los documentos de requisitos e historias.
- `generar_backlog.py` — regenera el backlog a partir de los RFs/HUs.
- `medir_rnf001.py` — mide el RNF-001 (tiempo de respuesta).
- `rf_data.py` — datos compartidos por los scripts anteriores.

Estos scripts referencian rutas `Docs/...`, así que deben ejecutarse desde la raíz del repositorio.
