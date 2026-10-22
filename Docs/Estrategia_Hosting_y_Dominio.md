# Estrategia de hosting y dominio

Tarea S3. Define dónde se aloja Lubix, con qué dominio se publica y cómo se obtiene HTTPS. También deja registrado dónde vive el umbral de cobertura del CI (40 %).

## 1. Punto de partida

Hoy el proyecto corre solo en desarrollo, con `docker-compose.yml`:

| Servicio | Qué es | Puerto en el host |
| --- | --- | --- |
| `postgres` | PostgreSQL 16 | 5435 |
| `minio` | Almacenamiento de imágenes y archivos | 9100 |
| `backend` | FastAPI (se sirve con uvicorn) | 8002 |
| `frontend` | React + Vite | 5173 |
| `mobile` | Expo (app móvil) | 8081 |

Lo que hay que cambiar antes de publicar:

- El frontend se ejecuta con `pnpm run dev` (servidor de desarrollo). En producción se compila con `pnpm build` y se sirve la carpeta `dist/` como archivos estáticos.
- `backend/start.sh` arranca uvicorn con `--reload`, que es solo para desarrollo.
- `CorsMiddleware.py` tiene una lista fija de orígenes `localhost`. Con un dominio real hay que agregar el origen HTTPS, o servir web y API desde el mismo dominio para no depender de CORS.
- La URL de la API entra al frontend en tiempo de compilación mediante `VITE_API_URL`.
- `.env` trae valores de ejemplo (`SECRET_KEY`, contraseñas, administrador por defecto `Admin123!`, `RUN_SEED=true`). En producción deben cambiarse.
- Postgres y MinIO publican puertos hacia el host. En producción deben quedar solo en la red interna de Docker.

## 2. Opciones evaluadas

