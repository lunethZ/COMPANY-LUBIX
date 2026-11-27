# Backlog final — LUBIX

> Estado de los 59 requisitos funcionales (RF) vigentes frente a las 59 historias de usuario (HU) y al código del repositorio.
> Corte: 27 de noviembre de 2026. Responsable del documento: José Andrés Armenta Farías (Dev D).

## Cómo se calculó

- **Hecho (100 %)**: existe el endpoint o la función completa y se probó en la API.
- **Parcial (1–99 %)**: existe una parte; la columna de evidencia dice qué falta.
- Los 9 requisitos fuera de alcance (OAuth con Google, 2FA, métodos de pago guardados, atributos y duplicado de productos, compartir producto, cupones de descuento y devoluciones) fueron depurados del alcance de esta entrega para mantener trazabilidad 1:1 con el sistema construido.
- El porcentaje de cada módulo es el promedio de los porcentajes de sus RF vigentes. El global es el promedio de los 59.
- Base: revisión de los routers de `backend/app/routers/` y del frontend.

## Resumen

| Indicador | Valor |
|---|---|
| Total de RF vigentes | 59 |
| Hecho | 48 (81 %) |
| Parcial | 11 (19 %) |
| **Avance global** | **90 %** |

## Avance por módulo

| Módulo | RF | Hecho | Parcial | Avance |
|---|---:|---:|---:|---:|
| Autenticación | 8 | 7 | 1 | 95 % |
| Perfil de Usuario | 9 | 8 | 1 | 92 % |
| Productos | 8 | 6 | 2 | 89 % |
| Catálogo | 11 | 9 | 2 | 89 % |
| Carrito de Compras | 8 | 6 | 2 | 93 % |
| Pedidos | 9 | 6 | 3 | 80 % |
| Administración | 4 | 4 | 0 | 100 % |
| Soporte | 2 | 2 | 0 | 100 % |

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
| RF-008 | Gestión de sesiones | 🟡 Parcial | 60 % | Existen `POST /auth/refresh` y refresh token en BD; falta listar y cerrar otras sesiones activas. |

### Perfil de Usuario

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-009 | Ver perfil de usuario | ✅ Hecho | 100 % | `GET /user/dashboard/me`. |
| RF-010 | Editar perfil de usuario | ✅ Hecho | 100 % | `PATCH /user/profile`. |
| RF-011 | Cambiar foto de perfil | ✅ Hecho | 100 % | `POST /user/avatar/upload` (y banner). |
| RF-012 | Cambiar contraseña | ✅ Hecho | 100 % | `PATCH /user/change-password`. |
| RF-013 | Gestionar direcciones | ✅ Hecho | 100 % | `GET/POST/PATCH /user/addresses`. |
| RF-014 | Eliminar dirección | ✅ Hecho | 100 % | `DELETE /user/addresses/{id}`. |
| RF-015 | Configurar preferencias | 🟡 Parcial | 30 % | Solo el tema claro/oscuro en el frontend (`ThemeProvider`); no hay endpoint ni persistencia de preferencias. |
| RF-016 | Eliminar cuenta | ✅ Hecho | 100 % | `DELETE /user/account`. |
| RF-017 | Descargar datos personales | ✅ Hecho | 100 % | `GET /user/export`. |

### Productos

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-018 | Crear producto | ✅ Hecho | 100 % | `POST /company/products`. |
| RF-019 | Editar producto | ✅ Hecho | 100 % | `PATCH /company/products/{id}`. |
| RF-020 | Eliminar producto | ✅ Hecho | 100 % | `DELETE /company/products/{id}`. |
| RF-021 | Cambiar precio de producto | ✅ Hecho | 100 % | Campo `price` editable con validación en `PATCH /company/products/{id}`. |
| RF-022 | Gestionar inventario | 🟡 Parcial | 70 % | El `stock` se define y edita con validación (no negativo); falta historial de movimientos y alertas de stock bajo. |
| RF-023 | Subir imágenes de producto | ✅ Hecho | 100 % | `POST /company/products/upload-image`. |
| RF-024 | Organizar categorías | 🟡 Parcial | 40 % | Catálogos solo de lectura (`GET /products/catalogs`) y asignables al producto; no hay alta, edición ni reorden de categorías. |
| RF-025 | Publicar o despublicar producto | ✅ Hecho | 100 % | `PATCH /company/products/{id}/status`. |

