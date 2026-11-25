import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import NavbarUsuario from './navbaruser';
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
      <NavbarUsuario />
      <LocationDisplay />
    </>,
  );
}

function loginAsUser(name = 'Ana Tester') {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 1, name, email: 'ana@lubix.test', role_id: 'user' }),
  );
}

const cartResponse = {
  items: [
    { product_id: 'p1', name: 'Portátil', price: 100, quantity: 2, unit_price: 100 },
  ],
  subtotal: 200,
  total_items: 2,
};

function mockApi(overrides?: { avatar?: string | null; rejectDashboard?: boolean }) {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') return Promise.resolve({ data: cartResponse });
    if (url === '/user/dashboard/me') {
      if (overrides?.rejectDashboard) return Promise.reject(new Error('offline'));
      return Promise.resolve({ data: { avatar: overrides?.avatar ?? null } });
    }
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
});

describe('Navbar de usuario', () => {
  it('muestra avatar, nombre, carrito y badge de cantidad', async () => {
    loginAsUser();
    mockApi();

    renderNavbar();

    expect(screen.getByText('Ana Tester')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('PQRS')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByText('2').length).toBeGreaterThan(0),
    );
  });

  it('carga la foto de perfil desde una ruta relativa', async () => {
    loginAsUser();
    mockApi({ avatar: '/files/avatars/ana.png' });

    renderNavbar();

    const avatar = await screen.findByAltText('Avatar');
    expect(avatar.getAttribute('src')).toMatch(/\/files\/avatars\/ana\.png$/);
  });

  it('respeta una URL absoluta de avatar', async () => {
    loginAsUser();
    mockApi({ avatar: 'https://cdn.lubix.test/ana.png' });

    renderNavbar();

    expect(await screen.findByAltText('Avatar')).toHaveAttribute(
      'src',
      'https://cdn.lubix.test/ana.png',
    );
  });

  it('usa el icono genérico cuando el usuario no tiene nombre', async () => {
    loginAsUser('');
    mockApi();

    renderNavbar();

    expect(screen.queryByAltText('Avatar')).not.toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
  });

  it('sigue renderizando si falla la carga del avatar', async () => {
    loginAsUser();
    mockApi({ rejectDashboard: true });

    renderNavbar();

    await waitFor(() => expect(apiMocks.get).toHaveBeenCalledWith('/user/dashboard/me'));
    expect(screen.queryByAltText('Avatar')).not.toBeInTheDocument();
    expect(screen.getByText('Ana Tester')).toBeInTheDocument();
  });

  it('abre el menú, navega al perfil y se cierra al hacer clic fuera', async () => {
    loginAsUser();
    mockApi();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: /Ana Tester/ }));
    const perfil = screen.getByRole('link', { name: 'Ver Perfil' });
    expect(perfil).toHaveAttribute('href', '/dashboard-usuario');

    await userEvent.click(document.body);

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Ver Perfil' })).not.toBeInTheDocument(),
    );
  });

  it('busca productos y navega a /buscar', async () => {
    loginAsUser();
    mockApi();
    renderNavbar();

    await userEvent.type(
      screen.getByPlaceholderText('Buscar productos...'),
      'teclado{Enter}',
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/buscar?q=teclado');
  });

  it('cierra la sesión desde el menú y redirige al login', async () => {
    loginAsUser();
    mockApi();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: /Ana Tester/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('alterna el tema', async () => {
    loginAsUser();
    localStorage.setItem('theme', 'dark');
    mockApi();
    renderNavbar();

    await userEvent.click(screen.getByTitle('Modo claro'));

    expect(screen.getByTitle('Modo oscuro')).toBeInTheDocument();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('abre el menú móvil con búsqueda, carrito, PQRS y perfil', async () => {
    loginAsUser();
    mockApi();
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);

    const panel = document.getElementById('navbar-usuario-movil') as HTMLElement;
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /Carrito/ })).toHaveAttribute('href', '/carrito');
    expect(within(panel).getByRole('link', { name: /PQRS/ })).toHaveAttribute('href', '/pqrs');
    expect(within(panel).getByRole('link', { name: /Ver Perfil/ })).toHaveAttribute(
      'href',
      '/dashboard-usuario',
    );
  });

  it('busca desde el menú móvil de usuario y lo cierra al navegar', async () => {
    loginAsUser();
    mockApi();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const panel = document.getElementById('navbar-usuario-movil') as HTMLElement;

    await userEvent.type(within(panel).getByPlaceholderText('Buscar productos...'), 'mouse{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/buscar?q=mouse');
    expect(document.getElementById('navbar-usuario-movil')).not.toBeInTheDocument();
  });

  it('cierra la sesión desde el menú móvil', async () => {
    loginAsUser();
    mockApi();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const panel = document.getElementById('navbar-usuario-movil') as HTMLElement;
    await userEvent.click(within(panel).getByRole('button', { name: 'Cerrar Sesión' }));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
    expect(document.getElementById('navbar-usuario-movil')).not.toBeInTheDocument();
  });

  it('cambia el tema desde el menú móvil', async () => {
    loginAsUser();
    localStorage.setItem('theme', 'light');
    mockApi();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const panel = document.getElementById('navbar-usuario-movil') as HTMLElement;
    await userEvent.click(within(panel).getByRole('button', { name: /Modo oscuro/ }));

    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
