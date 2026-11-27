# Changelog

Registro de cambios del backend Lubix.

## [1.0.0] - 2026-11

### Added
- Pipeline de integración continua (CI) en GitHub Actions con umbral de cobertura mínimo del 80 % (pytest), análisis estático en SonarCloud y escaneo de vulnerabilidades con Trivy.
- Endpoints granulares de monitoreo y disponibilidad (/health, /health/database, /health/storage, /health/internet).
- Soporte multiproveedor de correo transaccional con Brevo (principal), Resend (respaldo) y Gmail SMTP (contingencia).
- Scripts de respaldo cifrado de PostgreSQL (scripts/pg_backup.py) y pruebas verificadas de restauración.
- Roles de base de datos con principio de mínimo privilegio (scripts/seguridad/).
- Pruebas end-to-end (E2E) con Playwright integradas al flujo de validación.

### Fixed
- Sincronización de puertos de despliegue local (8002 API, 5435 PostgreSQL, 9100/9101 MinIO) en docker-compose.yml y documentación.

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

## [1.0.0-alpha] - 2026-02

### Added
- Estructura inicial del proyecto
- Configuración de Docker
- Conexión a PostgreSQL
- Esquemas base de usuarios y empresas