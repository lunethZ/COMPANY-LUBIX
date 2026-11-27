# Plan de Capacitación — LUBIX

**Actividad de cierre (semana 3):** aceptación y sustentación
**Carril:** D · josearmenta2163
**Criterios asociados:** T7-7 (capacitación y validación con cliente)
**Fecha de elaboración:** 2026-11-22
**Revisión:** 2026-11-26 · se añaden buenas prácticas, errores comunes y rutina del administrador/operador (§4.3–§4.5)
**Ejecución prevista:** 24 al 26 de noviembre de 2026
**Documento marco:** [`Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md`](./Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) §5

---

## 1. Objetivo

Definir cómo se capacita a los usuarios de LUBIX para que puedan operar la plataforma web sin acompañamiento del equipo de desarrollo, y cómo se verificará que el aprendizaje se cumplió.

La capacitación se apoya en el manual de usuario que ya está en `Develop` (secciones 1.1.5 a 1.1.10) y en las cuentas de demostración de la plataforma desplegada.

## 2. Alcance

Incluye los flujos implementados y disponibles en la versión a sustentar:

- Ingreso, verificación de correo y recuperación de contraseña.
- Catálogo, búsqueda, carrito, checkout y consulta de pedidos.
- Panel de empresa: productos, pedidos recibidos, estados del pedido, estadísticas y perfil.
- Panel de administración: resumen, empresas, usuarios y PQRS.
- PQRS como canal de solicitudes comerciales (la mesa de ayuda se documenta en 1.1.8).

No incluye los requisitos fuera de alcance de esta entrega (inicio de sesión con Google, doble factor, cupones, devoluciones, métodos de pago guardados, atributos de producto ni duplicar producto). Tampoco incluye capacitación de la aplicación móvil: el APK está pendiente en otro carril y el manual lo declara.

## 3. Audiencia y perfiles

| Perfil | Quién asiste | Qué debe aprender |
|---|---|---|
| Usuario Final | Cliente simulado y personal de apoyo | Registrarse, iniciar sesión, comprar, consultar pedidos y radicar PQRS |
| Empresa | Dueño o administrador de tienda | Publicar productos, gestionar pedidos y consultar estadísticas |
| Administrador | Personal de LUBIX | Validar empresas, gestionar usuarios y resolver PQRS |
| Mesa de ayuda | Personal de soporte | Interpretar PQRS, mensajes de error y tiempos de atención (1.1.8 y 1.1.9) |

## 4. Objetivos de aprendizaje por rol

### 4.1 Módulos por rol

| Módulo | Contenido | Usuario final | Empresa | Administrador | Mesa de ayuda | Duración |
|---|---|---|---|---|---|---|
| M1. Acceso y cuenta | Pestañas, verificación, recuperación y contraseña | ✅ | ✅ | ✅ | ✅ | 20 min |
| M2. Compra | Catálogo, carrito, checkout y pedido | ✅ | — | — | ✅ | 40 min |
| M3. Pedidos y PQRS | Mis pedidos, PQRS y seguimiento | ✅ | ✅ | ✅ | ✅ | 30 min |
| M4. Panel de empresa | Productos, pedidos, estadísticas y perfil | — | ✅ | — | ✅ | 40 min |
| M5. Administración | Empresas, usuarios, PQRS y resumen | — | — | ✅ | ✅ | 40 min |
| M6. Mesa de ayuda | Triage, severidad, evidencia y escalamiento | — | — | — | ✅ | 30 min |

**Rutas sugeridas:**

- Usuario final: M1 → M2 → M3.
- Empresa: M1 → M3 → M4.
- Administrador: M1 → M3 → M5.
- Mesa de ayuda: M1 → M6.

La guía rápida de cada módulo está en [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md) y las dudas frecuentes en [`FAQ_Usuarios.md`](./FAQ_Usuarios.md).

### 4.2 Objetivos de aprendizaje por rol

**Usuario Final**

