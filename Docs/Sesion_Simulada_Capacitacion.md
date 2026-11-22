# Sesión Simulada de Capacitación — LUBIX

**Documento asociado:** `Docs/Plan_Capacitacion.md`
**Actividad:** semana 3 · aceptación y sustentación (T7-7)
**Fecha de elaboración:** 2026-11-22
**Fecha propuesta de ejecución:** 24 y 25 de noviembre de 2026

---

## 1. Propósito

Servir de guion para dictar la capacitación de LUBIX a un cliente simulado, de forma que cualquier integrante del equipo pueda ejecutarla y obtener las mismas evidencias.

El guion cubre dos sesiones de 90 minutos: la primera para el Usuario Final; la segunda para Empresa, Administración y mesa de ayuda.

## 2. Antes de la sesión (lista de verificación)

| Punto | Detalle |
|---|---|
| Plataforma disponible | Abrir el frontend desplegado con antelación para superar el arranque en frío (aprox. 39 s) |
| Cuentas de prueba | Usuario, Empresa y Administrador verificadas y activas |
| Datos preparados | Un producto con stock, un pedido pendiente, una empresa pendiente y una PQRS pendiente |
| Material | Manual 1.1.5, 1.1.7, 1.1.8, 1.1.9 y 1.1.10 abiertos para compartir pantalla |
| Formato de asistencia | Nombre, rol y hora de ingreso de cada participante |
| Grabación o capturas | Autorización de los participantes y prueba de captura de pantalla |
| Plan B | Capturas del manual listas por si falla la conexión o el correo de verificación |

## 3. Sesión 1 — Usuario Final (90 minutos)

| Tiempo | Bloque | Qué se muestra | Apoyo | Evidencia |
|---|---|---|---|---|
| 0–10 min | Bienvenida y objetivos | Agenda, reglas de seguridad (no compartir contraseñas ni códigos) y perfiles de la plataforma | Manual 1.1.5.2 | Captura del inicio |
| 10–20 min | Ingreso | Selección de la pestaña **Usuario**, credenciales, mensaje de bienvenida y llegada a `/home-usuario` | Manual 1.1.5.4 | Captura del inicio del usuario |
| 20–30 min | Recuperación | Pantalla **Recuperar contraseña**, envío de código y formulario de nueva contraseña, sin completar el cambio real | Manual 1.1.5.8 | Captura de la pantalla de recuperación |
| 30–45 min | Catálogo y carrito | Búsqueda, filtros, detalle del producto, selección de cantidad y carrito | Manual 1.1.7 (Usuario) | Captura del carrito |
| 45–60 min | Checkout | Pasos de envío, pago (simulado) y revisión; confirmación del pedido | Manual 1.1.7 (Usuario) | Captura de la revisión y del pedido creado |
| 60–70 min | Mis pedidos | Consulta del pedido creado y explicación de los estados | Manual 1.1.7 (Usuario) | Captura de **Mis pedidos** |
| 70–80 min | PQRS | Radicación de una solicitud de prueba y consulta en **Mis solicitudes** | Manual 1.1.7 y 1.1.8 | Captura de la PQRS en estado **Pendiente** |
| 80–90 min | Práctica y cierre | El cliente simulado repite una tarea sin ayuda, se responden dudas y se aplica el cuestionario | Manual 1.1.10 | Lista de verificación y respuestas |

## 4. Sesión 2 — Empresa, Administración y mesa de ayuda (90 minutos)

| Tiempo | Bloque | Qué se muestra | Apoyo | Evidencia |
|---|---|---|---|---|
| 0–10 min | Repaso y objetivos | Resumen de la sesión 1 y diferencias entre las pestañas **Usuario** y **Empresa** | Manual 1.1.5.2 | Captura del login |
| 10–25 min | Ingreso de Empresa | Acceso por la pestaña **Empresa**, panel `/dashboard-empresa` y recorrido por las secciones | Manual 1.1.5.5.2 | Captura del panel de empresa |
| 25–40 min | Productos | **Mis Productos**, publicación con los campos obligatorios, edición y activación/desactivación | Manual 1.1.7 (Empresa) | Captura del producto publicado |
| 40–55 min | Pedidos | **Pedidos recibidos**, detalle del pedido y cambio de estado **Pendiente → Confirmado → Enviado → Entregado** | Manual 1.1.7 (Empresa) | Captura del detalle y del estado final |
| 55–65 min | Estadísticas y perfil | Indicadores de ventas, rendimiento por producto y edición del perfil de la tienda | Manual 1.1.7 (Empresa) | Captura de estadísticas |
| 65–80 min | Administración | Ingreso por la pestaña **Usuario**, panel `/dashboard-admin`, validación de empresa, gestión de usuarios y resolución de PQRS | Manual 1.1.5.5.3 y 1.1.7 (Administrador) | Capturas del panel y de la PQRS resuelta |
| 80–90 min | Mesa de ayuda y cierre | Canales, prioridades y tiempos de atención; cuestionario final y encuesta de la sesión | Manual 1.1.8 | Respuestas y acta |

## 5. Práctica del cliente simulado

Al final de cada sesión, el cliente simulado ejecuta una tarea sin que el facilitador indique los pasos. Solo puede consultar el manual.

| Sesión | Tarea asignada | Criterio de logro |
|---|---|---|
| 1 | Buscar un producto, agregarlo al carrito y completar el checkout | Pedido creado y visible en **Mis pedidos** |
| 2 | Publicar un producto y confirmar un pedido pendiente | Producto visible en **Mis Productos**; pedido en estado **Confirmado** |

Si el cliente simulado requiere ayuda, se registra como observación de usabilidad y se marca la sección del manual que debe mejorarse.

## 6. Registro de asistencia

| Participante | Rol capacitado | Sesión 1 | Sesión 2 | Firma |
|---|---|---|---|---|
|  | Usuario Final |  |  |  |
|  | Empresa |  |  |  |
|  | Administrador |  |  |  |
|  | Mesa de ayuda |  |  |  |

## 7. Evaluación

Se aplica el cuestionario de cinco preguntas definido en `Docs/Plan_Capacitacion.md` (sección 8).

| Participante | Puntaje (0–5) | Práctica superada (Sí/No) | Resultado |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |

## 8. Observaciones de la sesión

| N.º | Observación | Sección del manual afectada | Acción propuesta |
|---|---|---|---|
| 1 |  |  |  |
| 2 |  |  |  |

## 9. Evidencias a conservar

1. Registro de asistencia diligenciado.
2. Capturas de cada bloque indicado en las tablas de las sesiones 1 y 2.
3. Resultados del cuestionario y de la práctica.
4. Observaciones y acciones propuestas.
5. Si existe grabación, enlace o archivo con acceso restringido al equipo.

## 10. Contingencias durante la sesión

- **Arranque en frío:** esperar la carga y continuar; informar a los participantes que es propio del plan gratuito.
- **Falla el correo de verificación:** continuar con una cuenta ya verificada y dejar el registro como práctica posterior.
- **El catálogo no carga para el Usuario:** usar el inicio y el detalle del producto, registrar el defecto y reportarlo por la mesa de ayuda.
- **Se cae la videollamada:** retomar con el guion y las capturas; registrar el tiempo perdido en observaciones.
