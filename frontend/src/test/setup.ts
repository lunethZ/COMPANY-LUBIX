import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library no auto-limpia cuando `globals` está desactivado.
afterEach(() => {
  cleanup();
});
