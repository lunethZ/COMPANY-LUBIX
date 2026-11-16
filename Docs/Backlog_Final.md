# Backlog final — LUBIX

> Estado de los 68 requisitos funcionales (RF) frente a las 68 historias de usuario (HU) y al código del repositorio.
> Corte: 16 de noviembre de 2026. Responsable del documento: José Andrés Armenta Farías (Dev D).

## Cómo se calculó

- **Hecho (100 %)**: existe el endpoint o la función completa y se probó en la API.
- **Parcial (1–99 %)**: existe una parte; la columna de evidencia dice qué falta.
- **No implementado (0 %)**: no hay código; se justifica y queda como deuda técnica.
- El porcentaje de cada módulo es el promedio de los porcentajes de sus RF. El global es el promedio de los 68.
- Base: revisión de los routers de `backend/app/routers/` y del frontend. Los ítems parciales o no implementados se confirman manualmente en la aplicación antes de la sustentación.

## Resumen

| Indicador | Valor |
|---|---|
| Total de RF | 68 |
| Hecho | 48 (71%) |
| Parcial | 11 (16%) |
| No implementado | 9 (13%) |
| **Avance global** | **79 %** |

## Avance por módulo

| Módulo | RF | Hecho | Parcial | No impl. | Avance |
|---|---:|---:|---:|---:|---:|
| Autenticación | 10 | 7 | 1 | 2 | 76 % |
| Perfil de Usuario | 10 | 8 | 1 | 1 | 83 % |
| Productos | 10 | 6 | 2 | 2 | 71 % |
| Catálogo | 12 | 9 | 2 | 1 | 82 % |
| Carrito de Compras | 10 | 6 | 2 | 2 | 74 % |
| Pedidos | 10 | 6 | 3 | 1 | 72 % |
| Administración | 4 | 4 | 0 | 0 | 100 % |
| Soporte | 2 | 2 | 0 | 0 | 100 % |

## Detalle por requisito

### Autenticación

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-001 | Registro de usuario | ✅ Hecho | 100 % | `POST /auth/register-user` y `register-company`. |
| RF-002 | Inicio de sesión | ✅ Hecho | 100 % | `POST /auth/login-user` y `login-company` con JWT. |
| RF-003 | Recuperación de contraseña | ✅ Hecho | 100 % | `POST /auth/forgot-password-user`. |
| RF-004 | Restablecer contraseña | ✅ Hecho | 100 % | `POST /auth/reset-password-user`. |
| RF-005 | Cerrar sesión | ✅ Hecho | 100 % | `POST /auth/logout`. |
| RF-006 | Verificar correo electrónico | ✅ Hecho | 100 % | `POST /auth/verify-email-user`. |
| RF-007 | Reenviar correo de verificación | ✅ Hecho | 100 % | `POST /auth/resend-verification`. |
| RF-008 | Inicio de sesión con Google | ❌ No implementado | 0 % | Sin endpoint ni proveedor OAuth. Fuera de alcance: requiere credenciales y consentimiento de Google; queda como deuda técnica. |
| RF-009 | Autenticación en dos pasos | ❌ No implementado | 0 % | Sin endpoint ni modelo de segundo factor. Fuera de alcance de esta entrega; deuda técnica. |
| RF-010 | Gestión de sesiones | 🟡 Parcial | 60 % | Existen `POST /auth/refresh` y refresh token en BD; falta listar y cerrar otras sesiones activas. |

### Perfil de Usuario

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-011 | Ver perfil de usuario | ✅ Hecho | 100 % | `GET /user/dashboard/me`. |
| RF-012 | Editar perfil de usuario | ✅ Hecho | 100 % | `PATCH /user/profile`. |
| RF-013 | Cambiar foto de perfil | ✅ Hecho | 100 % | `POST /user/avatar/upload` (y banner). |
| RF-014 | Cambiar contraseña | ✅ Hecho | 100 % | `PATCH /user/change-password`. |
| RF-015 | Gestionar direcciones | ✅ Hecho | 100 % | `GET/POST/PATCH /user/addresses`. |
| RF-016 | Eliminar dirección | ✅ Hecho | 100 % | `DELETE /user/addresses/{id}`. |
| RF-017 | Configurar preferencias | 🟡 Parcial | 30 % | Solo el tema claro/oscuro en el frontend (`ThemeProvider`); no hay endpoint ni persistencia de preferencias. |
| RF-018 | Gestionar métodos de pago | ❌ No implementado | 0 % | Solo existe el campo `payment_method` dentro del pedido; no hay métodos guardados por usuario. Se mantiene pago simulado; fuera de alcance. |
| RF-019 | Eliminar cuenta | ✅ Hecho | 100 % | `DELETE /user/account`. |
| RF-020 | Descargar datos personales | ✅ Hecho | 100 % | `GET /user/export`. |

