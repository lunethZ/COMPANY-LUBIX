# Monitoreo y umbral de cobertura (S6)

## Endpoint de salud en Render

- URL: `https://lubix-api.onrender.com/health`
- Definido en `render.yaml` como `healthCheckPath: /health`.
- Método: `GET`.
- Código esperado: `200 OK` cuando la API y PostgreSQL responden.
- Código `503 Service Unavailable` cuando la conexión a PostgreSQL falla.
- Local (docker-compose): `http://localhost:8002/health`.

Respuesta correcta:

```json
{
  "status": "ok",
  "service": "lubix-api",
  "environment": "production",
  "database": "ok"
}
```

Respuesta degradada:

```json
{
  "status": "unavailable",
  "service": "lubix-api",
  "environment": "production",
  "database": "error"
}
```

Verificación manual:

```bash
curl -i https://lubix-api.onrender.com/health
```

El plan gratuito de Render suspende el servicio tras un periodo de inactividad y la
primera petición puede tardar cerca de un minuto en responder. Por eso el monitor
externo debe usar un timeout amplio y al menos dos reintentos antes de marcar caída.

## Uptime Kuma (recomendado, sondeo directo)

1. Ingresa a Uptime Kuma y pulsa **Add New Monitor**.
2. **Monitor Type:** `HTTP(s)`.
3. **Friendly Name:** `LUBIX API - Render`.
4. **URL:** `https://lubix-api.onrender.com/health`.
5. **Method:** `GET`.
6. **Interval:** `300` segundos (5 minutos). Si quieres preservar la suspensión del
   plan gratuito, usa `900` segundos y aumenta la tolerancia a fallos.
7. **Timeout:** `60` segundos para absorber el cold start de Render.
8. **Retries:** `2` (marca caída solo tras tres intentos fallidos).
9. **Expected Status Code:** `200`.
10. Opcional: **JSON Query** sobre la clave `status` con valor esperado `ok`.
11. En **Notifications**, añade al menos un canal (Telegram, Discord, correo, etc.)
    y deja activado **Send detailed notifications**.
12. Guarda el monitor y comprueba que el estado pase a **Up**.

Prueba de alerta: detén el Web Service en Render (o fuerza un `503` en `/health`)
y espera tres intervalos. Uptime Kuma debe marcar **Down** y enviar la notificación.
Vuelve a iniciar el servicio y debe recuperarse a **Up** y enviar la notificación
de recuperación.

## Healthchecks.io (push con verificación GET previa)

Healthchecks.io recibe pings; no sondea directamente la URL de la app. Configura un
check y un pequeño cron que primero haga `GET /health` y solo envíe el ping si la
respuesta es `200`.

1. En Healthchecks.io pulsa **Add Check** y asígnale el nombre `LUBIX API - Render`.
2. Configura el **Timeout** en `10 min` y el **Grace Period** en `10 min`. El check
   pasará a *Down* si no recibe el ping en ese plazo, lo que tolera el cold start.
3. En **Check Details** deja el método del ping en `GET`.
4. Copia el **Ping URL** (`https://hc-ping.com/<UUID>`).
5. En el servidor donde corra el cron, añade (cambiando `<UUID>`):

```cron
*/5 * * * * curl -fsS --max-time 60 https://lubix-api.onrender.com/health >/dev/null && curl -fsS https://hc-ping.com/<UUID> >/dev/null
```

6. Configura las alertas en **Integrations** (correo, Slack, Telegram, Discord, PagerDuty, etc.).
7. Prueba: detén el servicio en Render. El `curl` a `/health` fallará, no se enviará
   el ping y Healthchecks.io alertará tras el timeout + grace period. Al volver,
   el cron reanuda los pings y el check pasa a *Up*.

El código esperado tanto para `/health` como para el ping de Healthchecks.io es `200`.

## Uptime Kuma local / VPS (opcional)

En `docker-compose.yml` hay un bloque comentado `uptime-kuma`. Para usarlo:

1. Descomenta el servicio `uptime-kuma` y el volumen `uptime_kuma_data`.
2. Ejecuta `docker compose up -d uptime-kuma`.
3. Abre `http://localhost:3001`, crea el usuario admin y añade el monitor con los
   parámetros de la sección anterior. Para un backend local usa
   `http://localhost:8002/health`.

## Umbral de cobertura

El umbral obligatorio del backend es **75 %** y está definido en:

- `backend/pytest.ini` (`--cov-fail-under=75`).
- `backend/pyproject.toml` (`fail_under = 75`).
- `.github/workflows/sonarcloud.yml` (`--cov-fail-under=75`).

La medición local tras S6 fue **80.98 %** ejecutando la suite sin los tests de
repositorio (PostgreSQL de prueba no disponible) y **84.16 %** con la suite
completa base; en CI, con PostgreSQL activo, la cobertura es superior.
