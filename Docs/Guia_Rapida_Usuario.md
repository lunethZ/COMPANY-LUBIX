# Guía rápida de uso — LUBIX

> Guía de referencia para usuarios finales, empresas, administradores y mesa de ayuda.
> Documento canónico detallado: [`Manual Tecnico De Usuario/`](./Manual%20Tecnico%20De%20Usuario/).
> Preguntas ampliadas: [`FAQ_Usuarios.md`](./FAQ_Usuarios.md) · Plan de formación: [`Plan_Capacitacion.md`](./Plan_Capacitacion.md).

| Campo | Valor |
|---|---|
| Versión | 1.0.0 |
| Fecha | 2026-11-26 |
| Audiencia | Usuario final, Empresa, Administrador y mesa de ayuda |
| Probada por | @WinStormX (QA) — ver [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md) |
| Estado | Vigente |

---

## 1. Antes de empezar

| Necesitas | Detalle |
|---|---|
| Navegador | Chrome, Edge o Firefox actualizados |
| Frontend | `https://lubix-frontend.onrender.com` |
| API | `https://lubix-api.onrender.com` |
| Cuenta | Usuario, Empresa o Administrador según tu rol |
| Correo | Acceso al correo registrado para verificar la cuenta o recuperar la contraseña |

> El plan gratuito de Render puede tardar hasta ~39 segundos en el primer acceso. Abre la plataforma con unos minutos de anticipación durante una capacitación.

---

## 2. Ingreso y cuenta (todos los roles)

1. Abre el frontend y elige la pestaña correcta:

   | Cuenta | Pestaña |
   |---|---|
   | Usuario final | **Usuario** |
   | Administrador | **Usuario** |
   | Empresa | **Empresa** |

2. Escribe tu correo y contraseña, y pulsa **Ingresar**.
3. Si es tu primer ingreso, revisa el correo de verificación e introduce el código de seis dígitos.
4. Para cerrar sesión usa **Salir** o **Cerrar sesión**; cerrar solo la pestaña no elimina la sesión.

**Contraseña válida:** mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.

**¿Olvidaste la contraseña?** En el login pulsa **Recuperar** → ingresa tu correo → **Enviar código** → revisa el correo → completa **Nueva contraseña** con el código y confirma.

---

## 3. Usuario final

### 3.1 Comprar un producto

1. En el inicio, busca el producto con el buscador o los filtros.
2. Abre el detalle y pulsa **Agregar al carrito**.
3. En el carrito revisa cantidades, subtotal y total.
4. Pulsa **Continuar** y completa el checkout: **envío → pago → revisión**.
5. Confirma el pedido y guarda la referencia.

### 3.2 Consultar un pedido

Abre **Mis pedidos** en el menú. Verás fecha, valor y estado. Si el estado no cambia en un plazo razonable, radica una PQRS con la referencia del pedido.

### 3.3 Radicar una PQRS

1. Abre **PQRS** en el menú y pulsa **Nueva solicitud**.
2. Selecciona el tipo: petición, queja, reclamo o sugerencia.
3. Escribe asunto y descripción; adjunta evidencia si aplica.
4. Envía y consulta el avance en **Mis solicitudes**.

### 3.4 Perfil y favoritos

- **Perfil:** actualiza tus datos y foto.
- **Favoritos:** guarda productos para consultarlos después.
- **Direcciones:** regístralas desde tu perfil para agilizar el checkout.

---

## 4. Empresa

### 4.1 Publicar un producto

1. Ingresa por la pestaña **Empresa**.
2. Abre **Productos** y pulsa **Nuevo producto**.
3. Completa nombre, descripción, categoría, precio, stock e imagen.
4. Guarda y verifica que aparezca en el listado y en el catálogo.

> El precio debe ser mayor que cero y la imagen es obligatoria.

### 4.2 Gestionar pedidos

