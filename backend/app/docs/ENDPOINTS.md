# Referencia de Endpoints — LUBIX API

> Documentación actualizada frente a los routers activos registrados en `backend/app/main.py`.
> **Nota:** Las rutas se exponen directamente desde la raíz del servicio (sin prefijo `/api/v1/`). La especificación OpenAPI interactiva está disponible en `/docs` y `/openapi.json`.

---

## 1. Salud del Sistema (`/health`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/health` | Pública | Estado general de disponibilidad del servicio. |
| `GET` | `/health/database` | Pública | Verificación de conectividad con PostgreSQL. |
| `GET` | `/health/storage` | Pública | Verificación de conectividad con almacenamiento de objetos (MinIO / S3). |
| `GET` | `/health/internet` | Pública | Verificación de salida a internet y servicios externos. |

---

## 2. Autenticación (`/auth`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `POST` | `/auth/register-user` | Pública | Registro de cuenta de usuario cliente. |
| `POST` | `/auth/register-company` | Pública | Registro de cuenta de empresa vendedora. |
| `POST` | `/auth/verify-email-user` | Pública | Verificación de correo electrónico mediante código/token. |
| `POST` | `/auth/resend-verification` | Pública | Reenvío del correo de verificación de cuenta. |
| `POST` | `/auth/login-user` | Pública | Inicio de sesión de usuario cliente (retorna JWT y refresh token). |
| `POST` | `/auth/login-company` | Pública | Inicio de sesión de empresa (retorna JWT y refresh token). |
| `POST` | `/auth/forgot-password-user` | Pública | Solicitud de recuperación de contraseña por correo. |
| `POST` | `/auth/reset-password-user` | Pública | Restablecimiento de contraseña con token válido. |
| `POST` | `/auth/refresh` | Refresh Token | Renovación del token de acceso JWT. |
| `POST` | `/auth/logout` | Bearer JWT | Cierre de sesión e invalidación de token de actualización. |

---

## 3. Usuario Cliente (`/user`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/user/dashboard/me` | Bearer JWT (Usuario) | Obtiene los datos del perfil y resumen del usuario autenticado. |
| `PATCH` | `/user/profile` | Bearer JWT (Usuario) | Actualiza los datos personales del perfil del usuario. |
| `PATCH` | `/user/change-password` | Bearer JWT (Usuario) | Cambia la contraseña actual del usuario. |
| `DELETE` | `/user/account` | Bearer JWT (Usuario) | Elimina la cuenta del usuario autenticado. |
| `GET` | `/user/export` | Bearer JWT (Usuario) | Exporta y descarga los datos personales del usuario. |
| `GET` | `/user/addresses` | Bearer JWT (Usuario) | Lista las direcciones de envío del usuario. |
| `POST` | `/user/addresses` | Bearer JWT (Usuario) | Crea una nueva dirección de envío. |
| `PATCH` | `/user/addresses/{address_id}` | Bearer JWT (Usuario) | Actualiza una dirección existente. |
| `DELETE` | `/user/addresses/{address_id}` | Bearer JWT (Usuario) | Elimina una dirección registrada. |
| `POST` | `/user/avatar/upload` | Bearer JWT (Usuario) | Sube o actualiza la foto de perfil (avatar). |
| `POST` | `/user/banner/upload` | Bearer JWT (Usuario) | Sube o actualiza la imagen de portada (banner). |
| `POST` | `/user/orders` | Bearer JWT (Usuario) | Crea un nuevo pedido a partir del carrito de compras. |
| `GET` | `/user/orders` | Bearer JWT (Usuario) | Lista el historial de pedidos del usuario. |
| `GET` | `/user/orders/{order_id}` | Bearer JWT (Usuario) | Consulta el detalle y estado de seguimiento de un pedido. |
| `PATCH` | `/user/orders/{order_id}/cancel` | Bearer JWT (Usuario) | Cancela un pedido elegible. |
| `GET` | `/user/orders/{order_id}/invoice` | Bearer JWT (Usuario) | Descarga el comprobante/factura del pedido. |

---

