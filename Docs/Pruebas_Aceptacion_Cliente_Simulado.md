# Pruebas de Aceptación con Cliente Simulado — LUBIX

**Documento asociado:** `Docs/Plan_Capacitacion.md` y `Docs/Sesion_Simulada_Capacitacion.md`
**Actividad:** semana 3 · aceptación y sustentación (T7-7; alimenta el informe final T7-10)
**Fecha de elaboración:** 2026-11-22
**Fecha de ejecución:** 2026-11-24
**Ventana de ejecución:** 24 al 26 de noviembre de 2026
**Versión evaluada:** `main` (`2b85add`), frontend y API desplegados en Render
**Evidencias:** `Docs/evidencias/semana3/`

---

## 1. Objetivo

Verificar, con un cliente simulado y sin asistencia del equipo de desarrollo, que los flujos principales de LUBIX funcionan por rol y que el resultado es aceptable para la entrega.

## 2. Alcance y criterio de cobertura

Se definen **seis casos**, con **dos por rol**: Usuario Final, Empresa y Administrador. Todos se ejecutan sobre la aplicación web; la aplicación móvil queda fuera de esta entrega.

Cada caso se considera **aprobado** cuando:

1. Se completa la secuencia de pasos sin errores bloqueantes.
2. El sistema muestra el resultado esperado y el estado final indicado.
3. Se conserva la evidencia (captura o video corto).
4. El cliente simulado confirma que la tarea se pudo realizar consultando solo el manual.

Si un caso falla, se registra el defecto en la sección 8 y se decide si la entrega continúa con observaciones.

## 3. Entorno y datos de prueba

| Elemento | Detalle |
|---|---|
| Aplicación | Frontend desplegado en Render; API en Render |
| Navegador | Chromium 1440 × 900 (Playwright) sobre el frontend desplegado |
| Cuentas | `manual.usuario@lubix-demo.com`, `manual.empresa@lubix-demo.com` y `manual.admin@lubix-demo.com` (entregadas por el facilitador) |
| Datos previos | Producto con stock; pedido pendiente; PQRS pendientes. La empresa pendiente no se pudo preparar (ver D-01) |
| Condición conocida | El arranque en frío de la API puede tardar cerca de 39 s; no se cuenta como defecto |

**Preparación de datos** (a cargo del facilitador, antes de la ejecución):

1. Producto con stock: cuenta de Empresa, sección **Mis Productos**, **Agregar producto**.
2. Pedido pendiente: cuenta de Usuario, compra de ese producto.
3. Empresa pendiente: registro empresarial de prueba, sin validar por el administrador.
4. PQRS pendiente: cuenta de Usuario, opción **PQRS**, **Nueva solicitud**.

## 4. Casos de aceptación

### PA-01 · Ingreso del Usuario Final

| Campo | Detalle |
|---|---|
| Rol | Usuario Final |
| Objetivo | Confirmar que el usuario ingresa y llega a su panel |
| Precondición | Cuenta de Usuario verificada y activa |
| Pasos | 1. Abrir el login. 2. Seleccionar la pestaña **Usuario**. 3. Ingresar correo y contraseña. 4. Pulsar **Iniciar Sesión**. |
| Resultado esperado | Mensaje de bienvenida y redirección a `/home-usuario` con el catálogo y el menú del usuario |
| Resultado obtenido | Ingreso exitoso con el mensaje de bienvenida y llegada a `/home-usuario` con catálogo y menú del usuario |
| Veredicto | **Aprobado** |
| Evidencia | `Docs/evidencias/semana3/pa-01-login-usuario.png` |
| Referencia | Manual 1.1.5.4 |

### PA-02 · Compra completa del Usuario Final

| Campo | Detalle |
|---|---|
| Rol | Usuario Final |
| Objetivo | Completar una compra de principio a fin |
| Precondición | Sesión de Usuario iniciada; producto con stock disponible |
| Pasos | 1. Ubicar el producto por búsqueda o catálogo. 2. Abrir el detalle. 3. Agregarlo al carrito. 4. Abrir el carrito y continuar al checkout. 5. Completar envío, pago (simulado) y revisión. 6. Confirmar el pedido. 7. Abrir **Mis pedidos**. |
| Resultado esperado | Pedido creado con estado inicial **Pendiente** y visible en **Mis pedidos** |
| Resultado obtenido | Pedido `2c0a0c4a` creado en estado **Pendiente** y visible en **Mis pedidos**; revisión del checkout y confirmación sin errores |
| Veredicto | **Aprobado** |
| Evidencia | `Docs/evidencias/semana3/pa-02-01-revision-checkout.png`, `Docs/evidencias/semana3/pa-02-02-mis-pedidos.png` |
| Referencia | Manual 1.1.7 (Usuario Final) |