### Catálogo

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-026 | Buscar productos | ✅ Hecho | 100 % | `GET /products/search?q=`. |
| RF-027 | Filtrar productos | ✅ Hecho | 100 % | `GET /products/search` con `categoria`, `min`, `max` y `company_id`. |
| RF-028 | Ordenar resultados | ✅ Hecho | 100 % | Parámetro `orden` (precio y nombre, asc/desc). |
| RF-029 | Ver detalle de producto | ✅ Hecho | 100 % | `GET /products/{id}`. |
| RF-030 | Ver productos relacionados | ✅ Hecho | 100 % | `GET /products/{id}/related`. |
| RF-031 | Ver productos destacados | 🟡 Parcial | 50 % | Hay sección de destacados en `Home.tsx`, pero el backend no tiene criterio ni endpoint de destacados. |
| RF-032 | Ver productos nuevos | 🟡 Parcial | 30 % | Sin endpoint ni orden por fecha de creación; solo se listan productos en general. |
| RF-033 | Agregar a favoritos | ✅ Hecho | 100 % | `POST /favorites/{product_id}` (alterna) y `GET /favorites`. |
| RF-034 | Eliminar de favoritos | ✅ Hecho | 100 % | El mismo `POST /favorites/{product_id}` elimina si ya existe. |
| RF-058 | Ver reseñas de producto | ✅ Hecho | 100 % | `GET /products/{id}/reviews`. |
| RF-059 | Crear reseña de producto | ✅ Hecho | 100 % | `POST /products/{id}/reviews`. |

### Carrito de Compras

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-035 | Agregar al carrito | ✅ Hecho | 100 % | `POST /cart/items`. |
| RF-036 | Ver carrito de compras | ✅ Hecho | 100 % | `GET /cart`. |
| RF-037 | Modificar cantidad de productos en el carrito | ✅ Hecho | 100 % | `PATCH /cart/items/{product_id}`. |
| RF-038 | Eliminar producto del carrito | ✅ Hecho | 100 % | `DELETE /cart/items/{product_id}`. |
| RF-039 | Vaciar carrito | ✅ Hecho | 100 % | `DELETE /cart`. |
| RF-040 | Calcular total del carrito | ✅ Hecho | 100 % | Total calculado en `GET /cart`. |
| RF-041 | Guardar carrito de compras | 🟡 Parcial | 80 % | El carrito persiste por usuario en BD y hay `POST /cart/merge` para el carrito de invitado; no hay carritos guardados con nombre. |
| RF-042 | Proceder al pago | 🟡 Parcial | 60 % | `POST /user/orders` crea el pedido con `payment_method`; el pago es simulado, sin pasarela real. |

### Pedidos

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-043 | Crear pedido | ✅ Hecho | 100 % | `POST /user/orders`. |
| RF-044 | Ver historial de pedidos | ✅ Hecho | 100 % | `GET /user/orders`. |
| RF-045 | Ver detalle del pedido | ✅ Hecho | 100 % | `GET /user/orders/{id}`. |
| RF-046 | Cancelar pedido | ✅ Hecho | 100 % | `PATCH /user/orders/{id}/cancel`. |
| RF-047 | Confirmar recepción de pedido | 🟡 Parcial | 40 % | La empresa cambia el estado con `PATCH /company/orders/{id}/status`; el cliente no puede confirmar la recepción. |
| RF-048 | Descargar factura | ✅ Hecho | 100 % | `GET /user/orders/{id}/invoice`. |
| RF-049 | Calificar pedido | 🟡 Parcial | 30 % | Se pueden calificar productos con reseñas (RF-059); no hay calificación del pedido completo. |
| RF-050 | Abrir reclamación | 🟡 Parcial | 50 % | Se puede registrar una solicitud por PQRS (`POST /pqrs`); no está ligada a un pedido concreto. |
| RF-051 | Hacer seguimiento de pedido | ✅ Hecho | 100 % | El detalle del pedido devuelve `status` y `delivery_progress`. |

### Administración

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-052 | Panel de administración | ✅ Hecho | 100 % | `GET /admin/dashboard/me`. |
| RF-053 | Gestionar usuarios | ✅ Hecho | 100 % | `GET /admin/users` y `PATCH /admin/users/{id}/toggle-status`. |
| RF-054 | Validar empresas | ✅ Hecho | 100 % | `PATCH /admin/companies/{id}/validate` y `toggle-status`. |
| RF-055 | Gestionar PQRS | ✅ Hecho | 100 % | `GET /admin/pqrs` y `PATCH /admin/pqrs/{id}/status`. |

### Soporte

| ID | Requisito | Estado | % | Evidencia o justificación |
|---|---|---|---:|---|
| RF-056 | Enviar PQRS | ✅ Hecho | 100 % | `POST /pqrs`. |
| RF-057 | Ver mis solicitudes PQRS | ✅ Hecho | 100 % | `GET /pqrs`. |

## Consideraciones y deuda técnica

- Los requisitos parciales (🟡) conforman la hoja de ruta prioritaria para etapa productiva, empezando por los de mayor impacto en el flujo de compra: RF-042 (pasarela de pago real), RF-047 (confirmación de recepción por cliente) y RF-008 (gestión avanzada de sesiones).
- El pago se mantiene **simulado** en esta versión; esto se aclara explícitamente en el manual de usuario.
- Las pruebas automatizadas del cliente móvil quedan registradas como deuda técnica.