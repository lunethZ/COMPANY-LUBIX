import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Umbral de CI (S3): mínimo 40 % en los formularios que ya tienen pruebas de RTL.
      thresholds: {
        'src/pages/login.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/register.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 },
        'src/pages/pqrs.tsx': { statements: 40, branches: 40, functions: 40, lines: 40 }
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