### PA-03 · Publicación de producto por la Empresa

| Campo | Detalle |
|---|---|
| Rol | Empresa |
| Objetivo | Publicar un producto nuevo en el catálogo |
| Precondición | Cuenta de Empresa validada y sesión iniciada por la pestaña **Empresa** |
| Pasos | 1. Abrir **Mis Productos**. 2. Pulsar **Agregar producto**. 3. Completar nombre, precio, stock, categoría, descripción e imagen. 4. Pulsar **Publicar producto**. 5. Verificar el listado. |
| Resultado esperado | Mensaje de confirmación y producto visible en **Mis Productos** con estado **Activo** |
| Resultado obtenido | Producto «Parlante QA Aceptacion 311340» publicado con estado **Activo** y visible en **Mis Productos**. La imagen se cargó por URL porque la subida de archivos está caída en producción (D-01) |
| Veredicto | **Aprobado** |
| Evidencia | `Docs/evidencias/semana3/pa-03-01-formulario-producto.png`, `Docs/evidencias/semana3/pa-03-02-producto-publicado.png` |
| Referencia | Manual 1.1.7 (Empresa) |

### PA-04 · Gestión del estado de un pedido recibido

| Campo | Detalle |
|---|---|
| Rol | Empresa |
| Objetivo | Avanzar un pedido hasta **Entregado** |
| Precondición | Sesión de Empresa iniciada; pedido en estado **Pendiente** |
| Pasos | 1. Abrir **Pedidos**. 2. Desplegar el pedido pendiente. 3. Pulsar **Confirmar pedido**. 4. Pulsar **Marcar como enviado**. 5. Pulsar **Marcar como entregado**. |
| Resultado esperado | El pedido cambia a **Confirmado**, luego **Enviado** y finalmente **Entregado**, sin acciones pendientes |
| Resultado obtenido | El pedido `2c0a0c4a` pasó por **Confirmado → Enviado → Entregado**; al final no quedan acciones disponibles |
| Veredicto | **Aprobado** |
| Evidencia | `Docs/evidencias/semana3/pa-04-01-pedido-pendiente.png`, `Docs/evidencias/semana3/pa-04-02-pedido-entregado.png` |
| Referencia | Manual 1.1.7 (Empresa) |

### PA-05 · Validación de una empresa pendiente

| Campo | Detalle |
|---|---|
| Rol | Administrador |
| Objetivo | Aprobar una empresa desde el panel administrativo |
| Precondición | Sesión de Administrador iniciada por la pestaña **Usuario**; empresa de prueba en estado **Pendiente** |
| Pasos | 1. Abrir `/dashboard-admin`. 2. Entrar a **Empresas**. 3. Ubicar la empresa pendiente. 4. Pulsar **Validar empresa**. 5. Revisar el estado y el contador **Empresas por validar**. |
| Resultado esperado | La empresa pasa a **Validada** y el contador de pendientes disminuye |
| Resultado obtenido | **No ejecutado.** No fue posible crear la empresa pendiente: el registro de empresa devuelve HTTP 500 y la subida de archivos falla porque el host `minio` no resuelve en Render (D-01). Queda como defecto bloqueante de la precondición |
| Veredicto | **No aprobado (bloqueado por D-01)** |
| Evidencia | `Docs/evidencias/semana3/pa-05-01-empresa-pendiente.png`, `Docs/evidencias/semana3/ejecucion-2026-11-24.txt` |
| Referencia | Manual 1.1.7 (Administrador) |

### PA-06 · Resolución de una PQRS

| Campo | Detalle |
|---|---|
| Rol | Administrador |
| Objetivo | Cerrar una solicitud PQRS pendiente |
| Precondición | Sesión de Administrador iniciada; PQRS en estado **Pendiente** |
| Pasos | 1. Abrir la pestaña **PQRS**. 2. Ubicar la solicitud pendiente. 3. Revisar tipo, asunto, descripción y remitente. 4. Pulsar **Marcar resuelta**. |
| Resultado esperado | La solicitud cambia a **Resuelta** y se resalta en verde |
| Resultado obtenido | La PQRS `9a48d1ab` cambió de **Pendiente** a **Resuelta** y se resaltó en verde |
| Veredicto | **Aprobado** |
| Evidencia | `Docs/evidencias/semana3/pa-06-01-pqrs-pendiente.png`, `Docs/evidencias/semana3/pa-06-02-pqrs-resuelta.png` |
| Referencia | Manual 1.1.7 (Administrador) |