1. Ingresar por la pestaña **Usuario** y reconocer cuándo debe usar **Empresa**.
2. Buscar un producto, agregarlo al carrito y completar el checkout.
3. Consultar el estado de un pedido en **Mis pedidos**.
4. Radicar una PQRS y consultarla en **Mis solicitudes**.

**Empresa**

1. Ingresar por la pestaña **Empresa**.
2. Publicar un producto con los campos obligatorios.
3. Consultar y actualizar el estado de un pedido recibido.
4. Revisar estadísticas y el perfil de la tienda.

**Administrador**

1. Ingresar por la pestaña **Usuario** con credenciales administrativas.
2. Validar una empresa pendiente y habilitar o inhabilitar cuentas.
3. Resolver una PQRS pendiente.

### 4.3 Buenas prácticas de uso

**Todos los perfiles**

- Usar siempre el frontend oficial (`https://lubix-frontend.onrender.com`) y comprobar el candado TLS; no ingresar por enlaces de correos o mensajes no verificados.
- No compartir contraseñas, códigos de verificación ni tokens. El equipo de LUBIX nunca los solicita por correo, teléfono o mensajería.
- Usar una contraseña única de 12 o más caracteres con mayúscula, minúscula, número y símbolo; no reutilizarla en otros servicios.
- Cerrar sesión al terminar en equipos compartidos; cerrar solo la pestaña no elimina la sesión.
- Reportar un error con módulo, hora, pasos, mensaje exacto y captura; no reintentar en bucle ni crear solicitudes duplicadas.
- No subir documentos sensibles que no sean necesarios para la operación; el pago de esta versión es simulado y no se deben ingresar datos reales de tarjeta.

**Usuario final**

- Revisar cantidades, dirección y total antes de confirmar el pedido y guardar la referencia.
- Mantener el correo actualizado y revisar spam cuando se soliciten códigos de verificación o recuperación.
- Radicar la PQRS con la referencia del pedido y adjuntar evidencia cuando aplique.

**Empresa**

- Publicar precios mayores que cero, stock real y descripciones verificables; una imagen obligatoria por producto.
- Para logo, banner, avatar e imágenes de producto usar archivos de imagen de máximo **5 MB** (JPG/PNG); si no carga, revisar tipo y tamaño antes de reintentar.
- Actualizar el estado de los pedidos a medida que se atienden y responder por el canal disponible cuando un pedido no pueda cumplirse.
- No compartir la cuenta de empresa entre varias personas: cada operador debe tener su propio acceso.

**Administrador y operador**

- Aplicar el **mínimo privilegio**: usar cuentas nominativas y no compartir la cuenta administradora.
- Validar una empresa con la información y el certificado disponibles; registrar el motivo cuando se rechace o inhabilite una cuenta.
- No intentar inhabilitar una cuenta administradora: la plataforma lo impide por diseño.
- Responder las PQRS con lenguaje claro, sin incluir datos personales de terceros, y cerrar solo cuando exista respuesta y trazabilidad.
- No modificar la base de datos directamente salvo procedimiento autorizado, con respaldo previo y registro del cambio.
- Tratar los logs y capturas como información interna: no reenviarlos fuera de los canales de soporte.

### 4.4 Errores comunes y qué hacer

