import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import Navbar from './navbar';
import { renderWithProviders } from '../test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderNavbar() {
  return renderWithProviders(
    <>
      <Navbar />
      <LocationDisplay />
    </>,
  );
}

function loginAsUser() {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: 1,
      name: 'Ana Tester',
      email: 'ana@lubix.test',
      role_id: 'user',
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.delete.mockReset();
  apiMocks.get.mockResolvedValue({
    data: { items: [], subtotal: 0, total_items: 0 },
  });
  apiMocks.post.mockResolvedValue({ data: {} });
  apiMocks.delete.mockResolvedValue({ data: {} });
});

describe('Navbar público', () => {
  it('muestra las acciones de login y registro cuando no hay sesión', async () => {
    renderNavbar();

    expect(screen.getByText('Lubix')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

    // No hay sesión, así que sigue mostrando las acciones públicas.
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('busca productos y navega a /buscar con el término', async () => {
    renderNavbar();

    await userEvent.type(screen.getByPlaceholderText('Buscar...'), '  portátil  {Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/buscar?q=port%C3%A1til');
  });

  it('no navega si la búsqueda está vacía', async () => {
    renderNavbar();

    await userEvent.type(screen.getByPlaceholderText('Buscar...'), '   {Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('alterna el tema entre claro y oscuro', async () => {
    localStorage.setItem('theme', 'light');
    renderNavbar();

    const toggle = screen.getByTitle('Modo oscuro');
    await userEvent.click(toggle);

    expect(screen.getByTitle('Modo claro')).toBeInTheDocument();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('muestra el nombre, avatar y cantidad del carrito con sesión iniciada', async () => {
    loginAsUser();
    localStorage.setItem(
      'cart',
      JSON.stringify([
        { product_id: 'p1', name: 'Portátil', price: 100, quantity: 2 },
        { product_id: 'p2', name: 'Mouse', price: 10, quantity: 1 },
      ]),
    );
    apiMocks.get.mockResolvedValue({
      data: {
        items: [
          {
            id: 'p1',
            product_id: 'p1',
            name: 'Portátil',
            price: 100,
            unit_price: 100,
            quantity: 3,
          },
        ],
        subtotal: 300,
        total_items: 3,
      },
    });

    renderNavbar();

    expect(screen.getByText('Ana Tester')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect((await screen.findAllByText('3')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
  });

  it('abre y cierra el menú móvil con las acciones públicas', async () => {
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);

    const panel = document.getElementById('navbar-publico-movil') as HTMLElement;
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: /Modo (oscuro|claro)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(document.getElementById('navbar-publico-movil')).not.toBeInTheDocument();
  });

  it('busca desde el menú móvil, navega y lo cierra', async () => {
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const panel = document.getElementById('navbar-publico-movil') as HTMLElement;

    await userEvent.type(within(panel).getByPlaceholderText('Buscar...'), 'monitor{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/buscar?q=monitor');
    expect(document.getElementById('navbar-publico-movil')).not.toBeInTheDocument();
  });

  it('abre el login desde el menú móvil y cierra el panel', async () => {
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const panel = document.getElementById('navbar-publico-movil') as HTMLElement;
    await userEvent.click(within(panel).getByRole('button', { name: 'Ingresar' }));

    expect(document.getElementById('navbar-publico-movil')).not.toBeInTheDocument();
  });

  it('muestra la sesión y permite salir desde el menú móvil', async () => {
    loginAsUser();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });

    try {
      renderNavbar();
      await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
      const panel = document.getElementById('navbar-publico-movil') as HTMLElement;
      expect(within(panel).getByText('Ana Tester')).toBeInTheDocument();

      await userEvent.click(within(panel).getByRole('button', { name: 'Salir' }));

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(window.location.href).toBe('/login');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('cierra la sesión al pulsar Salir', async () => {
    loginAsUser();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });

    try {
      renderNavbar();
      await userEvent.click(screen.getByRole('button', { name: 'Salir' }));

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