## 5. Resumen de resultados

| Caso | Rol | Veredicto | Defecto asociado |
|---|---|---|---|
| PA-01 | Usuario Final | Aprobado | — |
| PA-02 | Usuario Final | Aprobado | — |
| PA-03 | Empresa | Aprobado | D-01 (limitación de imágenes) |
| PA-04 | Empresa | Aprobado | — |
| PA-05 | Administrador | No aprobado | D-01 |
| PA-06 | Administrador | Aprobado | — |

**Resultado global:** 5 de 6 casos aprobados. Se cumple el criterio de aceptación global (mínimo 5 de 6) con observaciones; el caso fallido tiene defecto registrado, severidad asignada y decisión del facilitador.

## 6. Condiciones conocidas a observar durante la ejecución

- El catálogo puede quedarse cargando en una sesión que no es de empresa. Si ocurre, se registra como defecto y se continúa por el inicio y el detalle del producto.
- El pago es simulado; no se espera una pasarela real.
- El arranque en frío de la API no se considera defecto, pero se mide y se informa.

## 7. Registro de ejecución

| Caso | Fecha y hora | Ejecutado por (cliente simulado) | Resultado | Evidencia (archivo o enlace) |
|---|---|---|---|---|
| PA-01 | 2026-11-24 22:12 | Perfil Usuario Final (cuenta demo) | Aprobado | `semana3/pa-01-login-usuario.png` |
| PA-02 | 2026-11-24 22:12 | Perfil Usuario Final (cuenta demo) | Aprobado | `semana3/pa-02-01-revision-checkout.png`, `semana3/pa-02-02-mis-pedidos.png` |
| PA-03 | 2026-11-24 22:12 | Perfil Empresa (cuenta demo) | Aprobado | `semana3/pa-03-01-formulario-producto.png`, `semana3/pa-03-02-producto-publicado.png` |
| PA-04 | 2026-11-24 22:12 | Perfil Empresa (cuenta demo) | Aprobado | `semana3/pa-04-01-pedido-pendiente.png`, `semana3/pa-04-02-pedido-entregado.png` |
| PA-05 | 2026-11-24 22:13 | Perfil Administrador (cuenta demo) | No ejecutado (D-01) | `semana3/pa-05-01-empresa-pendiente.png`, `semana3/ejecucion-2026-11-24.txt` |
| PA-06 | 2026-11-24 22:14 | Perfil Administrador (cuenta demo) | Aprobado | `semana3/pa-06-01-pqrs-pendiente.png`, `semana3/pa-06-02-pqrs-resuelta.png` |

## 8. Registro de defectos

| ID | Caso | Descripción | Severidad | Estado | Issue o responsable |
|---|---|---|---|---|---|
| D-01 | PA-05, PA-03 | En producción el registro de empresa devuelve HTTP 500 y la subida de archivos falla porque el servicio no puede resolver el host `minio`; el certificado del registro y las imágenes subidas dependen de ese almacenamiento | P2 | Abierto | Responsable de despliegue en Render (configurar MinIO/S3 o desacoplar el certificado) |
| D-02 | PA-05 | El botón **Validar empresa** solo está en la pestaña **Resumen** del panel administrativo, mientras el manual y este caso indican la pestaña **Empresas** | P4 | Abierto | Equipo frontend (alinear manual o mover la acción) |

Severidades: **P1** bloquea la operación, **P2** afecta una función esencial con solución alternativa, **P3** afecta una función secundaria, **P4** cosmético o consulta.

## 9. Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Cliente simulado | Perfiles demo (Usuario, Empresa, Administrador) | Pendiente de rúbrica | 2026-11-24 |
| Facilitador (josearmenta2163) | Jose Armenta | Pendiente de rúbrica | 2026-11-24 |
| Responsable de calidad | Equipo de calidad LUBIX | Pendiente de rúbrica | 2026-11-24 |

Los resultados de este documento se consolidan en el informe final de verificación de calidad, que se elabora al cierre de la semana 3.
