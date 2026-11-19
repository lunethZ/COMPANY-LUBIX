import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const instance = Object.assign(
    vi.fn((config: unknown) => Promise.resolve({ data: 'retried', config })),
    {
      interceptors,
      defaults: { headers: { common: {} as Record<string, string> } },
      post: vi.fn(),
    },
  );
  return { interceptors, instance, create: vi.fn(() => instance) };
});

vi.mock('axios', () => ({
  default: { create: mocks.create },
}));

import api from './axios';

type RequestConfig = { headers: Record<string, string> };
type ResponseError = {
  config: { url: string; headers: Record<string, string>; _retry?: boolean };
  response?: { status: number };
};

const requestHandler = mocks.interceptors.request.use.mock.calls[0][0] as (
  config: RequestConfig,
) => RequestConfig;
const responseErrorHandler = mocks.interceptors.response.use.mock.calls[0][1] as (
  error: ResponseError,
) => Promise<unknown>;

beforeEach(() => {
  localStorage.clear();
  mocks.instance.post.mockReset();
  mocks.instance.defaults.headers.common = {};
});

describe('Cliente axios', () => {
  it('exporta la instancia creada por axios.create', () => {
    expect(api).toBe(mocks.instance);
  });

  it('añade el token de acceso a las peticiones', () => {
    localStorage.setItem('access_token', 'token-123');

    const config = requestHandler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer token-123');
  });

  it('no añade cabecera si no hay token', () => {
    const config = requestHandler({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('renueva el token cuando la API responde 401', async () => {
    localStorage.setItem('access_token', 'old-token');
    localStorage.setItem('refresh_token', 'a.b.c');
    mocks.instance.post.mockResolvedValue({
      data: { access_token: 'new-token', refresh_token: 'n.e.w' },
    });

    const original = { url: '/user/dashboard/me', headers: {} };
    const result = await responseErrorHandler({
      config: original,
      response: { status: 401 },
    });

    expect(mocks.instance.post).toHaveBeenCalledWith('/auth/refresh', {
      old_refresh_token: 'a.b.c',
    });
    expect(localStorage.getItem('access_token')).toBe('new-token');
    expect(localStorage.getItem('refresh_token')).toBe('n.e.w');
    expect(mocks.instance.defaults.headers.common.Authorization).toBe(
      'Bearer new-token',
    );
    expect(result).toMatchObject({ data: 'retried' });
  });

  it('no reintenta el refresh sobre /auth/refresh', async () => {
    const error = {
      config: { url: '/auth/refresh', headers: {} },
      response: { status: 401 },
    };

    await expect(responseErrorHandler(error)).rejects.toBe(error);
  });

  it('propaga errores que no son 401', async () => {
    const error = {
      config: { url: '/products', headers: {} },
      response: { status: 500 },
    };

    await expect(responseErrorHandler(error)).rejects.toBe(error);
  });
});
