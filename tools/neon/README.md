# Tooling de Neon

Configuración de desarrollo para las ramas de Neon. **No forma parte de la aplicación**: ni el backend, ni el frontend, ni la app móvil importan estos paquetes.

## Contenido

| Archivo | Uso |
|---|---|
| `neon.ts` | Configuración de servicios y política de ramas (`defineConfig` de `@neon/config`) |
| `package.json` / `package-lock.json` | Dependencias aisladas de este tooling |
| `.neon` | Vínculo local con la organización/proyecto/rama (ignorado por Git, no se versiona) |

## Uso

```bash
cd tools/neon
npm install
```

A partir de ahí, ejecuta el CLI de Neon desde esta carpeta para que tome `neon.ts` y `.neon`. La política actual:

- Rama por defecto: sin overrides.
- Ramas nuevas que no existen: expiración automática de 7 días; se crean con `neon checkout <nombre>`.
- Ramas existentes: sin cambios.

`.neon` contiene identificadores de tu proyecto y **no debe commitearse** (ya está en `.gitignore`).
