# Preguntas frecuentes (FAQ) — LUBIX

> Respuestas breves para los cuatro perfiles de uso. La versión extendida y con capturas está en [`Manual Tecnico De Usuario/1.1.10`](./Manual%20Tecnico%20De%20Usuario/1.1.10/1.1.10%20Preguntas%20frecuentes%20%28FAQ%29.md).
> Guía de pasos: [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md).

| Campo | Valor |
|---|---|
| Versión | 1.0.0 |
| Fecha | 2026-11-26 |
| Audiencia | Usuario final, Empresa, Administrador y mesa de ayuda |
| Estado | Vigente |

**Cómo usar esta FAQ:** si el problema es un mensaje de error concreto, consulta también el manual 1.1.9. Si no encuentras la respuesta, usa los canales del manual 1.1.8.

---

## 1. Acceso y cuenta

### 1. ¿Qué pestaña debo elegir para ingresar?

| Cuenta | Pestaña |
|---|---|
| Usuario final | **Usuario** |
| Administrador | **Usuario** |
| Empresa | **Empresa** |

Si eliges la pestaña equivocada, el sistema rechaza el ingreso aunque la contraseña sea correcta. Ver manual 1.1.5.4.

### 2. Olvidé mi contraseña, ¿cómo la recupero?

Pulsa **Recuperar** en el login, ingresa tu correo, solicita el código y completa **Nueva contraseña** con el código recibido. El código es de un solo uso y el nuevo invalida al anterior.

### 3. No me llega el código de verificación o recuperación. ¿Qué hago?

Revisa spam, confirma que el correo sea el registrado y solicita un nuevo código. Verifica también la fecha y hora de tu dispositivo. Si persiste, contacta a la mesa de ayuda con el correo, la fecha y la hora del intento.

### 4. ¿Qué requisitos debe cumplir mi contraseña?

Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número. Se recomienda usar más de 12 caracteres y caracteres especiales.

### 5. ¿Por qué me devuelve al login sin mostrarme un mensaje?

La sesión expiró o el token ya no es válido. LUBIX borra los tokens y redirige a `/login`; vuelve a iniciar sesión. Para cerrar correctamente usa **Salir** o **Cerrar sesión**.

### 6. ¿Cómo cierro sesión de forma segura?

Usa la opción **Salir** o **Cerrar sesión** del menú. Cerrar solo la pestaña o el navegador no elimina los tokens del dispositivo.

### 7. ¿Puedo usar la misma cuenta en varios dispositivos?

Sí, siempre que respetes las políticas de seguridad. Si detectas un acceso no reconocido, cambia la contraseña y reporta el incidente de inmediato.

### 8. ¿LUBIX me pedirá la contraseña por correo o teléfono?

No. LUBIX nunca solicita contraseñas, códigos ni tokens por correo, teléfono o mensajería. Si recibes una solicitud así, no respondas y repórtala como seguridad.

---

## 2. Usuario final: catálogo, carrito y pedidos

### 9. ¿Cómo realizo una compra?

Busca el producto, ábrelo, pulsa **Agregar al carrito**, revisa cantidades y total en el carrito y completa el checkout: **envío → pago → revisión**. Confirma el pedido y guarda la referencia.

### 10. ¿El pago es real?

En la versión actual el pago es simulado. La plataforma no cobra a la tarjeta; el flujo sirve para validar el pedido y la experiencia de compra.

### 11. El catálogo se queda cargando. ¿Qué hago?

Verifica la conexión y recarga. Si persiste, repórtalo como P2 con cuenta, perfil, navegador, hora y captura. El primer acceso puede tardar por el cold start de Render.

### 12. ¿Cómo consulto el estado de mi pedido?

Abre **Mis pedidos** en el menú. Allí ves fecha, valor y estado. Si no cambia en un plazo razonable, radica una PQRS con la referencia del pedido.

### 13. ¿Puedo cancelar un pedido?

Solo si el estado lo permite. Si la plataforma muestra `No se pudo cancelar el pedido.`, radica una PQRS con el número de pedido para revisión comercial.

### 14. ¿Cómo guardo productos para después?

Usa **Favoritos** en el detalle del producto. Podrás consultarlos desde tu perfil sin volver a buscarlos.

### 15. ¿Dónde actualizo mis datos, foto y direcciones?

En **Perfil** puedes editar tus datos y foto; en **Direcciones** registras las direcciones de envío para agilizar el checkout.

---

## 3. Empresa

### 16. ¿Cómo publico un producto?

Ingresa por **Empresa** → **Productos** → **Nuevo producto**. Completa nombre, descripción, categoría, precio, stock e imagen. El precio debe ser mayor que cero y la imagen es obligatoria.

### 17. ¿Por qué no puedo ingresar con mi cuenta de empresa?

Revisa que la cuenta se haya creado por el registro empresarial, que el correo esté verificado, que exista el registro de empresa y que LUBIX haya validado la empresa cuando aplique. Si falta algo, contacta a soporte.

### 18. ¿Dónde veo los pedidos que me hicieron?

