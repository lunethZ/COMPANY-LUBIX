# RNF-013 — Compatibilidad móvil

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-013 |
| Nombre | Compatibilidad móvil |
| Categoría | Portabilidad |
| Prioridad | Alta |
| Estado | Definido |

---

## Descripción

La plataforma debe estar disponible como aplicación nativa para iOS y Android utilizando React Native/Expo, manteniendo compatibilidad API con el cliente web y ofreciendo la web como alternativa responsive.

---

## Especificación

### Meta principal
Los usuarios deben poder acceder a todas las funcionalidades principales desde dispositivos móviles nativos y desde el navegador del dispositivo.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Plataforma móvil | React Native con Expo |
| iOS | Compatible con iOS 13 o superior |
| Android | Compatible con Android 8 (API 26) o superior |
| API compartida | Mismos endpoints para web y móvil |
| Web responsive | Funcionalidad completa como fallback |
| UI táctil | Componentes optimizados para interacción táctil |

### Estrategia de validación
Compilar y ejecutar la app en dispositivos iOS y Android reales o emuladores. Ejecutar pruebas de API desde ambos clientes. Verificar que la web responsive cubre todas las funcionalidades en pantallas pequeñas.

### Dependencias
- Entorno de desarrollo React Native/Expo configurado
- API REST compatible con múltiples clientes
- Dispositivos o emuladores para pruebas