| Criterio | A. Caddy + DuckDNS | B. Subdominio de Render |
| --- | --- | --- |
| Dirección pública | `lubix.duckdns.org` (nombre de ejemplo) | `lubix.onrender.com` (nombre de ejemplo) |
| HTTPS | Automático con Caddy (Let's Encrypt) | Incluido por la plataforma |
| Encaja con `docker-compose` (Postgres + MinIO + backend) | Sí, se despliega igual que hoy | Hay que separarlo en servicios (web, estático, base de datos) |
| MinIO y sus archivos | Volumen Docker en el mismo servidor | Necesita disco persistente; los discos y la base de datos gestionada dependen del plan |
| Costo | Gratis con un servidor propio o prestado | Depende del plan; el gratuito tiene límites |
| Requisitos | Servidor con IP pública y puertos 80 y 443 abiertos | Cuenta de Render y repositorio conectado |
| Administración | Se administra el servidor | Casi nula |

Los planes y límites de Render cambian con el tiempo: antes de elegir la opción B hay que revisar su documentación vigente.

## 3. Decisión propuesta

**Opción A: Caddy + DuckDNS en un solo servidor con Docker Compose.**

Razones:

1. La arquitectura ya es multicontenedor con Postgres y MinIO, que necesitan disco persistente. Con Compose se publica igual que se desarrolla.
2. No tiene costo de plataforma.
3. Caddy obtiene y renueva el certificado HTTPS sin configuración adicional.
4. Con un solo dominio (web en `/` y API en `/api`) no hay problemas de CORS ni de contenido mixto HTTP/HTTPS.

La opción B queda como alternativa si el equipo no dispone de un servidor con IP pública.

## 4. Arquitectura propuesta

```
Internet
   │  https://lubix.duckdns.org
   ▼
Caddy (puertos 80 y 443, HTTPS automático)
   ├── /        → archivos estáticos de frontend/dist
   └── /api/*   → backend:8000 (Caddy quita el prefijo /api)

Red interna de Docker (sin puertos publicados): postgres, minio, backend
```

## 5. Dominio con DuckDNS

1. Crear una cuenta en duckdns.org y registrar un subdominio, por ejemplo `lubix`. Queda como `lubix.duckdns.org`.
2. Apuntarlo a la IP pública del servidor. Si la IP cambia, hay que actualizarla con el token de DuckDNS (por ejemplo con el contenedor de abajo).
3. Abrir los puertos 80 y 443 en el router o en el firewall del servidor.

Si el proveedor de internet comparte la IP entre clientes (CGNAT), los puertos no se pueden abrir. En ese caso hay que usar un VPS o la opción B.

## 6. HTTPS con Caddy

Caddy pide el certificado a Let's Encrypt la primera vez que recibe una petición para el dominio, lo renueva solo y redirige HTTP a HTTPS. Para que funcione, el dominio debe resolver a la IP del servidor y los puertos 80 y 443 deben ser alcanzables desde internet. La carpeta `/data` de Caddy debe ser un volumen para no perder el certificado al reiniciar.

`Caddyfile` propuesto:

```
lubix.duckdns.org {
    encode gzip

    handle_path /api/* {
        reverse_proxy backend:8000
    }

    handle {
        root * /srv/frontend
        try_files {path} /index.html
        file_server
    }
}
```

Servicios propuestos para agregar a `docker-compose.yml` (no se aplican en esta tarea):

```yaml
  caddy:
    image: caddy:2
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./frontend/dist:/srv/frontend:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend

  duckdns:
    image: lscr.io/linuxserver/duckdns:latest
    restart: always
    environment:
      - SUBDOMAINS=lubix
      - TOKEN=${DUCKDNS_TOKEN}
```

Los volúmenes `caddy_data` y `caddy_config` se declaran junto a `postgres_data` y `minio_data`. Las variables del contenedor de DuckDNS deben confirmarse en la documentación de esa imagen.

Comprobación una vez publicado: `curl -I https://lubix.duckdns.org` debe responder 200 y el navegador debe mostrar el candado.

## 7. Cambios necesarios en el proyecto

- **Frontend:** compilar con `VITE_API_URL=/api` para que las peticiones vayan al mismo dominio.
- **Backend:** quitar `--reload` de `start.sh`, definir `URL_FRONTEND=https://lubix.duckdns.org` y agregar ese origen en `CorsMiddleware.py`.
- **Secretos:** cambiar `SECRET_KEY`, las contraseñas de Postgres y MinIO, y el administrador por defecto; poner `RUN_SEED=false` después del primer arranque.
- **Red:** quitar la publicación de los puertos 5435 y 9100 en producción.
- **Móvil:** apuntar `EXPO_PUBLIC_API_URL` a `https://lubix.duckdns.org/api`.
- **Respaldo:** guardar copias de los volúmenes `postgres_data` y `minio_data`.

## 8. Umbral de cobertura en el CI (40 %)

Antes de esta tarea el repositorio no tenía un flujo de CI. Se agregó `.github/workflows/ci.yml` con dos trabajos y un umbral mínimo de 40 %:

| Parte | Dónde se define el 40 % | Qué mide |
| --- | --- | --- |
| Backend | `pytest --cov=app --cov-fail-under=40` en `.github/workflows/ci.yml` | Cobertura del paquete `app` |
| Frontend | `coverage.thresholds` en `frontend/vite.config.ts` | `login.tsx`, `register.tsx` y `pqrs.tsx`, los formularios con pruebas de RTL |

En el frontend la cobertura global inicial (S1) fue de 0,55 %, así que el umbral por ahora solo cubre los formularios que ya tienen pruebas. Cuando se agreguen pruebas a otras páginas se suman a la lista de `thresholds`.

Para comprobarlo en local:

```bash
# frontend
cd frontend && npm run test:coverage

# backend (con el entorno virtual activado)
cd backend && pytest --cov=app --cov-report=term-missing --cov-fail-under=40
```

## 9. Pendiente de decidir con el equipo

- Confirmar la opción A (o elegir la B) y el nombre final del subdominio.
- Definir quién administra el servidor y dónde se guardan los respaldos.
- Decidir si el CI debe correr también en las ramas de trabajo o solo en las solicitudes de integración.