### Productos

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-021 | Crear producto | ✅ Hecho | 100 % | `POST /company/products`. |
| RF-022 | Editar producto | ✅ Hecho | 100 % | `PATCH /company/products/{id}`. |
| RF-023 | Eliminar producto | ✅ Hecho | 100 % | `DELETE /company/products/{id}`. |
| RF-024 | Cambiar precio de producto | ✅ Hecho | 100 % | Campo `price` editable con validación en `PATCH /company/products/{id}`. |
| RF-025 | Gestionar inventario | 🟡 Parcial | 70 % | El `stock` se define y edita con validación (no negativo); falta historial de movimientos y alertas de stock bajo. |
| RF-026 | Subir imágenes de producto | ✅ Hecho | 100 % | `POST /company/products/upload-image`. |
| RF-027 | Organizar categorías | 🟡 Parcial | 40 % | Catálogos solo de lectura (`GET /products/catalogs`) y asignables al producto; no hay alta, edición ni reorden de categorías. |
| RF-028 | Gestionar atributos de producto | ❌ No implementado | 0 % | Sin modelo ni endpoint de atributos. Fuera de alcance; deuda técnica. |
| RF-029 | Duplicar producto | ❌ No implementado | 0 % | Sin endpoint de duplicado. Fuera de alcance; el producto se puede volver a crear manualmente. |
| RF-030 | Publicar o despublicar producto | ✅ Hecho | 100 % | `PATCH /company/products/{id}/status`. |

### Catálogo

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-031 | Buscar productos | ✅ Hecho | 100 % | `GET /products/search?q=`. |
| RF-032 | Filtrar productos | ✅ Hecho | 100 % | `GET /products/search` con `categoria`, `min`, `max` y `company_id`. |
| RF-033 | Ordenar resultados | ✅ Hecho | 100 % | Parámetro `orden` (precio y nombre, asc/desc). |
| RF-034 | Ver detalle de producto | ✅ Hecho | 100 % | `GET /products/{id}`. |
| RF-035 | Ver productos relacionados | ✅ Hecho | 100 % | `GET /products/{id}/related`. |
| RF-036 | Ver productos destacados | 🟡 Parcial | 50 % | Hay sección de destacados en `Home.tsx`, pero el backend no tiene criterio ni endpoint de destacados. |
| RF-037 | Ver productos nuevos | 🟡 Parcial | 30 % | Sin endpoint ni orden por fecha de creación; solo se listan productos en general. |
| RF-038 | Agregar a favoritos | ✅ Hecho | 100 % | `POST /favorites/{product_id}` (alterna) y `GET /favorites`. |
| RF-039 | Eliminar de favoritos | ✅ Hecho | 100 % | El mismo `POST /favorites/{product_id}` elimina si ya existe. |
| RF-040 | Compartir producto | ❌ No implementado | 0 % | No se encontró código de compartir en el frontend ni en el backend. Verificar en la app antes de entregar. |
| RF-067 | Ver reseñas de producto | ✅ Hecho | 100 % | `GET /products/{id}/reviews`. |
| RF-068 | Crear reseña de producto | ✅ Hecho | 100 % | `POST /products/{id}/reviews`. |

### Carrito de Compras

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-041 | Agregar al carrito | ✅ Hecho | 100 % | `POST /cart/items`. |
| RF-042 | Ver carrito de compras | ✅ Hecho | 100 % | `GET /cart`. |
| RF-043 | Modificar cantidad de productos en el carrito | ✅ Hecho | 100 % | `PATCH /cart/items/{product_id}`. |
| RF-044 | Eliminar producto del carrito | ✅ Hecho | 100 % | `DELETE /cart/items/{product_id}`. |
| RF-045 | Vaciar carrito | ✅ Hecho | 100 % | `DELETE /cart`. |
| RF-046 | Calcular total del carrito | ✅ Hecho | 100 % | Total calculado en `GET /cart`. |
| RF-047 | Aplicar cupón de descuento | ❌ No implementado | 0 % | Sin modelo de cupones ni endpoint. Fuera de alcance; deuda técnica. |
| RF-048 | Eliminar cupón de descuento | ❌ No implementado | 0 % | Depende de RF-047, no implementado. |
| RF-049 | Guardar carrito de compras | 🟡 Parcial | 80 % | El carrito persiste por usuario en BD y hay `POST /cart/merge` para el carrito de invitado; no hay carritos guardados con nombre. |
| RF-050 | Proceder al pago | 🟡 Parcial | 60 % | `POST /user/orders` crea el pedido con `payment_method`; el pago es simulado, sin pasarela real. |