## 4. Empresa Vendedora (`/company`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/company/dashboard/me` | Bearer JWT (Empresa) | Métricas y resumen general del panel de empresa. |
| `GET` | `/company/dashboard/my-profile` | Bearer JWT (Empresa) | Consulta el perfil comercial de la empresa. |
| `PATCH` | `/company/dashboard/upgrade-my-profile` | Bearer JWT (Empresa) | Actualiza la información comercial de la empresa. |
| `PATCH` | `/company/dashboard/upload-logo` | Bearer JWT (Empresa) | Sube o actualiza el logotipo de la empresa. |
| `PATCH` | `/company/dashboard/upload-banner` | Bearer JWT (Empresa) | Sube o actualiza el banner de la empresa. |
| `GET` | `/company/products` | Bearer JWT (Empresa) | Lista todos los productos propios de la empresa. |
| `GET` | `/company/products/{product_id}` | Bearer JWT (Empresa) | Obtiene el detalle de un producto propio. |
| `POST` | `/company/products` | Bearer JWT (Empresa) | Crea un nuevo producto en el inventario de la empresa. |
| `PATCH` | `/company/products/{product_id}` | Bearer JWT (Empresa) | Edita datos, precio o stock de un producto propio. |
| `PATCH` | `/company/products/{product_id}/status` | Bearer JWT (Empresa) | Publica o despublica un producto en el catálogo. |
| `DELETE` | `/company/products/{product_id}` | Bearer JWT (Empresa) | Elimina un producto propio. |
| `POST` | `/company/products/upload-image` | Bearer JWT (Empresa) | Sube imágenes asociadas a los productos de la empresa. |
| `GET` | `/company/orders` | Bearer JWT (Empresa) | Lista los pedidos recibidos por la empresa. |
| `PATCH` | `/company/orders/{order_id}/status` | Bearer JWT (Empresa) | Actualiza el estado de despacho/entrega de un pedido. |

---

## 5. Catálogo y Productos (`/products`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/products/catalogs` | Pública | Obtiene el listado de categorías y catálogos disponibles. |
| `GET` | `/products/search` | Pública | Busca, filtra (`categoria`, `min`, `max`, `company_id`) y ordena (`orden`) productos. |
| `GET` | `/products/{product_id}` | Pública | Consulta el detalle completo de un producto. |
| `GET` | `/products/{product_id}/reviews` | Pública | Lista las reseñas y calificaciones de un producto. |
| `POST` | `/products/{product_id}/reviews` | Bearer JWT (Usuario) | Publica una reseña y calificación en un producto. |
| `GET` | `/products/{product_id}/related` | Pública | Lista productos relacionados por categoría. |
| `GET` | `/products/company/{company_id}/profile` | Pública | Consulta el perfil público y catálogo de una empresa. |

---

## 6. Carrito de Compras (`/cart`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/cart` | Bearer JWT (Usuario) | Obtiene los ítems actuales y el total calculado del carrito. |
| `POST` | `/cart/items` | Bearer JWT (Usuario) | Agrega un producto al carrito. |
| `PATCH` | `/cart/items/{product_id}` | Bearer JWT (Usuario) | Modifica la cantidad de un producto en el carrito. |
| `DELETE` | `/cart/items/{product_id}` | Bearer JWT (Usuario) | Elimina un producto específico del carrito. |
| `DELETE` | `/cart` | Bearer JWT (Usuario) | Vacía completamente el carrito de compras. |
| `POST` | `/cart/merge` | Bearer JWT (Usuario) | Fusiona el carrito local de invitado con el carrito persistido del usuario. |

---

## 7. Favoritos

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/favorites` | Bearer JWT (Usuario) | Lista los productos guardados en favoritos por el usuario. |
| `POST` | `/favorites/{product_id}` | Bearer JWT (Usuario) | Alterna (agrega o elimina) un producto en favoritos. |

---

## 8. Soporte y PQRS (`/pqrs`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `POST` | `/pqrs` | Bearer JWT | Envía una nueva petición, queja, reclamo o sugerencia (PQRS). |
| `GET` | `/pqrs` | Bearer JWT | Lista las solicitudes PQRS enviadas por el usuario autenticado. |

---

## 9. Administración (`/admin`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/admin/dashboard/me` | Bearer JWT (Admin) | Obtiene indicadores globales del panel de administración. |
| `GET` | `/admin/users` | Bearer JWT (Admin) | Lista todos los usuarios registrados en la plataforma. |
| `PATCH` | `/admin/users/{user_id}/toggle-status` | Bearer JWT (Admin) | Activa o suspende la cuenta de un usuario. |
| `GET` | `/admin/companies` | Bearer JWT (Admin) | Lista todas las empresas registradas (pendientes y validadas). |
| `PATCH` | `/admin/companies/{company_id}/toggle-status` | Bearer JWT (Admin) | Activa o suspende una cuenta de empresa. |
| `PATCH` | `/admin/companies/{company_id}/validate` | Bearer JWT (Admin) | Aprueba o valida una empresa para operar en el catálogo. |
| `GET` | `/admin/pqrs` | Bearer JWT (Admin) | Lista todas las solicitudes PQRS de la plataforma. |
| `PATCH` | `/admin/pqrs/{pqrs_id}/status` | Bearer JWT (Admin) | Actualiza el estado y respuesta de una solicitud PQRS. |

---

## 10. Archivos (`/files`)

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/files/{file_path:path}` | Pública | Sirve archivos multimedia almacenados (avatares, logos, imágenes de productos). |