import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom no implementa el scroll real; varias páginas lo invocan al montar.
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// React Testing Library no auto-limpia cuando `globals` está desactivado.
afterEach(() => {
  cleanup();
});
