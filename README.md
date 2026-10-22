# LUBIX - Plataforma de Gestión Empresarial

**Solución integral de gestión de usuarios, empresas y productos**

Repositorio principal del código fuente de LUBIX Company.

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
9. [Flujo de Desarrollo](#flujo-de-desarrollo)
10. [Resolución de Problemas](#resolución-de-problemas)
11. [Seguridad](#seguridad)
12. [Documentación y Referencias](#documentación-y-referencias)
13. [Versionado y Soporte](#versionado-y-soporte)

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
| **Frontend (Web)**| 5173 | Aplicación de usuario (Configurable en Vite) |

---

## Estructura del Proyecto

```text
LUBIX-COMPANY/
├── docker-compose.yml                 # Orquestación de infraestructura Docker
├── backend/                           # API REST (FastAPI)
│   ├── main.py                        # Punto de entrada de la aplicación
│   ├── pyproject.toml                 # Configuración de dependencias (UV)
│   ├── Dockerfile                     # Definición de contenedor Backend
│   ├── alembic/                       # Directorio de migraciones (Alembic)
│   └── app/                           # Código fuente de la API
│       ├── database/                  # Conectividad de datos
│       ├── models/                    # Modelos de dominio (SQLAlchemy)
│       ├── schemas/                   # Esquemas de validación (Pydantic)
│       ├── routers/                   # Controladores y rutas (Endpoints)
│       ├── services/                  # Lógica de negocio core
│       ├── middleware/                # Interceptores (Autenticación, CORS)
│       └── utils/                     # Utilidades transversales y Seeders
├── frontend/                          # Aplicación Cliente (React)
│   ├── package.json                   # Configuración y dependencias NPM
│   ├── vite.config.ts                 # Configuración del empaquetador
│   ├── tailwind.config.js             # Configuración de sistema de diseño
│   ├── Dockerfile                     # Definición de contenedor Frontend
│   └── src/                           # Código fuente del cliente
│       ├── components/                # Componentes de UI reutilizables
│       ├── pages/                     # Vistas y pantallas principales
│       ├── context/                   # Gestión de estado global (Context API)
│       ├── services/                  # Integración HTTP con Backend
│       └── types/                     # Definiciones de tipado TypeScript
└── Docs/                              # Documentación oficial del proyecto
    ├── HUs/                           # Historias de Usuario organizadas por módulo
    ├── RFs/                           # Especificación de Requisitos Funcionales
    └── RNFs/                          # Especificación de Requisitos No Funcionales
```

---

## Requisitos Previos

Para el despliegue de la infraestructura local, asegúrese de contar con las siguientes herramientas en su entorno:

**Requisitos Estándar (Entorno Dockerizado):**
*   **Docker** (v20.10 o superior)
*   **Docker Compose** (v2.0 o superior)
*   **Git**

**Requisitos Adicionales (Entorno de Desarrollo Híbrido):**
*   Python 3.13
*   Node.js 18+ y pnpm (`npm install -g pnpm`)
*   PostgreSQL 16

---

## Instalación y Configuración

**1. Clonar el Repositorio**
```bash
git clone https://github.com/RehnieyAl/lubix-company.git
cd lubix-company
```

**2. Configuración de Variables de Entorno**
Duplique el archivo de ejemplo para establecer sus parámetros locales:
```bash
# Linux/macOS
cp .env.example .env

# Windows
copy .env.example .env
```

**3. Parametrización del Archivo `.env`**
Edite el archivo `.env` garantizando la definición de las siguientes credenciales y parámetros clave:

```env
# Base de Datos
POSTGRES_USER=lubix_user
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=lubix_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://lubix_user:tu_password_seguro@postgres:5432/lubix_db

# Seguridad y Criptografía
SECRET_KEY=clave_secreta_alfanumérica_robusta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Servicios de Correo (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=contraseña_de_aplicacion_autorizada
SENDER_EMAIL=tu_email@gmail.com

# Almacenamiento de Objetos (MinIO)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_URL=http://minio:9000
MINIO_BUCKET=lubix

# Configuración del Entorno de Aplicación
BACKEND_URL=http://localhost:8001
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**Nota sobre Población de Datos Iniciales (Seed):**
Durante la instalación inicial, habilite el script de seed modificando temporalmente la variable de entorno:
```env
RUN_SEED=True
```
Una vez inicializados los datos de prueba o configuración base, revierta este valor a `False` para prevenir sobreescrituras en reinicios posteriores.

**4. Construcción de Contenedores**
```bash
docker compose build
```

---

## Despliegue y Ejecución

### Inicialización de Servicios mediante Docker
```bash
docker compose up -d
```

### Verificación de Estado
Para validar que los cuatro servicios principales operan correctamente, ejecute:
```bash
docker compose ps
```

### Ejecución de Migraciones Estructurales (Base de Datos)
Es mandatario aplicar el modelo relacional a la base de datos vacía durante el primer despliegue:

```bash
# Generación de la migración inicial (Solo primera vez o al modificar modelos)
docker compose exec backend uv run alembic revision --autogenerate -m "Migración inicial"

# Aplicación del esquema en la base de datos
docker compose exec backend uv run alembic upgrade head
```

### Accesos Directos
*   **Aplicación Web (React):** `http://localhost:5173`
*   **Documentación de API (Swagger UI):** `http://localhost:8001/docs`
*   **Consola de Administración de MinIO:** `http://localhost:9000`

---

## Entorno de Desarrollo Local

Para equipos de desarrollo que prefieran ejecutar los servicios fuera de la capa de orquestación de Docker:

**Servicios Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
uv pip install -r requirements.txt
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Servicios Frontend:**
```bash
cd frontend
pnpm install
pnpm run dev
```

---

## Flujo de Desarrollo

El ciclo de vida del código en este repositorio debe adherirse a las prácticas de integración estructurada:

1.  **Aislamiento:** Cree una rama derivada basada en la nomenclatura estándar.
    `git checkout -b feature/nombre-de-la-funcionalidad`
2.  **Desarrollo y Migraciones:** Tras alterar los modelos en `backend/app/models/`, es obligatorio generar un archivo de migración.
    `docker compose exec backend uv run alembic revision --autogenerate -m "Detalle del modelo"`
3.  **Confirmación y Subida (Commits Atómicos):**
    `git add .`
    `git commit -m "docs(readme): actualizar documentacion general del proyecto"`
    `git push origin feature/nombre-de-la-funcionalidad`
4.  **Integración:** Genere un Pull Request hacia la rama `main` documentando el alcance de las modificaciones para revisión por pares (Code Review).

---

## Resolución de Problemas

**Conflictos de Puertos de Red:**
Si los puertos predeterminados están ocupados, modifique el mapeo en el archivo `docker-compose.yml`. Por ejemplo, para alterar el puerto de la API: `ports: ["8002:8000"]`.

**Fallo de Conexión a Base de Datos:**
Verifique la disponibilidad del contenedor de base de datos (`docker compose logs postgres`) y certifique que el formato y las credenciales de la cadena `DATABASE_URL` en su `.env` coinciden exactamente con la configuración de Docker.

**Reconstrucción Limpia de Contenedores:**
En caso de inconsistencias críticas en el entorno, proceda con una reconstrucción desde cero, eliminando volúmenes de datos temporales:
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Seguridad

La arquitectura de LUBIX implementa medidas defensivas estándar de la industria:

*   **Autenticación:** Implementación estricta de JWT con control de expiración.
*   **Criptografía:** Almacenamiento unidireccional de contraseñas mediante Bcrypt con salt aleatorio.
*   **Intercambio de Origen Cruzado:** Políticas de CORS limitadas y explícitas.
*   **Validación de Entradas:** Filtrado riguroso mediante esquemas fuertemente tipados de Pydantic.
*   **Prevención de Inyección:** Utilización exclusiva de un ORM (SQLAlchemy) para neutralizar ataques SQL.

**Directivas para Entornos de Producción:**
*   Asegurar que la variable `ENVIRONMENT` esté definida como `production`.
*   Desplegar exclusivamente bajo certificados TLS/SSL (HTTPS).
*   Aplicar rotación de credenciales predeterminadas (incluyendo MinIO y Base de datos).
*   Establecer sistemas de monitoreo y copias de seguridad automatizadas para los volúmenes de PostgreSQL.

---

## Documentación y Referencias

Para obtener información técnica detallada por subdominio, consulte los siguientes recursos adjuntos en el código fuente:

*   **Documentación de Arquitectura Backend:** `backend/README.md`
*   **Documentación de Diseño Frontend:** `frontend/README.md`
*   **Especificación de Endpoints y Contratos de API:** `backend/app/docs/ENDPOINTS.md`
*   **Registro y Directrices de Auditoría:** `backend/app/docs/AUDITORIA.md`
*   **Especificación de Requisitos Formales:** Ubicados en el directorio `Docs/` (`RFs`, `RNFs` y `HUs`).

---

## Versionado y Soporte

*   **Versión del Proyecto:** 1.0.0
*   **Versión del Backend API:** 1.1.1b
*   **Versión del Cliente Web:** 0.0.0

Para trazabilidad detallada de lanzamientos, consulte el archivo `backend/CHANGELOG.md`. Ante incidencias técnicas o propuestas de nuevas funcionalidades, se requiere la apertura formal de un *Issue* en el repositorio institucional.