# Cobertura de pruebas del frontend

Herramientas: Vitest + React Testing Library (entorno jsdom, cobertura con v8).

## Comandos

```bash
npm install
npm test               # corre las pruebas una vez
npm run test:watch     # modo observador
npm run test:coverage  # pruebas + reporte de cobertura (carpeta coverage/)
```

## Cobertura actual

Resultado de `npm run test:coverage` sobre la rama actual (45 archivos de prueba unitaria/integración en rontend/src):

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 89.39% | 78.07% | 87.73% | 91.21% |

Los valores salen de la tabla `All files` que imprime el comando (o de `coverage/coverage-summary.json`). Todas las páginas de `src/pages` tienen pruebas y superan el umbral mínimo.

## Umbral de CI (S3)

Desde S3 el comando `npm run test:coverage` exige al menos 80 % de líneas a nivel global y 40 % en sentencias, ramas, funciones y líneas para cada página de `src/pages` (ver `coverage.thresholds` en `vite.config.ts`). La estrategia completa está en `Docs/Estrategia_Hosting_y_Dominio.md`.
