# Cómo correr LUBIX (parte web)

## 1. Requisitos
- **Docker Desktop** instalado y **abierto** (que esté corriendo).

## 2. Abrir el proyecto
```
cd "C:\Users\Mundo\OneDrive\Escritorio\Mono Principal\LUBIX-COMPANY"
```

## 3. Configurar variables de entorno
Ya existe el archivo `.env` en la raíz. Revisar al menos:
- `GMAIL_USERNAME` y `GMAIL_APP_PASSWORD` → cuenta Gmail que envía los códigos
- `RUN_SEED=True` → solo la primera vez (crea el admin y los roles)

## 4. Levantar todo
```bash
docker compose up -d --build
```
Esperar a que termine (puede tardar varios minutos la primera vez).

## 4b. Levantar solo la base de datos (si ya tienes el backend corriendo por separado)
```bash
docker compose up -d postgres
```
Esto levanta únicamente PostgreSQL en el puerto 5434.

## 5. Verificar que todo esté corriendo
```bash
docker compose ps
```
Debe verse `Up` en: `postgres`, `minio`, `backend`, `frontend`.

## 6. Acceder
| Servicio | URL |
|----------|-----|
| Página web | http://localhost:5173 |
| API docs (Swagger) | http://localhost:8001/docs |

## 7. Para ver logs (opcional)
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 8. Para detener
```bash
docker compose down
```

---

> ⚠️ **Si te registras y NO llega el código de verificación**: revisa los logs con `docker compose logs backend`. Si dice `Daily user sending limit exceeded`, esa cuenta de Gmail agotó su límite diario de envíos (o usa otro provedor SMTP). El código se guarda en la BD en la tabla `event_codes`, puedes consultarlo ahí mientras tanto.

Remove placeholder form.tsx component
Remove debug console.log in new-password.tsx
Fix orphaned /> in register.tsx
Add click-outside to close navbar dropdowns

---

## Estado del checklist (2026-10-18)

- [x] form.tsx placeholder → ya no existe en el repo
- [x] console.log en new-password.tsx → eliminado (también el de `src/api/axios.ts`)
- [x] `/>` huérfano en register.tsx → corregido en commits previos
- [x] click-outside en dropdowns → hook `src/hooks/useClickOutside.ts` aplicado en navbaruser, navbar-empresa y navbar-admin