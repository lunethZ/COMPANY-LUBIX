import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import App from './App';
import { renderWithProviders } from './test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

function loginAs(roleId: 'user' | 'empresa' | 'admin') {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 1, name: 'Prueba', email: 'prueba@lubix.test', role_id: roleId }),
  );
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.delete.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/products/search') return Promise.resolve({ data: { products: [] } });
    if (url === '/cart') {
      return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
    }
    if (url === '/user/favorites' || url === '/user/orders' || url === '/user/addresses') {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: {} });
  });
  apiMocks.post.mockResolvedValue({ data: {} });
  apiMocks.delete.mockResolvedValue({ data: {} });
});

describe('App: enrutamiento y guards', () => {
  it('renderiza el home público en la raíz', async () => {
    renderWithProviders(<App />, { initialEntries: ['/'] });

    expect(await screen.findByText('Tienda de Tecnología')).toBeInTheDocument();
  });

  it('redirige a login al entrar a una ruta protegida sin sesión', async () => {
    renderWithProviders(<App />, { initialEntries: ['/carrito'] });

    expect(await screen.findByText('Inicia sesión')).toBeInTheDocument();
  });

  it('redirige al home cuando un visitante intenta entrar al panel admin', async () => {
    renderWithProviders(<App />, { initialEntries: ['/dashboard-admin'] });

    expect(await screen.findByText('Tienda de Tecnología')).toBeInTheDocument();
  });

  it('redirige al home de usuario cuando un usuario autenticado visita /login', async () => {
    loginAs('user');
    renderWithProviders(<App />, { initialEntries: ['/login'] });

    expect(await screen.findByText('Bienvenido de nuevo a Lubix')).toBeInTheDocument();
  });

  it('redirige al home de usuario si el rol no tiene acceso a la ruta', async () => {
    loginAs('user');
    renderWithProviders(<App />, { initialEntries: ['/dashboard-empresa'] });

    expect(await screen.findByText('Bienvenido de nuevo a Lubix')).toBeInTheDocument();
  });

  it('mantiene la sesión al disparar el evento pageshow del bfcache', async () => {
    loginAs('user');
    renderWithProviders(<App />, { initialEntries: ['/home-usuario'] });

    await screen.findByText('Bienvenido de nuevo a Lubix');

    const persistedEvent = new Event('pageshow') as Event & { persisted?: boolean };
    Object.defineProperty(persistedEvent, 'persisted', { value: true });
    window.dispatchEvent(persistedEvent);

    expect(screen.getByText('Bienvenido de nuevo a Lubix')).toBeInTheDocument();
  });

  it('fuerza el login al volver del bfcache sin sesión en una ruta protegida', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/home-usuario', href: '' },
    });

    try {
      renderWithProviders(<App />, { initialEntries: ['/'] });
      await screen.findByText('Tienda de Tecnología');

      const persistedEvent = new Event('pageshow') as Event & { persisted?: boolean };
      Object.defineProperty(persistedEvent, 'persisted', { value: true });
      window.dispatchEvent(persistedEvent);

      expect(window.location.href).toBe('/login');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('ignora pageshow cuando la página no viene del bfcache', async () => {
    renderWithProviders(<App />, { initialEntries: ['/carrito'] });

    await screen.findByText('Inicia sesión');

    window.dispatchEvent(new Event('pageshow'));

    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
  });
});
