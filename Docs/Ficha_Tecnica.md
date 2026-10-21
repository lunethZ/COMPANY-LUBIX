# Ficha Técnica y Requisitos de Hardware — Lubix

> Documento complementario de [`BC-Implantacion.md`](./BC-Implantacion.md).

## Metadatos del documento

| Campo | Valor |
|-------|-------|
| Nombre del sistema | LUBIX — Plataforma de Gestión Empresarial |
| Repositorio / módulo | Mobil Lubix Authentication |
| Repositorio (URL) | https://github.com/RehnieyAl/lubix-company.git |
| Versión del sistema | 1.0.0 |
| Versión Backend | 1.1.1b |
| Versión Frontend | 0.0.0 |
| Versión del documento | 0.1.0 (borrador) |
| Estado | Borrador |
| Fecha de creación | 2026-10-18 |
| Última actualización | 2026-10-18 |
| Autor(es) | <!-- TODO: nombre(s) del autor/responsable --> |
| Revisado por | <!-- TODO --> |
| Aprobado por | <!-- TODO --> |
| Clasificación de la información | Interno |
| Entornos cubiertos | Desarrollo · Staging · Producción |
| Idioma | Español |

---

## 1. Resumen del sistema

**LUBIX** es una plataforma de gestión empresarial (marketplace) que integra autenticación de usuarios y
empresas, catálogo y publicación de productos, carrito de compras, pedidos, reseñas, PQRS y paneles de
administración/dashboard. Se compone de una API REST, una aplicación web y una aplicación móvil
compartiendo la misma base de datos y almacenamiento de objetos.

- **Alcance:** backend (FastAPI), frontend web (React) y app móvil (Expo/React Native).
- **Base de datos:** PostgreSQL 16 (relacional).
- **Almacenamiento de archivos:** MinIO (compatible con S3).
- **Autenticación:** JWT + hash de contraseñas (bcrypt/argon2).
- **Correo transaccional:** SMTP (Gmail).

---

## 2. Arquitectura y componentes

Arquitectura cliente–servidor de tres capas, desplegada con contenedores Docker.

| Capa | Componente | Descripción |
|------|------------|-------------|
| Presentación | `frontend/` | Aplicación web React + TypeScript + Vite |
| Presentación | `mobile/` | Aplicación móvil Expo / React Native |
| Aplicación | `backend/` | API REST FastAPI (Python 3.13) |
| Datos | `postgres` | Base de datos PostgreSQL 16 |
| Datos | `minio` | Almacenamiento de objetos (imágenes, archivos) |

Componentes internos del backend: `routers/` (endpoints), `services/` (lógica de negocio),
`models/` (SQLAlchemy), `schemas/` (Pydantic), `middleware/` (Auth JWT, CORS) y `alembic/` (migraciones).

---

## 3. Tecnologías y versiones

### 3.1 Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.13 (>=3.13) | Lenguaje principal |
| FastAPI | 0.135.1 | Framework web |
| Uvicorn | 0.41.0 | Servidor ASGI |
| SQLAlchemy | 2.0.48 | ORM |
| Alembic | 1.18.4 | Migraciones de BD |
| Pydantic | 2.12.5 | Validación de datos |
| psycopg2-binary | 2.9.11 | Driver PostgreSQL |
| python-jose | 3.5.0 | Tokens JWT |
| bcrypt | 3.2.2 | Hash de contraseñas |
| passlib | 1.7.4 / argon2-cffi 25.1.0 | Hashing/verificación |
| MinIO SDK | 7.2.20 | Almacenamiento de archivos |
| python-dotenv | 1.2.2 | Variables de entorno |
| python-multipart | >=0.0.27 | Carga de archivos |
| sentry-sdk | 2.54.0 | Monitoreo de errores |

### 3.2 Frontend web

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19.2.6 | Librería UI |
| react-dom | 19.2.6 | Render DOM |
| TypeScript | 6.0.3 | Tipado estático |
| Vite | 8.0.14 | Build tool / dev server |
| React Router | 7.15.1 | Enrutamiento |
| Tailwind CSS | 3.4.19 | Estilos |
| Axios | 1.16.1 | Cliente HTTP |
| @heroicons/react | 2.2.0 | Iconografía |
| PostCSS | 8.5.15 / autoprefixer 10.5.0 | Procesamiento CSS |
| ESLint | 10.4.0 | Linter |