En el panel de empresa, sección **Pedidos**. Allí puedes abrir el detalle y actualizar el estado de cada orden.

### 19. ¿Dónde veo las estadísticas de mis productos?

En la sección **Estadísticas** del panel de empresa. Muestra el rendimiento por producto para apoyar decisiones de inventario y precios.

### 20. ¿Cómo actualizo el logo o los datos de mi tienda?

En **Mi perfil** del panel de empresa. Los cambios se reflejan en el catálogo y en la ficha pública de la empresa.

### 21. ¿Qué hago si un pedido no puede atenderse?

Comunícalo al comprador por el canal disponible y radica una PQRS de soporte con la referencia del pedido para dejar trazabilidad.

---

## 4. Administrador

### 22. ¿Cómo valido una empresa pendiente?

Ingresa por **Usuario** con credenciales administrativas → **Empresas** → filtra **Pendiente** → revisa la información → **Validar** o **Rechazar**.

### 23. ¿Cómo habilito o inhabilito un usuario?

En **Usuarios**, busca la cuenta y aplica el cambio de estado. Registra el motivo cuando la plataforma lo solicite para conservar la auditoría.

### 24. ¿Cómo resuelvo una PQRS?

Abre **PQRS** → filtra **Pendiente** → lee y clasifica la solicitud → responde → cambia el estado a **Resuelta**. La respuesta queda disponible para el usuario en **Mis solicitudes**.

### 25. ¿Qué diferencia hay entre PQRS y ticket técnico?

La **PQRS** es una solicitud del usuario sobre el servicio y se gestiona en la plataforma. El **ticket técnico** es un defecto o tarea de ingeniería y se registra en GitHub Issues. Si una PQRS revela un defecto, se crea un Issue enlazado.

### 26. ¿Qué información debo pedir antes de escalar un caso?

Usuario y rol, módulo o pantalla, hora, pasos de reproducción, mensaje exacto, captura, navegador/SO e impacto. Nunca solicites contraseñas, códigos ni tokens.

---

## 5. PQRS y soporte

### 27. ¿Dónde radico una PQRS y cuánto tarda la respuesta?

En **PQRS** → **Nueva solicitud**. Elige el tipo, escribe asunto y descripción y envía. Los tiempos de referencia son P1: 30 min / 4 h; P2: 2 h / 24 h; P3: 8 h / 3 días hábiles; P4: 1 día hábil / próximo release.

### 28. ¿Dónde reporto un error técnico?

Por la mesa de ayuda (manual 1.1.8) o GitHub Issues para el equipo. Incluye módulo, hora, pasos, mensaje exacto, captura, navegador/SO e impacto.

### 29. ¿Cómo hago seguimiento a mi PQRS?

En **Mis solicitudes** ves el estado y el historial. Si necesitas escala, responde en la misma solicitud con la referencia.

### 30. ¿Qué pasa si mi caso es crítico?

Marca la severidad P1 y usa el canal de guardia si está disponible. Un caso P1 incluye plataforma caída, login o pagos inoperantes o pérdida de datos.

---

## 6. Seguridad y privacidad

### 31. ¿Qué hago si sospecho un acceso no autorizado?

Cambia la contraseña desde la recuperación y reporta el incidente en un plazo máximo de 24 horas por el canal telefónico de guardia y con un ticket marcado como **Seguridad de la información**.

### 32. ¿LUBIX comparte mis datos?

Los datos se usan para operar la plataforma y se tratan según la política de seguridad del proyecto. No compartas contraseñas, códigos ni tokens con terceros.

### 33. ¿Puedo descargar o eliminar mis datos?

Las solicitudes de acceso, corrección o eliminación se radican por PQRS y se atienden por el canal de soporte según la política aplicable.

---

## 7. Ayudas en línea y aplicación móvil

### 34. ¿Dónde encuentro el manual completo?

En [`Manual Tecnico De Usuario/`](./Manual%20Tecnico%20De%20Usuario/), secciones 1.1.5 a 1.1.10. La guía rápida resume los pasos esenciales.

### 35. ¿Hay aplicación móvil?

La app móvil está en desarrollo y su APK aún no forma parte de esta entrega. La plataforma web es *mobile-first* y funciona en el navegador del teléfono.

### 36. ¿Dónde reporto una mejora o sugerencia?

Radica una PQRS de tipo **Sugerencia**. El equipo la revisa y, si aplica, la convierte en una acción de mejora en el backlog.

---

## 8. Criterios de aceptación de esta FAQ

- [x] Cubre los cuatro perfiles: Usuario final, Empresa, Administrador y mesa de ayuda.
- [x] Es consistente con los manuales 1.1.5, 1.1.7, 1.1.8, 1.1.9 y 1.1.10.
- [x] No inventa canales ni tiempos distintos a los documentados.
- [x] No expone contraseñas, códigos, tokens ni datos personales.
- [x] Remite al manual cuando se requiere mayor detalle.

---

## 9. Control de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-26 | FAQ consolidada por roles y alineada con el manual 1.1.10 |
