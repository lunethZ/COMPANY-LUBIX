import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    proxy: {
      '/files': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Umbral de CI: cobertura global mínima de líneas (P-04) y umbrales por página.
      thresholds: {
        global: { lines: 80 },
        'src/pages/Home.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/buscar-producto.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/carrito.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/dashboard-empresa.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/dashboard-usuario.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/dashboardadmin.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/home-empresa.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/home-usuario.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/login.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/new-password.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/pagar.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/perfil-empresa.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/pqrs.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/producto-detalle.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/productos.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/register.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/reset-password.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/verific-code.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 }
      },
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/types/**',
        'src/main.tsx',
        'src/**/*.d.ts'
      ]
    }
  }
})