1. Abre **Pedidos** en el panel de empresa.
2. Consulta el detalle del pedido y actualiza su estado.
3. Si un pedido no puede atenderse, comunícalo al comprador y radica una PQRS de soporte.

### 4.3 Estadísticas y perfil

- **Estadísticas:** revisa el rendimiento por producto.
- **Mi perfil:** actualiza datos de la tienda y el logo.

---

## 5. Administrador

### 5.1 Validar una empresa

1. Ingresa por la pestaña **Usuario** con credenciales administrativas.
2. Abre **Empresas** y filtra por estado **Pendiente**.
3. Revisa la información y pulsa **Validar** o **Rechazar** según corresponda.

### 5.2 Gestionar usuarios

1. Abre **Usuarios** en el panel administrativo.
2. Busca la cuenta y habilita o inhabilita según el caso.
3. Registra el motivo del cambio cuando la plataforma lo solicite.

### 5.3 Resolver PQRS

1. Abre **PQRS** y filtra por **Pendiente**.
2. Lee la solicitud, clasifícala y responde.
3. Cambia el estado a **Resuelta** y deja la trazabilidad de la respuesta.

---

## 6. Mesa de ayuda

Al recibir una solicitud, pide siempre:

- correo o usuario afectado y rol (Usuario, Empresa, Administrador);
- módulo o pantalla y hora aproximada;
- pasos para reproducir el caso;
- mensaje de error exacto y captura;
- navegador y sistema operativo;
- impacto (cuántos usuarios o procesos afecta).

**Nunca solicites** contraseñas, códigos de verificación, tokens ni datos completos de tarjetas o documentos.

---

## 7. Errores comunes y qué hacer

| Mensaje o síntoma | Causa probable | Acción |
|---|---|---|
| `Credenciales inválidas` | Correo o contraseña incorrectos, o pestaña equivocada | Verifica la pestaña (**Usuario** o **Empresa**) y reintenta |
| `Cuenta de empresa no encontrada o no verificada por Lubix` | Empresa sin validar o correo sin verificar | Verifica el correo y solicita validación a soporte |
| No llega el código de verificación | Spam, correo mal escrito o demora del proveedor | Revisa spam, confirma el correo y solicita un nuevo código |
| El catálogo no carga | Red lenta o cold start de Render | Recarga; si persiste, reporta como P2 con captura |
| `No se pudo cancelar el pedido.` | El estado del pedido no permite cancelación | Radica una PQRS con el número de pedido |
| La sesión se cierra sola | Token expirado o sesión inválida | Inicia sesión de nuevo y usa **Cerrar sesión** al terminar |
| Error 500 en una ruta | Defecto del servidor o identificador inválido | Reporta con hora, ruta y captura; no reintentes en bucle |

---

## 8. Canales y tiempos de soporte

| Severidad | Ejemplo | Primera respuesta | Resolución objetivo |
|---|---|---|---|
| P1 — Crítica | Plataforma caída, login o pagos inoperantes | 30 min | 4 h |
| P2 — Alta | Catálogo o carrito degradado sin alternativa | 2 h | 24 h |
| P3 — Media | Error con solución temporal | 8 h (día hábil) | 3 días hábiles |
| P4 — Baja | Duda, mejora o ajuste visual | 1 día hábil | Próximo release |

Canales: PQRS en la plataforma, mesa de ayuda (manual 1.1.8) y GitHub Issues para el equipo técnico. Para incidentes de seguridad, usa el canal telefónico de guardia y marca el ticket como **Seguridad de la información**.

---

## 9. Checklist rápido

- [ ] Ingresé por la pestaña correcta.
- [ ] Verifiqué mi correo.
- [ ] Usé una contraseña que cumple los cuatro requisitos.
- [ ] Completé la tarea de mi rol sin ayuda.
- [ ] Cerré sesión al terminar.
- [ ] Si tuve un error, envié captura, hora y pasos de reproducción.

---

## 10. Control de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-26 | Creación de la guía rápida por roles y validación por par |