### Pedidos

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-051 | Crear pedido | ✅ Hecho | 100 % | `POST /user/orders`. |
| RF-052 | Ver historial de pedidos | ✅ Hecho | 100 % | `GET /user/orders`. |
| RF-053 | Ver detalle del pedido | ✅ Hecho | 100 % | `GET /user/orders/{id}`. |
| RF-054 | Cancelar pedido | ✅ Hecho | 100 % | `PATCH /user/orders/{id}/cancel`. |
| RF-055 | Solicitar devolución | ❌ No implementado | 0 % | Sin modelo ni endpoint de devoluciones. Fuera de alcance; deuda técnica. |
| RF-056 | Confirmar recepción de pedido | 🟡 Parcial | 40 % | La empresa cambia el estado con `PATCH /company/orders/{id}/status`; el cliente no puede confirmar la recepción. |
| RF-057 | Descargar factura | ✅ Hecho | 100 % | `GET /user/orders/{id}/invoice`. |
| RF-058 | Calificar pedido | 🟡 Parcial | 30 % | Se pueden calificar productos con reseñas (RF-068); no hay calificación del pedido completo. |
| RF-059 | Abrir reclamación | 🟡 Parcial | 50 % | Se puede registrar una solicitud por PQRS (`POST /pqrs`); no está ligada a un pedido concreto. |
| RF-060 | Hacer seguimiento de pedido | ✅ Hecho | 100 % | El detalle del pedido devuelve `status` y `delivery_progress`. |

### Administración

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-061 | Panel de administración | ✅ Hecho | 100 % | `GET /admin/dashboard/me`. |
| RF-062 | Gestionar usuarios | ✅ Hecho | 100 % | `GET /admin/users` y `PATCH /admin/users/{id}/toggle-status`. |
| RF-063 | Validar empresas | ✅ Hecho | 100 % | `PATCH /admin/companies/{id}/validate` y `toggle-status`. |
| RF-064 | Gestionar PQRS | ✅ Hecho | 100 % | `GET /admin/pqrs` y `PATCH /admin/pqrs/{id}/status`. |

### Soporte

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-065 | Enviar PQRS | ✅ Hecho | 100 % | `POST /pqrs`. |
| RF-066 | Ver mis solicitudes PQRS | ✅ Hecho | 100 % | `GET /pqrs`. |

## Lo no alcanzado y por qué

Estos requisitos no se construyeron en esta entrega. Cada uno queda registrado como issue y como deuda técnica:

- **RF-008 Inicio de sesión con Google**: Sin endpoint ni proveedor OAuth. Fuera de alcance: requiere credenciales y consentimiento de Google; queda como deuda técnica.
- **RF-009 Autenticación en dos pasos**: Sin endpoint ni modelo de segundo factor. Fuera de alcance de esta entrega; deuda técnica.
- **RF-018 Gestionar métodos de pago**: Solo existe el campo `payment_method` dentro del pedido; no hay métodos guardados por usuario. Se mantiene pago simulado; fuera de alcance.
- **RF-028 Gestionar atributos de producto**: Sin modelo ni endpoint de atributos. Fuera de alcance; deuda técnica.
- **RF-029 Duplicar producto**: Sin endpoint de duplicado. Fuera de alcance; el producto se puede volver a crear manualmente.
- **RF-040 Compartir producto**: No se encontró código de compartir en el frontend ni en el backend. Verificar en la app antes de entregar.
- **RF-047 Aplicar cupón de descuento**: Sin modelo de cupones ni endpoint. Fuera de alcance; deuda técnica.
- **RF-048 Eliminar cupón de descuento**: Depende de RF-047, no implementado.
- **RF-055 Solicitar devolución**: Sin modelo ni endpoint de devoluciones. Fuera de alcance; deuda técnica.

Los requisitos parciales (🟡) se completarían primero en la hoja de ruta a etapa productiva, empezando por los que más pesan en el flujo de compra: RF-050 (pago real), RF-056 (confirmar recepción) y RF-010 (gestión de sesiones).

## Consideraciones

- El pago se mantiene **simulado**; esto se aclara en el manual de usuario.
- Las pruebas automatizadas del móvil quedan registradas como deuda técnica.
