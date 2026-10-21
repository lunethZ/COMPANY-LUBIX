# 🏢 LUBIX - Plataforma de Gestión Empresarial

**Solución integral de gestión de usuarios, empresas y productos**

Repositorio principal del código fuente de la compañía Lubix.
---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Ejecución del Proyecto](#ejecución-del-proyecto)
- [Documentación](#documentación)
- [Versionado](#versionado)

---

## 📝 Descripción General

**LUBIX** es una plataforma completa de gestión empresarial que integra:

- **Backend** — API REST robusta construida con FastAPI y Python 3.13
- **Frontend** — Interfaz de usuario moderna con React, TypeScript y Tailwind CSS
- **Base de Datos** — PostgreSQL para almacenamiento relacional
- **Almacenamiento** — MinIO para gestión de archivos e imágenes
- **Autenticación** — Sistema seguro con JWT y bcrypt
- **Comunicaciones** — Envío de correos mediante SMTP

Esta arquitectura permite escalabilidad horizontal, mantenibilidad y una experiencia de usuario excepcional.

---

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- ✅ Registro de usuarios
- ✅ Inicio de sesión con JWT (JSON Web Tokens)
- ✅ Middleware de autenticación segura
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Recuperación de contraseña mediante correo electrónico
- ✅ Verificación de cuenta por correo electrónico
- ✅ Tokens de refresco automático

### 👥 Gestión de Usuarios
- ✅ CRUD completo de usuarios
- ✅ Gestión de roles y permisos
- ✅ Perfiles de usuario personalizables
- ✅ Auditoría de actividades

### 🏢 Gestión de Empresas
- ✅ Creación y gestión de empresas
- ✅ Gestión de catálogos de productos
- ✅ Dashboard analítico en tiempo real
- ✅ Gestión de códigos y promociones

### 📦 Gestión de Productos
- ✅ CRUD de productos
- ✅ Gestión de categorías
- ✅ Almacenamiento de imágenes en MinIO
- ✅ Información detallada de productos

### 🛒 Carrito de Compras
- ✅ Gestión de carritos
- ✅ Cálculo dinámico de totales
- ✅ Gestión de pedidos

### 🎨 Experiencia de Usuario
- ✅ Tema claro/oscuro automático
- ✅ Interfaz responsiva
- ✅ Diseño moderno con Tailwind CSS
- ✅ Componentes reutilizables

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Python** | 3.13 | Lenguaje principal |
| **FastAPI** | 0.135.1 | Framework web |
| **Uvicorn** | ASGI | Servidor web |
| **SQLAlchemy** | ORM | Manejo de base de datos |
| **Alembic** | Migraciones | Control de esquema de BD |
| **PostgreSQL** | 16 | Base de datos relacional |
| **psycopg2** | Driver | Conexión a PostgreSQL |
| **Pydantic** | 2.12.5 | Validación de datos |
| **python-jose** | JWT | Tokens de autenticación |
| **bcrypt** | 3.2.2 | Hash de contraseñas |
| **python-dotenv** | Variables de entorno | Configuración |
| **MinIO SDK** | 7.2.20 | Almacenamiento de archivos |
| **smtplib** | SMTP | Envío de correos |
| **Docker** | Contenerización | Despliegue |
| **UV** | Gestión de dependencias | Instalación rápida |

### Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **React** | 19.2.6 | Librería UI |
| **TypeScript** | 6.0.3 | Tipado estático |
| **Vite** | 8.0.14 | Build tool |
| **React Router** | 7.15.1 | Enrutamiento |
| **Tailwind CSS** | 3.4.19 | Estilos utilitarios |
| **Axios** | 1.16.1 | Cliente HTTP |
| **PostCSS** | Procesamiento de estilos | Pre-procesador CSS |
| **Heroicons** | Iconografía | Componentes de iconos |
| **Swiper** | 12.2.0 | Carruseles |
| **Docker** | Contenerización | Despliegue |

### Infraestructura

| Servicio | Versión | Puerto | Uso |
|---------|---------|--------|-----|
| **PostgreSQL** | 16 | 5434 | Base de datos |
| **MinIO** | latest | 9000 | Almacenamiento de archivos |
| **Backend** | FastAPI | 8001 | API REST |
| **Frontend** | React | 5173* | Aplicación web |

*El puerto del frontend es configurable en Vite

---

## 📁 Estructura del Proyecto

```
LUBIX-COMPANY/
│
├── 📄 README.md                          # Este archivo - Documentación principal
├── 📄 docker-compose.yml                 # Orquestación de contenedores
│
├── 📁 backend/                           # API Backend
│   ├── 📄 main.py                        # Punto de entrada
│   ├── 📄 pyproject.toml                 # Dependencias del proyecto
│   ├── 📄 Dockerfile                     # Contenedor del backend
│   ├── 📄 alembic.ini                    # Configuración de migraciones
│   ├── 📄 README.md                      # Documentación del backend
│   ├── 📄 CHANGELOG.md                   # Histórico de cambios
│   │
│   ├── 📁 app/
│   │   ├── 📄 main.py                    # Aplicación FastAPI
│   │   ├── 📄 Config.py                  # Configuración global
│   │   │
│   │   ├── 📁 database/
│   │   │   └── 📄 Connection.py          # Conexión a PostgreSQL
│   │   │
│   │   ├── 📁 models/                    # Modelos SQLAlchemy
│   │   │   ├── 📄 ModelUser.py
│   │   │   ├── 📄 ModelCompany.py
│   │   │   ├── 📄 ModelProduct.py
│   │   │   ├── 📄 ModelRole.py
│   │   │   ├── 📄 ModelCode.py
│   │   │   └── 📄 ModelRefreshToken.py
│   │   │
│   │   ├── 📁 schemas/                   # Esquemas Pydantic
│   │   │   ├── 📄 SchemaAuthUser.py
│   │   │   ├── 📄 SchemaAuthCompany.py
│   │   │   ├── 📄 SchemaProduct.py
│   │   │   └── 📁 dashboard/
│   │   │       └── 📄 SchemaCompany.py
│   │   │
│   │   ├── 📁 routers/                   # Rutas API
│   │   │   ├── 📄 AuthRouters.py         # Autenticación
│   │   │   ├── 📄 CompanyRouter.py       # Gestión de empresas
│   │   │   ├── 📄 CardRouters.py         # Carrito de compras
│   │   │   └── 📄 HealthRouter.py        # Health check
│   │   │
│   │   ├── 📁 services/                  # Lógica de negocio
│   │   │   ├── 📁 authentication/
│   │   │   │   ├── 📄 AuthService.py
│   │   │   │   └── 📄 JWTService.py
│   │   │   ├── 📁 email/
│   │   │   │   ├── 📄 EmailService.py
│   │   │   │   ├── 📄 SaveAndGenerateCode.py
│   │   │   │   └── 📁 template/
│   │   │   │       ├── 📄 EmailRegisterUser.py
│   │   │   │       ├── 📄 EmailRegisterCompany.py
│   │   │   │       ├── 📄 EmailVerify.py
│   │   │   │       └── 📄 EmailForgotPassword.py
│   │   │   ├── 📁 CompanyServices/
│   │   │   │   ├── 📄 Dasboard.py
│   │   │   │   └── 📄 Products.py
│   │   │   └── 📄 NasService.py          # Gestión de MinIO
│   │   │
│   │   ├── 📁 middleware/
│   │   │   ├── 📄 AuthMiddleware.py      # Validación de JWT
│   │   │   └── 📄 CorsMiddleware.py      # CORS
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── 📄 Security.py            # Utilidades de seguridad
│   │   │   ├── 📄 CheckNetwork.py        # Validaciones de red
│   │   │   ├── 📄 Config.py              # Configuración
│   │   │   ├── 📄 seed.py                # Datos iniciales
│   │   │   └── 📄 TestDatabase.py        # Pruebas de BD
│   │   │
│   │   └── 📁 docs/
│   │       ├── 📄 ENDPOINTS.md           # Documentación de endpoints
│   │       └── 📄 AUDITORIA.md           # Auditoría del sistema
│   │
│   └── 📁 alembic/                       # Migraciones de BD
│       ├── 📄 env.py
│       ├── 📄 script.py.mako
│       └── 📁 versions/
│           ├── 📄 8604d5f49af7_initial_migration.py
│           └── 📄 ebac4a669c65_add_new_table_product_and_catalog.py
│
├── 📁 frontend/                          # Aplicación React
│   ├── 📄 package.json                   # Dependencias npm
│   ├── 📄 pnpm-lock.yaml                 # Lock file
│   ├── 📄 vite.config.ts                 # Configuración Vite
│   ├── 📄 tailwind.config.js             # Configuración Tailwind
│   ├── 📄 tsconfig.json                  # Configuración TypeScript
│   ├── 📄 index.html                     # HTML principal
│   ├── 📄 Dockerfile                     # Contenedor del frontend
│   ├── 📄 README.md                      # Documentación del frontend
│   ├── 📄 eslint.config.js               # Configuración ESLint
│   ├── 📄 postcss.config.cjs             # Configuración PostCSS
│   │
│   ├── 📁 public/                        # Recursos estáticos
│   │
│   └── 📁 src/
│       ├── 📄 main.tsx                   # Punto de entrada
│       ├── 📄 App.tsx                    # Componente raíz
│       ├── 📄 index.css                  # 🎨 Estilos globales + Variables CSS
│       ├── 📄 App.css
│       │
│       ├── 📁 components/                # Componentes reutilizables
│       │   └── 📄 navbar.tsx
│       │
│       ├── 📁 pages/                     # Páginas/Rutas
│       │   ├── 📄 login.tsx
│       │   ├── 📄 registrer.tsx
│       │   ├── 📄 reset-password.tsx
│       │   └── 📄 Home.tsx
│       │
│       ├── 📁 context/                   # Context API
│       │   ├── 📄 ThemeContext.tsx
│       │   ├── 📄 ThemeProvider.tsx
│       │   ├── 📄 AuthContext.tsx
│       │   └── 📄 AuthProvider.tsx
│       │
│       ├── 📁 services/                  # Servicios HTTP
│       │   └── Consumo de APIs
│       │
│       ├── 📁 types/                     # Tipos TypeScript
│       │   └── Definiciones de tipos
│       │
│       ├── 📁 constants/                 # Constantes
│       │   └── Valores globales
│       │
│       ├── 📁 assets/                    # Imágenes, iconos
│       │   └── Recursos multimedia
│       │
│       └── 📁 api/                       # Configuración de APIs
│           └── Cliente HTTP
│
└── 📁 Docs/                              # Documentación del proyecto
    ├── 📁 HUs/                           # Historias de Usuario
    │   ├── 📁 Administración/
    │   ├── 📁 Autenticación/
    │   ├── 📁 Carrito De Compras/
    │   ├── 📁 Catalogo/
    │   ├── 📁 Pedidos/
    │   ├── 📁 Perfil de Usuario/
    │   ├── 📁 Productos/
    │   └── 📁 Soporte/
    │
    ├── 📁 RFs/                           # Requisitos Funcionales
    │   ├── 📁 Administración/
    │   ├── 📁 Autenticación/
    │   ├── 📁 Carrito de Compras/
    │   ├── 📁 Catalogo/
    │   ├── 📁 Pedidos/
    │   ├── 📁 Perfil de Usuario/
    │   ├── 📁 Productos/
    │   └── 📁 Soporte/
    │
    └── 📁 RNFs/                          # Requisitos No Funcionales
        ├── RNF-001 — Tiempo de respuesta.md
        ├── RNF-002 — Concurrencia.md
        ├── RNF-003 — Autenticación segura.md
        ├── RNF-004 — Encriptación de contraseñas.md
        ├── RNF-005 — Protección contra ataques.md
        ├── RNF-006 — Escalabilidad horizontal.md
        ├── RNF-007 — Crecimiento de datos.md
        ├── RNF-008 — Disponibilidad del sistema.md
        ├── RNF-009 — Recuperación ante fallos.md
        ├── RNF-010 — Facilidad de uso.md
        ├── RNF-011 — Diseño responsivo.md
        ├── RNF-012 — Compatibilidad con navegadores.md
        ├── RNF-013 — Compatibilidad móvil.md
        ├── RNF-014 — Arquitectura modular.md
        └── RNF-015 — Registro de actividades.md
```

---

## 📋 Requisitos Previos

Antes de instalar y ejecutar el proyecto, asegúrate de tener:

### Mínimo requerido
- **Docker** (v20.10+) — [Descargar](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+) — Incluido en Docker Desktop
- **Git** — Control de versiones
- **Editor de código** — VS Code recomendado

### Desarrollo local (opcional)
- **Python 3.13** — [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** y **pnpm** — [Descargar](https://nodejs.org/) y `npm install -g pnpm`
- **PostgreSQL 16** — [Descargar](https://www.postgresql.org/download/)

---

## 🚀 Instalación y Configuración

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/RehnieyAl/lubix-company.git
cd lubix-company
```

### 2️⃣ Crear Archivo de Variables de Entorno

En la raíz del proyecto, crea un archivo `.env`:

```bash
# Linux/macOS
cp .env.example .env

# Windows
copy .env.example .env
```

### 3️⃣ Configurar Variables de Entorno

Edita el archivo `.env` y configura las siguientes variables:

#### 🗄️ PostgreSQL
```env
POSTGRES_USER=lubix_user
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=lubix_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://lubix_user:tu_password_seguro@postgres:5432/lubix_db
```

#### 🔐 JWT
```env
SECRET_KEY=tu_clave_secreta_muy_larga_y_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

#### 📧 SMTP (Gmail)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicacion
SENDER_EMAIL=tu_email@gmail.com
```

#### 📦 MinIO
```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_URL=http://minio:9000
MINIO_BUCKET=lubix
```

#### 🔧 Backend
```env
BACKEND_URL=http://localhost:8001
ENVIRONMENT=development
LOG_LEVEL=INFO
RUN_SEED=False  # Cambiar a True solo en la primera ejecución
```

⚠️ **IMPORTANTE SOBRE SEED**: La primera vez que ejecutes el proyecto, activa la seed:
```env
RUN_SEED=True
```
Después de que se complete la inicialización, apágala:
```env
RUN_SEED=False
```

### 4️⃣ Construir los Contenedores

```bash
docker compose build
```

Este comando construirá:
- Backend (FastAPI con Python 3.13)
- Frontend (React con Node.js)
- PostgreSQL
- MinIO

---

## ▶️ Ejecución del Proyecto

### Iniciar con Docker Compose

```bash
docker compose up -d
```

### Ver Estado de los Contenedores

```bash
docker compose ps
```

Deberías ver:
```
NAME                COMMAND                  SERVICE      STATUS      PORTS
lubix-postgres      postgres                 postgres     Up          0.0.0.0:5434->5432/tcp
lubix-minio         minio server /data       minio        Up          0.0.0.0:9000->9000/tcp
lubix-backend       uvicorn app.main:app    backend      Up          0.0.0.0:8001->8000/tcp
lubix-frontend      npm run dev              frontend     Up          0.0.0.0:5173->5173/tcp
```

### Ver Logs

```bash
# Ver todos los logs
docker compose logs -f

# Ver solo del backend
docker compose logs -f backend

# Ver solo del frontend
docker compose logs -f frontend

# Ver solo de PostgreSQL
docker compose logs -f postgres
```

### Acceder a los Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🌐 Frontend | [http://localhost:5173](http://localhost:5173) | Aplicación React |
| 📡 Backend API | [http://localhost:8001](http://localhost:8001) | API FastAPI |
| 📚 API Docs | [http://localhost:8001/docs](http://localhost:8001/docs) | Swagger UI |
| 🗄️ MinIO | [http://localhost:9000](http://localhost:9000) | Almacenamiento de archivos |

### Ejecutar Migraciones de Base de Datos

#### Primera ejecución (crear esquema):

```bash
docker compose exec backend uv run alembic revision --autogenerate -m "Initial migration"
docker compose exec backend uv run alembic upgrade head
```

#### Ejecuciones posteriores:

```bash
docker compose exec backend uv run alembic upgrade head
```

### Detener Contenedores

```bash
docker compose down
```

### Eliminar Todo (incluido volúmenes)

```bash
docker compose down -v
```

---

## 🛑 Desarrollo Local (sin Docker)

Si prefieres desarrollar sin Docker:

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Instalar dependencias
uv pip install -r requirements.txt

# Ejecutar servidor
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend

# Instalar dependencias
pnpm install

# Ejecutar servidor de desarrollo
pnpm run dev

# Compilar para producción
pnpm run build
```

---

## 📚 Documentación

### 📖 Documentación del Backend
Ver [backend/README.md](backend/README.md) para detalles sobre:
- Estructura de carpetas
- Modelos de datos
- Servicios y utilidades
- Configuración de variables de entorno

### 📖 Documentación del Frontend
Ver [frontend/README.md](frontend/README.md) para detalles sobre:
- Sistema de colores y temas
- Componentes reutilizables
- Context API
- Guía de estilos

### 📖 Endpoints de API
Ver [backend/app/docs/ENDPOINTS.md](backend/app/docs/ENDPOINTS.md) para:
- Listado completo de endpoints
- Parámetros de entrada/salida
- Ejemplos de uso

### 📖 Auditoría del Sistema
Ver [backend/app/docs/AUDITORIA.md](backend/app/docs/AUDITORIA.md) para:
- Registro de actividades
- Historial de cambios
- Logs del sistema

### 📋 Historias de Usuario
Ver carpeta [Docs/HUs/](Docs/HUs/) para las historias de usuario de cada módulo

### 📋 Requisitos Funcionales
Ver carpeta [Docs/RFs/](Docs/RFs/) para los requisitos funcionales detallados

### 📋 Requisitos No Funcionales
Ver carpeta [Docs/RNFs/](Docs/RNFs/) para:
- Tiempo de respuesta
- Concurrencia
- Seguridad
- Escalabilidad
- Disponibilidad
- Y más...

---

## 🔄 Flujo de Desarrollo

### 1. Crear una rama para tu feature

```bash
git checkout -b feature/tu-feature
```

### 2. Hacer cambios

#### Backend
- Editar modelos en `backend/app/models/`
- Crear endpoints en `backend/app/routers/`
- Agregar lógica en `backend/app/services/`

#### Frontend
- Crear componentes en `frontend/src/components/`
- Crear páginas en `frontend/src/pages/`
- Agregar servicios en `frontend/src/services/`

### 3. Generar migración (si hay cambios en BD)

```bash
docker compose exec backend uv run alembic revision --autogenerate -m "Descripción del cambio"
```

### 4. Hacer commit

```bash
git add .
git commit -m "feat: descripción del cambio"
```

### 5. Push a rama

```bash
git push origin feature/tu-feature
```

### 6. Crear Pull Request

Crea un PR con descripción clara de los cambios

---

## 🐛 Troubleshooting

### Error: "Puerto ya está en uso"

```bash
# Cambiar puertos en docker-compose.yml o en .env
# Por ejemplo, cambiar 8001 a 8002:
ports:
  - "8002:8000"
```

### Error: "No se puede conectar a la base de datos"

```bash
# Verificar que PostgreSQL esté corriendo
docker compose logs postgres

# Revisar variables de entorno en .env
# Asegúrate que DATABASE_URL sea correcto
```

### Error: "MinIO no responde"

```bash
# Ver logs de MinIO
docker compose logs minio

# Reiniciar MinIO
docker compose restart minio
```

### Error: "Frontend no carga"

```bash
# Limpiar caché y pnpm
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run dev
```

### Limpiar todo y empezar de cero

```bash
# Eliminar todos los contenedores y volúmenes
docker compose down -v

# Reconstruir desde cero
docker compose build --no-cache
docker compose up -d
```

---

## 🔐 Seguridad

Este proyecto implementa varias capas de seguridad:

✅ **JWT** — Tokens de autenticación seguros con expiración  
✅ **bcrypt** — Hash de contraseñas con salt  
✅ **CORS** — Control de acceso entre dominios  
✅ **Rate Limiting** — Protección contra ataques de fuerza bruta  
✅ **HTTPS** — Recomendado para producción  
✅ **Validación** — Pydantic valida todos los inputs  
✅ **SQL Injection** — SQLAlchemy previene inyecciones  

⚠️ **Para producción:**
- Cambiar `ENVIRONMENT=production`
- Usar HTTPS obligatoriamente
- Cambiar `SECRET_KEY` a un valor único y fuerte
- Cambiar todas las contraseñas por defecto
- Habilitar backup automático de BD
- Configurar logs y monitoreo

---

## 📊 Versionado

- **Versión Backend:** 1.1.1b
- **Versión Frontend:** 0.0.0
- **Versión del Proyecto:** 1.0.0

Ver [backend/CHANGELOG.md](backend/CHANGELOG.md) para historial de cambios


## 📞 Soporte

Para reportar bugs o solicitar features, abra un issue en el repositorio.

---

## 📄 Licencia

Este proyecto es propiedad de LUBIX-COMPANY. Todos los derechos reservados.
