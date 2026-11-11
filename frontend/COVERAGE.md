# Cobertura de pruebas del frontend

Herramientas: Vitest + React Testing Library (entorno jsdom, cobertura con v8).

## Comandos

```bash
npm install
npm test               # corre las pruebas una vez
npm run test:watch     # modo observador
npm run test:coverage  # pruebas + reporte de cobertura (carpeta coverage/)
```

## Cobertura inicial

Resultado de `npm run test:coverage` sobre la rama en la que se instaló Vitest:

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 0.5% | 0.96% | 0.5% | 0.55% |

Los valores salen de la tabla `All files` que imprime el comando (o de `coverage/coverage-summary.json`).

## Umbral de CI (S3)

Desde S3 el comando `npm run test:coverage` falla si `login.tsx`, `register.tsx` o `pqrs.tsx` bajan de 40 % en sentencias, ramas, funciones o líneas (ver `coverage.thresholds` en `vite.config.ts`). El resto de páginas todavía no tiene pruebas y no se mide contra el umbral. La estrategia completa está en `Docs/Estrategia_Hosting_y_Dominio.md`.
