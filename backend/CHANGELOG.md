# Changelog

Registro de cambios del backend Lubix.

## [1.1.1b] - 2026-02

### Added
- Sistema de autenticación con JWT
- Registro e inicio de sesión de usuarios y empresas
- Verificación de correo electrónico
- Recuperación y restablecimiento de contraseña
- CRUD de productos con imágenes (MinIO)
- Gestión de carrito de compras
- Sistema de pedidos
- Dashboard analítico
- Migraciones con Alembic
- Seed de datos iniciales (roles, admin)

### Security
- Encriptación de contraseñas con bcrypt
- Tokens JWT con expiración
- Middleware de autenticación
- Validación de inputs con Pydantic

## [1.0.0] - 2026-02

### Added
- Estructura inicial del proyecto
- Configuración de Docker
- Conexión a PostgreSQL
- Esquemas base de usuarios y empresas