| Perfil | Mensaje o síntoma | Causa probable | Acción |
|---|---|---|---|
| Todos | La plataforma tarda en abrir | *Cold start* del plan gratuito de Render (~39 s) | Esperar y recargar una vez; si persiste, reportar como P2 |
| Todos | `Credenciales inválidas` | Correo/contraseña incorrectos o pestaña equivocada | Verificar pestaña (**Usuario** o **Empresa**) y reintentar |
| Todos | La sesión se cierra sola | Token expirado o sesión invalidada | Iniciar sesión de nuevo y usar **Cerrar sesión** al terminar |
| Usuario / Empresa | No llega el código de verificación | Correo mal escrito, spam o demora del proveedor | Revisar spam, confirmar el correo y solicitar un código nuevo |
| Empresa | `Cuenta de empresa no encontrada o no verificada por Lubix` | Correo sin verificar o empresa pendiente de validación | Verificar el correo y solicitar validación a soporte |
| Empresa | La imagen no cambia o aparece un error al subirla | Archivo no es imagen, supera 5 MB o el almacenamiento no responde | Usar JPG/PNG ≤ 5 MB; si persiste, reportar hora y mensaje exacto |
| Usuario | `No se pudo cancelar el pedido.` | El estado del pedido no permite cancelación | Radicar PQRS con el número de pedido |
| Administrador | No puede inhabilitar a otro administrador | Regla de protección de cuentas administrativas | No insistir; escalar a revisión técnica si el caso lo requiere |
| Administrador | Una PQRS sigue pendiente fuera del SLA | Caso sin asignar o con información incompleta | Revisar la cola, pedir los datos faltantes y escalar según severidad |
| Operador | `503` al guardar o registrar | Dependencia externa (por ejemplo almacenamiento) no disponible | Capturar `detail`, revisar `/health/storage` y escalar; no reintentar en bucle |

El detalle de cada mensaje está en el manual 1.1.9 y en [`FAQ_Usuarios.md`](./FAQ_Usuarios.md); los tiempos de atención, en §6 de este plan y en [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md) §8.

### 4.5 Rutina del administrador y operador

| Frecuencia | Actividad | Evidencia |
|---|---|---|
| Diaria | Revisar `/health`, `/health/database` y `/health/storage`; cola de PQRS; empresas pendientes; errores 5xx en Render | Captura o reporte del estado |
| Diaria | Confirmar que el último respaldo automático se ejecutó | Reporte de `pg_backup.py` / panel de Render |
| Semanal | Revisar usuarios inactivos o accesos anómalos, pedidos estancados y novedades de la FAQ | Registro de revisión |
| Mensual | Revisar roles y accesos, archivos huérfanos del bucket y dependencias pendientes | Checklist de mantenimiento (§3 del [`Plan_Mantenimiento_Infraestructura.md`](./Plan_Mantenimiento_Infraestructura.md)) |
| Antes y después de un release | Ejecutar la verificación post-despliegue y comunicar cambios a usuarios y empresas | Checklist post-despliegue firmada |
| Ante un incidente P1 | Mitigar, comunicar, registrar línea de tiempo y causa raíz | Issue o informe del incidente |

**Lo que no se debe hacer:** compartir credenciales, validar empresas sin revisar la información, cerrar PQRS sin respuesta, borrar datos en producción sin respaldo ni aprobación, ni usar `--force`/`--no-verify` para saltar controles.

## 5. Contenidos y materiales

| Contenido | Material de apoyo |
|---|---|
| Ingreso, perfiles, verificación y recuperación | Manual 1.1.5 |
| Funciones de Usuario, Empresa y Administrador | Manual 1.1.7 |
| Canal de soporte, tiempos de atención y escalamiento | Manual 1.1.8 |
| Mensajes de error y qué hacer ante cada uno | Manual 1.1.9 |
| Dudas frecuentes | Manual 1.1.10 (FAQ) y [`FAQ_Usuarios.md`](./FAQ_Usuarios.md) |
| Guía rápida por rol | [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md) |
| Entregable final consolidado | [`Entrega_Final_Capacitacion.md`](./Entrega_Final_Capacitacion.md) |
| Guion de la sesión | `Docs/Sesion_Simulada_Capacitacion.md` |
| Casos de aceptación | `Docs/Pruebas_Aceptacion_Cliente_Simulado.md` |

Materiales operativos:

- Enlace del frontend desplegado y del manual en GitHub/Develop.
- Tres cuentas de demostración (Usuario, Empresa y Administrador), entregadas por el facilitador fuera del repositorio.
- Un producto con stock disponible y, para el admin, una empresa y una PQRS en estado **Pendiente**.
- Formato de asistencia y formulario de evaluación.

## 6. Modalidad y cronograma