### 3.3 Móvil (Expo / React Native)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Expo | ^54.0.0 | Plataforma |
| React Native | 0.81.5 | Framework móvil |
| React | 19.1.0 | Librería UI |
| React Navigation | ^7.x | Navegación |
| Axios | 1.16.1 | Cliente HTTP |
| expo-secure-store | ~15.0.8 | Almacenamiento seguro |
| AsyncStorage | 2.2.0 | Persistencia |
| TypeScript | ~5.9.2 | Tipado |

### 3.4 Infraestructura

| Servicio | Imagen / Tecnología | Versión |
|----------|---------------------|---------|
| PostgreSQL | `postgres` | 16 |
| MinIO | `minio/minio` | latest |
| Contenedores | Docker + Docker Compose | v2 |
| Gestor de deps (backend) | UV | — |
| Gestor de deps (frontend) | pnpm | Node.js 18+ |

---

## 4. Puertos y exposición de servicios

Puertos definidos en `docker-compose.yml` (formato `host:contenedor`):

| Servicio | Puerto host | Puerto contenedor | URL de acceso |
|----------|-------------|-------------------|---------------|
| Frontend web | 5173 | 5173 | http://localhost:5173 |
| Backend API | 8002 | 8000 | http://localhost:8002 |
| Backend – Swagger | 8002 | 8000 | http://localhost:8002/docs |
| PostgreSQL | 5435 | 5432 | `postgres:5432` (interno) |
| MinIO – API (S3) | 9100 | 9000 | http://localhost:9100 |
| MinIO – Consola | 9101 | 9001 | http://localhost:9101 |
| Móvil – Metro/Expo | 8081 | 8081 | http://localhost:8081 |

> El frontend consume la API mediante `VITE_API_URL` (por defecto `http://localhost:8002`) y la app
> móvil mediante `EXPO_PUBLIC_API_URL`. Ajustar según el entorno de despliegue.

---

## 5. Integraciones y dependencias externas

| Integración | Descripción | Configuración |
|-------------|-------------|---------------|
| PostgreSQL 16 | Base de datos relacional | `URL_DATABASE`, `POSTGRES_*` |
| MinIO | Almacenamiento de objetos (imágenes de productos, logos, banners) | `MINIO_ROOT_USER/PASSWORD`, bucket interno |
| SMTP (Gmail) | Envío de correos de verificación y recuperación | `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD` |
| JWT | Autenticación basada en tokens | `SECRET_KEY`, `ALGORITHM=HS256` |
| Sentry (opcional) | Observabilidad de errores | SDK `sentry-sdk` |

Dependencias principales resueltas vía `backend/pyproject.toml` (UV) y `frontend|mobile/package.json` (pnpm/npm).

---

## 6. Requisitos previos (hardware, software, red)

### 6.1 Requisitos de hardware (mínimos)

| Perfil | CPU | RAM | Disco | Notas |
|--------|-----|-----|-------|-------|
| Cliente (navegador web) | 2 núcleos | 2 GB | — | Navegador moderno (Chrome/Edge/Firefox) |
| Desarrollo local (Docker, 5 contenedores + build) | 4 vCPU | 8 GB (recomendado 16 GB) | 30 GB libres | Docker Desktop / Docker Engine |
| Producción (nodo único mínimo) | 4 vCPU | 8 GB | 50 GB SSD | Backend + BD + MinIO |
| Producción (recomendado) | 8 vCPU | 16 GB | 100 GB SSD | Permite escala horizontal |

> Valores de referencia; deben validarse con pruebas de carga antes del despliegue definitivo
> (ver RNF-006 Escalabilidad, RNF-007 Crecimiento de datos y RNF-008 Disponibilidad).

### 6.2 Requisitos de software

| Software | Versión mínima | Requerido para |
|----------|----------------|----------------|
| Docker | v20.10+ | Contenerización |
| Docker Compose | v2.0+ | Orquestación |
| Git | — | Control de versiones |
| Python | 3.13+ | Ejecución local del backend |
| UV | — | Gestión de dependencias backend |
| Node.js | 18+ | Frontend web / móvil |
| pnpm | — | Dependencias frontend |
| PostgreSQL | 16 | Si no se usa el contenedor |

### 6.3 Requisitos de red

- Puertos a exponer según el entorno (ver §4).
- Acceso saliente a Gmail SMTP (`smtp.gmail.com:587`) para correo.
- En despliegue productivo, HTTPS obligatorio (recomendado proxy inverso).
- Para desarrollo móvil, la API debe ser accesible desde la red local (`LAN_IP`).
