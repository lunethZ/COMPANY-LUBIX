# Lubix Mobile (React Native / Expo)

App móvil de Lubix construida con **Expo SDK 54** (React Native 0.81, React 19).
Consume el **mismo backend FastAPI** que la web (Docker en `localhost:8001`) y no
contiene datos de catálogo hardcodeados: productos, categorías, carrito, direcciones
y pedidos se sincronizan con el backend mediante JWT.

## Requisitos

- Node.js 20+ y npm
- Backend levantado con `docker compose up` (API en `http://localhost:8001`)
- Copiar `.env.example` a `.env` y ajustar `EXPO_PUBLIC_API_URL`:

  | Contexto          | URL                          |
  | ----------------- | ---------------------------- |
  | Android Emulador  | `http://10.0.2.2:8001`       |
  | iOS Simulator     | `http://localhost:8001`      |
  | Dispositivo físico| `http://<IP-DE-TU-PC>:8001`  |

## Instalación y ejecución

```bash
npm install
npm start          # expo start
npm run android    # abre en emulador Android
npm run typecheck  # verificación de tipos
```

Cuando uses un dispositivo físico, asegúrate de que el teléfono y el PC estén en la
misma red y de que el puerto `8001` esté accesible (en Windows: `netsh advfirewall
firewall add rule ... allow tcp 8001`, o desactiva temporalmente el firewall).

## Funcionalidad

- **Inicio**: bienvenida, ofertas (productos con descuento), categorías y grid de
  productos, todo desde `GET /products/*`.
- **Buscar**: búsqueda por texto, filtro por categoría y orden por precio
  (`GET /products/search` con `q`, `categoria`, `orden=price_asc|price_desc`).
- **Categorías**: lista de catálogos con conteo de productos (`GET /products/catalogs`).
- **Detalle de producto**: imágenes, precio con descuento, stock, especificaciones,
  reseñas, relacionados y agregar al carrito.
- **Carrito**: sincronizado con el backend para usuarios autenticados (`/cart/*`) y
  local (AsyncStorage) para visitantes; se fusiona al iniciar sesión.
- **Checkout** (paso a paso): Resumen del pedido (con cupón `LUBIX10`), Dirección de
  envío (guardadas o nueva), Método de pago (tarjeta/PSE/contraentrega) y
  Confirmación. Crea la orden en `POST /user/orders`.
- **Perfil**: mis pedidos (con cancelación), direcciones, favoritos, tema claro/oscuro
  y cierre de sesión.

## Estructura

```
App.tsx                    Providers (Theme, Auth, Cart) + navegación
src/api/                   Cliente axios (refresh de tokens) y servicios REST
src/context/               Auth, Cart, Checkout, Theme
src/navigation/            RootStack, MainTabs (5 tabs), CheckoutStack (4 pasos)
src/screens/               Pantallas públicas, usuario y checkout
src/components/            ProductCard, AppHeader, CheckoutHeader, ui
src/store/secureStore.ts   Tokens/sesión persistidos en AsyncStorage
src/utils/                 formatCOP, categorías (emoji), eventos de auth
src/types/                 Tipos de producto, usuario, carrito y pedido
```