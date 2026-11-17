import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async () => {
  vi.resetModules();
  return import('../config');
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API_BASE_URL', () => {
  it('usa VITE_API_URL y elimina la barra final', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.ejemplo.com/');

    const { API_BASE_URL } = await loadConfig();

    expect(API_BASE_URL).toBe('https://api.ejemplo.com');
  });

  it('cae al backend de Render cuando no hay VITE_API_URL en produccion', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_URL', '');

    const { API_BASE_URL } = await loadConfig();

    expect(API_BASE_URL).toBe('https://lubix-api.onrender.com');
  });

  it('cae al backend local cuando no hay VITE_API_URL en desarrollo', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_API_URL', '');

    const { API_BASE_URL } = await loadConfig();

    expect(API_BASE_URL).toBe('http://localhost:8002');
  });
});
