<div align="center">

<img src="docs/assets/lubix-banner.png" alt="LUBIX - Plataforma Integral de Gestión Empresarial" width="100%" />

## Stack Tecnológico

### Backend & Datos

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009485?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-2F4B7C?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92062?style=for-the-badge&logo=pydantic&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white)

### Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### DevOps, Cloud & Testing

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45BA4B?style=for-the-badge)

</div>

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Capacidades Principales del Sistema](#capacidades-principales-del-sistema)
3. [Arquitectura y Stack Tecnológico](#arquitectura-y-stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Requisitos Previos](#requisitos-previos)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [Despliegue y Ejecución](#despliegue-y-ejecución)
8. [Entorno de Desarrollo Local](#entorno-de-desarrollo-local)
9. [Pruebas](#pruebas)
10. [Flujo de Desarrollo](#flujo-de-desarrollo)
11. [Resolución de Problemas](#resolución-de-problemas)
12. [Seguridad](#seguridad)
13. [Documentación y Referencias](#documentación-y-referencias)
14. [Versionado y Soporte](#versionado-y-soporte)

---

## Resumen Ejecutivo

**LUBIX** es una plataforma de gestión empresarial de alto rendimiento diseñada para la administración integral de organizaciones. Su arquitectura se fundamenta en los siguientes pilares:

*   **Backend:** API REST robusta desarrollada con FastAPI y Python 3.13, optimizada para procesamiento asíncrono.
*   **Frontend:** Interfaz de usuario de última generación construida sobre React, TypeScript y Tailwind CSS.
*   **Persistencia de Datos:** Almacenamiento relacional garantizado mediante PostgreSQL.
*   **Gestión de Activos:** Administración de archivos multimedia a través de MinIO.
*   **Seguridad:** Sistema de autenticación de grado industrial utilizando JWT (JSON Web Tokens) y cifrado bcrypt.
*   **Notificaciones:** Servicio de mensajería integrado mediante protocolo SMTP.

Esta infraestructura modular garantiza escalabilidad horizontal, alta disponibilidad y un mantenimiento eficiente a lo largo del ciclo de vida del software.

---

## Capacidades Principales del Sistema

**Autenticación y Control de Acceso**

*   Registro seguro e inicio de sesión unificado mediante JWT.
*   Middleware de validación de identidad.
*   Cifrado de credenciales mediante algoritmos bcrypt.
*   Flujos de verificación de cuenta y recuperación de contraseña vía correo electrónico.
*   Gestión automatizada de tokens de refresco.

**Administración de Usuarios y Perfiles**

*   Módulo completo (CRUD) para la gestión de usuarios.
*   Asignación de roles y control granular de permisos.
*   Personalización avanzada de perfiles.
*   Trazabilidad y auditoría de actividades en el sistema.

**Gestión Organizacional (Empresas)**

*   Creación, configuración y monitoreo de entidades empresariales.
*   Administración de catálogos de servicios y productos.
*   Panel de control (Dashboard) con métricas analíticas en tiempo real.
*   Gestión de promociones y códigos de descuento.

**Gestión de Inventario e E-commerce**

*   Módulo completo (CRUD) para la administración de productos y categorización.
*   Almacenamiento escalable de imágenes de producto mediante MinIO.
*   Carrito de compras con cálculo dinámico de subtotales e impuestos.
*   Sistema integral de gestión y seguimiento de pedidos.

**Experiencia de Usuario (UX/UI)**

*   Arquitectura responsiva para compatibilidad multiplataforma.
*   Transición fluida entre temas de visualización (claro/oscuro).
*   Sistema de diseño coherente basado en Tailwind CSS.

---

## Arquitectura y Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **Python** | 3.13 | Lenguaje de programación principal |
| **FastAPI** | 0.135.1 | Framework de desarrollo de API REST |
| **Uvicorn** | ASGI | Servidor web asíncrono |
| **SQLAlchemy** | ORM | Mapeo objeto-relacional |
| **Alembic** | CLI | Gestión de migraciones de base de datos |
| **PostgreSQL** | 16 | Motor de base de datos relacional |
| **psycopg2** | Driver | Conector para PostgreSQL |
| **Pydantic** | 2.12.5 | Validación de esquemas y serialización |
| **python-jose** | JWT | Generación y validación de tokens |
| **bcrypt** | 3.2.2 | Algoritmo de hash de contraseñas |
| **MinIO SDK** | 7.2.20 | Cliente de integración de almacenamiento |
| **UV** | CLI | Gestor avanzado de dependencias |

### Frontend

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **React** | 19.2.6 | Librería principal de interfaces |
| **TypeScript** | 6.0.3 | Tipado estático para JavaScript |
| **Vite** | 8.0.14 | Herramienta de construcción (Build tool) |
| **React Router** | 7.15.1 | Enrutamiento de la aplicación (SPA) |
| **Tailwind CSS** | 3.4.19 | Framework de estilos utilitarios |
| **Axios** | 1.16.1 | Cliente HTTP para consumo de API |
| **Swiper** | 12.2.0 | Implementación de carruseles interactivos |

### Infraestructura y Despliegue

| Servicio | Puerto | Descripción |
| :--- | :--- | :--- |
| **PostgreSQL** | 5434 (Host) -> 5432 | Base de datos principal |
| **MinIO** | 9000 | Servidor de almacenamiento de objetos |
| **Backend (API)** | 8001 (Host) -> 8000 | Capa de servicios REST |
| **Frontend (Web)** | 5173 | Aplicación de usuario (Configurable en Vite) |

---

## Estructura del Proyecto

```text
LUBIX-COMPANY/
├── docker-compose.yml                 # Orquestación de infraestructura Docker
├── render.yaml                        # Definición del servicio en Render
├── .env.example                       # Plantilla de variables de entorno
├── README.md                          # Este archivo - Documentación principal
├── docs/                              # Recursos visuales de documentación
│   └── assets/
│       └── lubix-banner.svg           # Banner principal del README
├── Docs/                              # Documentación oficial del proyecto
│   ├── DEPLOYMENT.md                  # Guía de despliegue Render + Neon/Supabase
│   ├── HUs/                           # Historias de Usuario por módulo
│   ├── RFs/                           # Especificación de Requisitos Funcionales
│   └── RNFs/                          # Especificación de Requisitos No Funcionales
├── backend/                           # API REST (FastAPI)
│   ├── main.py                        # Punto de entrada de la aplicación
│   ├── pyproject.toml                 # Configuración de dependencias (UV)
│   ├── alembic.ini                    # Configuración de migraciones
│   ├── Dockerfile                     # Definición de contenedor Backend
│   ├── README.md                      # Documentación del backend
│   ├── CHANGELOG.md                   # Histórico de cambios
│   ├── alembic/                       # Migraciones (Alembic)
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   └── app/                           # Código fuente de la API
│       ├── Config.py                  # Configuración global
│       ├── database/                  # Conectividad de datos (Connection.py)
│       ├── models/                    # Modelos de dominio (SQLAlchemy)
│       ├── schemas/                   # Esquemas de validación (Pydantic)
│       ├── routers/                   # Controladores y rutas (Endpoints)
│       ├── services/                  # Lógica de negocio core
│       │   ├── authentication/        # AuthService.py y JWTService.py
│       │   ├── email/                 # EmailService.py y plantillas
│       │   ├── CompanyServices/       # Dashboard y productos
│       │   └── NasService.py          # Gestión de MinIO
│       ├── middleware/                # Interceptores (Autenticación, CORS)
│       ├── utils/                     # Utilidades, seguridad y seeders
│       └── docs/                      # ENDPOINTS.md y AUDITORIA.md
├── frontend/                          # Aplicación Cliente (React)
│   ├── package.json                   # Configuración y dependencias NPM
│   ├── vite.config.ts                 # Configuración del empaquetador
│   ├── tailwind.config.js             # Configuración de sistema de diseño
│   ├── tsconfig.json                  # Configuración TypeScript
│   ├── index.html                     # HTML principal
│   ├── Dockerfile                     # Definición de contenedor Frontend
│   ├── README.md                      # Documentación del frontend
│   ├── COVERAGE.md                    # Cobertura y umbrales de pruebas
│   └── src/                           # Código fuente del cliente
│       ├── components/                # Componentes de UI reutilizables
│       ├── pages/                     # Vistas y pantallas principales
│       ├── context/                   # Gestión de estado global (Context API)
│       ├── services/                  # Integración HTTP con Backend
│       ├── types/                     # Definiciones de tipado TypeScript
│       ├── constants/                 # Valores globales
│       ├── assets/                    # Recursos multimedia
│       └── api/                       # Cliente HTTP
└── mobile/                            # Cliente móvil
```

---

## Requisitos Previos

### Mínimo requerido (entorno dockerizado)

*   **Docker** (v20.10+) — [Descargar](https://www.docker.com/products/docker-desktop)
*   **Docker Compose** (v2.0+) — Incluido en Docker Desktop
*   **Git** — Control de versiones
*   **Editor de código** — VS Code recomendado

### Desarrollo local (opcional)

*   **Python 3.13** — [Descargar](https://www.python.org/downloads/)
*   **Node.js 18+** y **npm** — [Descargar](https://nodejs.org/) (npm viene incluido)
*   **PostgreSQL 16** — [Descargar](https://www.postgresql.org/download/)

---

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/RehnieyAl/lubix-company.git
cd lubix-company
```

### 2. Crear el archivo de variables de entorno

Duplique la plantilla `.env.example` en la raíz del proyecto:

```bash
# Linux/macOS
cp .env.example .env

# Windows
copy .env.example .env
```

### 3. Configurar las variables de entorno

Edite `.env` con los valores de su entorno. Las variables principales son:

#### Entorno

```env
ENVIRONMENT=development
PORT=8000
```

#### PostgreSQL

```env
POSTGRES_USER=CHANGE_ME_PG
POSTGRES_PASSWORD=CHANGE_ME_PG
POSTGRES_DB=lubix

# Cadena usada por el backend (host "postgres" en Docker local)
URL_DATABASE=postgresql+psycopg2://CHANGE_ME_PG:CHANGE_ME_PG@postgres:5432/lubix
# Alias alternativo: si URL_DATABASE está definida, tiene prioridad
# DATABASE_URL=postgresql+psycopg2://usuario:password@host:5432/db?sslmode=require

DB_SSL_MODE=require
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=2
DB_POOL_RECYCLE=300
```

> Para Neon/Supabase use la cadena del panel (por ejemplo, `...@ep-xxxx.neon.tech/lubix?sslmode=require`) y codifique con URL encoding los caracteres especiales de la contraseña (`@` -> `%40`).

#### Seguridad y JWT

```env
SECRET_KEY=CHANGE_ME_LLAVE_JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_DAYS=7
URL_FRONTEND=http://localhost:5173
CORS_ORIGINS=
```

#### MinIO / almacenamiento S3 compatible

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_MINIO
MINIO_ENDPOINT=minio:9000
MINIO_SECURE=false
MINIO_BUCKET=uploads
MINIO_AUTO_CREATE_BUCKET=true
```

#### Correo (SMTP Gmail - usar App Password)

```env
GMAIL_USERNAME=tucorreo@gmail.com
GMAIL_APP_PASSWORD=CHANGE_ME_APP_PASSWORD
```

#### Seed y frontend

```env
ADMIN_DEFAULT=admin@lubix.com
PASSWORD_DEFAULT=Admin123!
RUN_SEED=true

VITE_API_URL=https://lubix-api.onrender.com
```

> `RUN_SEED=true` solo en el primer arranque, para crear roles y el usuario administrador. Después de la inicialización, cámbielo a `false` para evitar sobreescrituras en reinicios posteriores.

### 4. Construir los contenedores

```bash
docker compose build
```

---

## Despliegue y Ejecución

### Inicializar los servicios

```bash
docker compose up -d
```

### Verificar el estado

```bash
docker compose ps
```

Salida esperada:

```text
NAME                COMMAND                  SERVICE      STATUS      PORTS
lubix-postgres      postgres                 postgres     Up          0.0.0.0:5434->5432/tcp
lubix-minio         minio server /data       minio        Up          0.0.0.0:9000->9000/tcp
lubix-backend       uvicorn app.main:app    backend      Up          0.0.0.0:8001->8000/tcp
lubix-frontend      npm run dev              frontend     Up          0.0.0.0:5173->5173/tcp
```

### Aplicar las migraciones

Es mandatario aplicar el modelo relacional a la base de datos vacía durante el primer despliegue:

```bash
# Generar la migración inicial (solo la primera vez o al modificar modelos)
docker compose exec backend uv run alembic revision --autogenerate -m "Migración inicial"

# Aplicar el esquema en la base de datos
docker compose exec backend uv run alembic upgrade head
```

### Ver los logs

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Acceder a los servicios

| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| Frontend | [http://localhost:5173](http://localhost:5173) | Aplicación React |
| Backend API | [http://localhost:8001](http://localhost:8001) | API FastAPI |
| API Docs | [http://localhost:8001/docs](http://localhost:8001/docs) | Swagger UI |
| MinIO | [http://localhost:9000](http://localhost:9000) | Almacenamiento de archivos |

> Para publicar la API en producción con Render + Neon/Supabase, sigue la [Guía de despliegue](Docs/DEPLOYMENT.md).

---

## Entorno de Desarrollo Local

Si prefiere desarrollar sin Docker:

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
uv pip install -r requirements.txt
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Pruebas

### Backend (Pytest)

```bash
cd backend
pytest
```

La suite se descubre automáticamente desde `backend/tests` (`testpaths = ["tests"]`). El umbral mínimo de cobertura es **80 %** (`fail_under = 80` en `pyproject.toml`).

### Frontend (Vitest y Playwright)

```bash
cd frontend
npm install
npm test               # Corre las pruebas una vez
npm run test:watch     # Modo observador
npm run test:coverage  # Pruebas + reporte de cobertura en coverage/
npm run test:e2e       # Pruebas end-to-end con Playwright
```

Los umbrales de cobertura por página se configuran en `coverage.thresholds` de `vite.config.ts`. Consulte [`frontend/COVERAGE.md`](frontend/COVERAGE.md) para el detalle.

---

## Flujo de Desarrollo

1.  **Aislamiento:** cree una rama derivada basada en la nomenclatura estándar.

    ```bash
    git checkout -b feature/nombre-de-la-funcionalidad
    ```

2.  **Desarrollo y migraciones:** tras alterar los modelos en `backend/app/models/`, es obligatorio generar un archivo de migración.

    ```bash
    docker compose exec backend uv run alembic revision --autogenerate -m "Detalle del modelo"
    ```

3.  **Confirmación y subida (commits atómicos):**

    ```bash
    git add .
    git commit -m "docs(readme): actualizar documentacion general del proyecto"
    git push origin feature/nombre-de-la-funcionalidad
    ```

4.  **Integración:** genere un Pull Request hacia `main` documentando el alcance de las modificaciones para revisión por pares (Code Review).

---

## Resolución de Problemas

**Conflictos de puertos de red**

Si los puertos predeterminados están ocupados, modifique el mapeo en `docker-compose.yml`. Por ejemplo, para alterar el puerto de la API: `ports: ["8002:8000"]`.

**Fallo de conexión a base de datos**

Verifique la disponibilidad del contenedor (`docker compose logs postgres`) y certifique que las credenciales de `URL_DATABASE`/`DATABASE_URL` en `.env` coinciden exactamente con la configuración de Docker.

**Reconstrucción limpia de contenedores**

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Seguridad

La arquitectura de LUBIX implementa medidas defensivas estándar de la industria:

*   **Autenticación:** implementación estricta de JWT con control de expiración.
*   **Criptografía:** almacenamiento unidireccional de contraseñas mediante bcrypt con salt aleatorio.
*   **Intercambio de origen cruzado:** políticas de CORS limitadas y explícitas.
*   **Validación de entradas:** filtrado riguroso mediante esquemas fuertemente tipados de Pydantic.
*   **Prevención de inyección:** utilización exclusiva de un ORM (SQLAlchemy) para neutralizar ataques SQL.
*   **Rate limiting y HTTPS:** protección contra fuerza bruta y transporte cifrado recomendado en producción.

**Directivas para entornos de producción**

*   Asegurar que `ENVIRONMENT` esté definida como `production`.
*   Desplegar exclusivamente bajo certificados TLS/SSL (HTTPS).
*   Aplicar rotación de credenciales predeterminadas (incluyendo MinIO y base de datos).
*   Establecer sistemas de monitoreo y copias de seguridad automatizadas de los volúmenes de PostgreSQL.

---

## Documentación y Referencias

| Recurso | Contenido |
| :--- | :--- |
| [Backend](backend/README.md) | Estructura de carpetas, modelos, servicios y configuración |
| [Frontend](frontend/README.md) | Sistema de colores y temas, componentes, Context API y guía de estilos |
| [Endpoints de API](backend/app/docs/ENDPOINTS.md) | Listado completo de endpoints, parámetros y ejemplos |
| [Auditoría del sistema](backend/app/docs/AUDITORIA.md) | Registro de actividades e historial de cambios |
| [Despliegue](Docs/DEPLOYMENT.md) | Publicación en Render con PostgreSQL en Neon/Supabase |
| [Historias de usuario](Docs/HUs/) | Historias por módulo |
| [Requisitos funcionales](Docs/RFs/) | Requisitos funcionales detallados |
| [Requisitos no funcionales](Docs/RNFs/) | Tiempo de respuesta, concurrencia, seguridad, escalabilidad y más |
| [Respaldo y restauración](Docs/Respaldo_v1_Operativo.md) | Respaldo cifrado y prueba de restauración de PostgreSQL (`scripts/pg_backup.py`) |
| [Actualizaciones, soporte, monitoreo y capacitación](Docs/Plan_Actualizaciones_Soporte_Monitoreo_Capacitacion.md) | Plan operativo consolidado: versionado y despliegue, SLA de soporte, monitoreo y guía de capacitación de usuarios |
| [Guía rápida de uso](Docs/Guia_Rapida_Usuario.md) | Pasos esenciales por rol (usuario, empresa, administrador y mesa de ayuda) |
| [FAQ de usuarios](Docs/FAQ_Usuarios.md) | Preguntas frecuentes consolidadas por perfil |
| [Entregable final de capacitación](Docs/Entrega_Final_Capacitacion.md) | Plan por roles, guía rápida, FAQ, aportes del equipo y evidencia de prueba |

---

## Versionado y Soporte

*   **Versión del Proyecto:** 1.0.0
*   **Versión del Backend API:** 1.1.1b
*   **Versión del Cliente Web:** 0.0.0

Para trazabilidad detallada de lanzamientos, consulte `backend/CHANGELOG.md`. Ante incidencias técnicas o propuestas de nuevas funcionalidades, abra un *Issue* en el repositorio institucional.

---

## Licencia

Este proyecto es propiedad de LUBIX-COMPANY. Todos los derechos reservados.
