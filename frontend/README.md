# Lubix Frontend

Frontend de la plataforma Lubix, desarrollado con React, TypeScript, Vite y Tailwind CSS.

La aplicación incluye autenticación, gestión de usuarios y empresas, un sistema de tema claro/oscuro completamente automático, y una arquitectura preparada para integrarse con el backend de Lubix.

---

## Tabla de Contenidos

- [Lubix Frontend](#lubix-frontend)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Tecnologías](#tecnologías)
  - [Características](#características)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Requisitos](#requisitos)
  - [Instalación Local](#instalación-local)
    - [1. Clonar el repositorio](#1-clonar-el-repositorio)
    - [2. Instalar dependencias](#2-instalar-dependencias)
    - [3. Ejecutar el proyecto](#3-ejecutar-el-proyecto)
  - [Ejecución con Docker](#ejecución-con-docker)
    - [Primera vez en un computador nuevo](#primera-vez-en-un-computador-nuevo)
    - [Ejecutar el contenedor desde otra máquina de la red](#ejecutar-el-contenedor-desde-otra-máquina-de-la-red)
    - [Alternativa con Docker Compose](#alternativa-con-docker-compose)
    - [Administración del Contenedor](#administración-del-contenedor)
    - [Actualizar la Aplicación](#actualizar-la-aplicación)
    - [Configuración Docker](#configuración-docker)
  - [Sistema de Tema Claro/Oscuro](#sistema-de-tema-clarooscuro)
    - [Cómo funciona](#cómo-funciona)
    - [Variables principales](#variables-principales)
    - [Lista completa de variables](#lista-completa-de-variables)
    - [Clases reutilizables](#clases-reutilizables)
  - [Scripts Disponibles](#scripts-disponibles)
  - [Rutas Principales](#rutas-principales)
  - [Solución de Problemas](#solución-de-problemas)
  - [Recursos](#recursos)

---

## Tecnologías

| Paquete | Versión | Propósito |
|---|---|---|
| React | 19.2.6 | Librería de interfaz de usuario |
| TypeScript | 6.0.3 | Seguridad de tipos |
| Vite | 8.0.14 | Build tool |
| Tailwind CSS | 3.4.19 | Estilos utilitarios |
| React Router | 7.15.1 | Enrutamiento |
| Axios | 1.16.1 | Cliente HTTP |
| PNPM | — | Gestor de paquetes |
| Docker | — | Contenedorización |

---

## Características

- Inicio de sesión y registro unificado (usuario / empresa)
- Gestión de usuarios
- Gestión de empresas
- Dashboard principal
- Tema claro y oscuro con detección automática y persistencia
- Diseño responsive
- Arquitectura escalable basada en componentes
- Preparado para integración con API REST

---

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          Componentes reutilizables (navbar, cards...)
│   ├── pages/               Páginas (login, registro, home...)
│   ├── context/             Contexto de tema, autenticación y carrito
│   ├── api/                 Cliente HTTP y servicios REST (axios)
│   ├── hooks/               Hooks personalizados
│   ├── utils/               Utilidades y formateadores
│   ├── types/               Tipos de TypeScript
│   ├── data/                Datos estáticos y catálogos de apoyo
│   ├── mocks/               Mocks usados por las pruebas
│   ├── test/                Configuración de Vitest
│   ├── assets/              Recursos multimedia
│   ├── App.tsx              Componente raíz con rutas
│   ├── main.tsx             Punto de entrada
│   └── index.css            Estilos globales y animaciones
├── e2e/                     Pruebas end-to-end (Playwright)
├── public/                  Archivos estáticos
├── package.json
├── vite.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── Dockerfile
├── COVERAGE.md              Cobertura y umbrales
└── README.md
```

---

## Requisitos

Antes de iniciar, asegúrate de tener instalado:

- Node.js 20 o superior
- npm (incluido con Node.js)
- Docker Desktop (opcional, solo si vas a usar contenedores)

Verificar instalación:

```bash
node -v
npm -v
docker --version
```

---

## Instalación Local

### 1. Clonar el repositorio

```bash
git clone <(https://github.com/lubixcompany/LUBIX-COMPANY.git)>
cd frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar el proyecto

```bash
npm run dev
```

Abrir en el navegador:

```
http://localhost:5173
```

---

## Ejecución con Docker

### Primera vez en un computador nuevo

**1. Instalar Docker Desktop**

Descargar e instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/).

Verificar:

```bash
docker --version
docker compose version
```

**2. Clonar el proyecto**

```bash
git clone <(https://github.com/lubixcompany/LUBIX-COMPANY.git)>
cd frontend
```

**3. Construir la imagen**

```bash
docker build -t frontend .
```

Este paso instala las dependencias dentro del contenedor y construye la imagen del proyecto.

**4. Crear y ejecutar el contenedor**

```bash
docker run -d -p 5173:5173 --name frontend-app frontend
```

**5. Abrir la aplicación**

```
http://localhost:5173
```

---

### Ejecutar el contenedor desde otra máquina de la red

Si quieres levantar el contenedor en un computador (por ejemplo un servidor o una laptop distinta) y acceder desde otro dispositivo de la misma red, sigue estos pasos:

**1. En la máquina que va a alojar el contenedor (host)**

Clona el repositorio, construye la imagen y levanta el contenedor igual que en la sección anterior:

```bash
git clone <(https://github.com/lubixcompany/LUBIX-COMPANY.git)>
cd frontend
docker build -t frontend .
docker run -d -p 5173:5173 --name frontend-app frontend
```

El `Dockerfile` ya expone el servidor con `--host 0.0.0.0`, lo que permite conexiones externas y no solo desde `localhost`.

**2. Identificar la IP local de la máquina host**

En Windows:

```bash
ipconfig
```

En Linux / macOS:

```bash
ifconfig
```

o

```bash
ip addr
```

Busca la dirección IPv4 de la red local, por ejemplo `192.168.1.50`.

**3. Verificar que el firewall permita el puerto**

Asegúrate de que el puerto `5173` no esté bloqueado por el firewall del sistema operativo de la máquina host.

**4. Acceder desde la otra máquina**

Desde cualquier otro dispositivo conectado a la misma red, abre en el navegador:

```
http://<IP_DE_LA_MAQUINA_HOST>:5173
```

Ejemplo:

```
http://192.168.1.50:5173
```

---

### Alternativa con Docker Compose

Para simplificar el levantamiento del contenedor, puedes crear un archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
services:
  frontend:
    build: .
    container_name: frontend-app
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped
```

Levantar el servicio:

```bash
docker compose up -d
```

Detener el servicio:

```bash
docker compose down
```

Reconstruir tras cambios en dependencias:

```bash
docker compose up -d --build
```

---

### Administración del Contenedor

**Iniciar un contenedor ya creado**

```bash
docker start frontend-app
```

**Detener el contenedor**

```bash
docker stop frontend-app
```

**Reiniciar el contenedor**

```bash
docker restart frontend-app
```

**Ver contenedores activos**

```bash
docker ps
```

**Ver todos los contenedores (incluyendo detenidos)**

```bash
docker ps -a
```

**Ver logs**

```bash
docker logs frontend-app
```

**Ver logs en tiempo real**

```bash
docker logs -f frontend-app
```

---

### Actualizar la Aplicación

Cuando se realicen cambios importantes en:

- `package.json`
- `package-lock.json`
- `Dockerfile`

es necesario reconstruir la imagen.

**1. Detener el contenedor**

```bash
docker stop frontend-app
```

**2. Eliminar el contenedor**

```bash
docker rm frontend-app
```

**3. Reconstruir la imagen**

```bash
docker build -t frontend .
```

**4. Crear nuevamente el contenedor**

```bash
docker run -d -p 5173:5173 --name frontend-app frontend
```

---

### Configuración Docker

Dockerfile actual:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
```

La bandera `--host 0.0.0.0` es la que permite que el servidor de desarrollo acepte conexiones desde fuera del propio contenedor, necesaria para acceder desde otras máquinas de la red.

---

## Sistema de Tema Claro/Oscuro

El proyecto implementa un sistema de colores centralizado basado en variables CSS, definidas en `src/index.css`.

### Cómo funciona

- Detección automática de la preferencia del sistema operativo al abrir la app.
- Cambio manual mediante un botón de luna/sol en el navbar.
- Persistencia de la elección del usuario en `localStorage`.
- Transiciones suaves entre temas.
- Actualización global de colores cambiando una sola variable, sin tocar componentes.

### Variables principales

```css
html {
  --color-bg: rgb(255, 255, 255);
  --color-text: rgb(17, 24, 39);
  --color-accent: rgb(34, 197, 94);
}

html.dark {
  --color-bg: rgb(3, 7, 18);
  --color-text: rgb(248, 250, 252);
  --color-accent: rgb(34, 197, 94);
}
```

### Lista completa de variables

| Categoría | Variables |
|---|---|
| Fondos | `--color-bg`, `--color-bg-secondary`, `--color-bg-card`, `--color-bg-input` |
| Textos | `--color-text`, `--color-text-muted` |
| Bordes | `--color-border`, `--color-border-light` |
| Botones | `--color-btn-primary`, `--color-btn-primary-hover`, `--color-btn-secondary` |
| Navbar | `--color-navbar`, `--color-navbar-border` |
| Acentos y estado | `--color-accent`, `--color-accent-light`, `--color-accent-dark`, `--color-success`, `--color-success-text`, `--color-error`, `--color-error-text` |

### Clases reutilizables

| Clase | Uso |
|---|---|
| `.page-container` | Contenedor principal de página |
| `.section-bg` | Secciones alternadas |
| `.card` | Tarjetas de contenido |
| `.input-base` | Inputs de formulario |
| `.label-base` | Labels de formularios |
| `.btn-primary` | Botón principal |
| `.btn-secondary` | Botón secundario |
| `.text-accent` | Texto principal |
| `.text-muted` | Texto secundario |
| `.popup-success` | Notificación de éxito |
| `.popup-error` | Notificación de error |
| `.divider` | Línea divisora |

Ejemplo de uso:

```tsx
function MiComponente() {
  return (
    <div className="card">
      <h1 className="text-accent">Título</h1>
      <p className="text-muted">Descripción</p>
      <button className="btn-primary">Click</button>
    </div>
  );
}
```

---

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Verifica reglas de calidad de código |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run test:coverage` | Pruebas unitarias con cobertura (v8) |
| `npm run test:e2e` | Pruebas end-to-end con Playwright |

### Pruebas

- **Unitarias:** `npm test` ejecuta Vitest una vez; `npm run test:watch` queda en modo interactivo.
- **Cobertura:** `npm run test:coverage` aplica los umbrales documentados en [COVERAGE.md](COVERAGE.md).
- **E2E:** `npm run test:e2e` levanta la app con `npm run dev` (configurado en `playwright.config.ts`) y ejecuta los flujos de `e2e/`.

---

## Rutas Principales

| Ruta | Descripción |
|---|---|
| `/` | Inicio de sesión |
| `/register` | Registro |
| `/home` | Dashboard principal |

---

## Solución de Problemas

**El puerto 5173 está ocupado**

```bash
npm run dev -- --port 3000
```

**Docker no inicia**

Verifica que Docker Desktop esté ejecutándose:

```bash
docker ps
```

**No se puede acceder al contenedor desde otra máquina**

- Confirma que el `Dockerfile` use `--host 0.0.0.0`.
- Revisa que el firewall de la máquina host permita el puerto `5173`.
- Verifica que ambas máquinas estén en la misma red.

**Dependencias dañadas**

En Linux/macOS:

```bash
rm -rf node_modules
npm install
```

En PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## Recursos

- [Documentación de React](https://react.dev)
- [Documentación de Vite](https://vitejs.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com)
- [Documentación de React Router](https://reactrouter.com)
- [Documentación de TypeScript](https://www.typescriptlang.org)
- [Documentación de Docker](https://docs.docker.com)

---

Equipo Lubix — Frontend oficial de la plataforma Lubix.