**Modalidad:** virtual, con videollamada y pantalla compartida; opción de grabación para evidencia.

**Duración total:** 3 horas repartidas en dos sesiones dentro de la semana del 23 al 27 de noviembre de 2026.

| Sesión | Fecha propuesta | Duración | Contenido |
|---|---|---|---|
| Sesión 1 | 24 de noviembre de 2026 | 90 min | Ingreso, flujo completo de compra y PQRS del Usuario Final |
| Sesión 2 | 25 de noviembre de 2026 | 90 min | Panel de Empresa, panel de Administración y mesa de ayuda |

La ejecución de las pruebas de aceptación se realiza entre el 24 y el 26 de noviembre, sobre la misma versión capacitada.

## 7. Metodología

1. **Demostración guiada:** el facilitador ejecuta cada flujo mostrando la sección del manual correspondiente.
2. **Práctica del cliente simulado:** el participante repite la tarea sin ayuda, siguiendo solo el manual.
3. **Resolución de dudas:** se responden preguntas y se registran las que no estén cubiertas por la FAQ.
4. **Evaluación:** cuestionario corto y lista de verificación práctica por rol.

## 8. Evaluación del aprendizaje

**Cuestionario (5 preguntas):**

1. ¿Qué pestaña debe usar un administrador para ingresar?
2. ¿Qué hacer si no llega el código de verificación?
3. ¿Cuáles son los cuatro requisitos mínimos de la contraseña?
4. ¿Cuál es la diferencia entre una PQRS y un ticket técnico de la mesa de ayuda?
5. ¿Qué significa que un pedido esté en estado **Enviado**?

**Criterio de aprobación:** responder correctamente al menos 4 de 5 preguntas y completar la práctica del rol asignado sin asistencia del facilitador.

**Lista de verificación práctica:** la definida en los casos de aceptación PA-01 a PA-06.

## 9. Responsables

| Rol | Responsabilidad |
|---|---|
| Facilitador (josearmenta2163) | Prepara materiales, dicta las sesiones y registra evidencias |
| Cliente simulado | Ejecuta la práctica y las pruebas de aceptación sin ayuda |
| Apoyo del equipo | Confirma disponibilidad de la plataforma y de los datos de prueba |
| Mesa de ayuda | Atiende las PQRS generadas durante la capacitación |

## 10. Evidencias y criterios de aceptación

La capacitación se considera cumplida cuando existan:

1. Plan de capacitación aprobado (este documento).
2. Registro de asistencia de las dos sesiones.
3. Evidencia de la sesión (capturas, presentación o grabación).
4. Resultados del cuestionario y de la práctica por rol.
5. Casos de aceptación ejecutados y firmados.
6. Informe final de verificación de calidad con los resultados consolidados.
7. Guía rápida probada por un compañero, con registro en [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md).
8. Entregable final consolidado en [`Entrega_Final_Capacitacion.md`](./Entrega_Final_Capacitacion.md).

## 11. Riesgos y contingencias

| Riesgo | Contingencia |
|---|---|
| Arranque en frío de la plataforma (aprox. 39 s en el plan gratuito) | Abrir la aplicación 2 minutos antes y avisar a los participantes |
| Correo de verificación no disponible en la sesión | Usar cuentas de demostración ya verificadas; dejar el registro para la práctica asincrónica |
| El catálogo no carga en una sesión que no es de empresa | Reportarlo como defecto P2 y continuar con el recorrido por el inicio y el detalle del producto |
| Falta de una empresa o PQRS pendiente para el panel admin | Preparar los registros antes de la sesión 2 |
| Pago real no habilitado | Explicar que el pago es simulado, tal como lo declara el manual |

## 12. Control de cambios

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.1.0 | 2026-11-26 | Se añaden buenas prácticas por perfil (§4.3), errores comunes (§4.4) y rutina del administrador/operador (§4.5) | Equipo LUBIX |
| 1.0.0 | 2026-11-22 | Creación del plan de capacitación por roles | @josearmenta2163 |
