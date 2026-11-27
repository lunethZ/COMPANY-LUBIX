import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import NavbarAdmin from './navbar-admin';
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
  return <div data-testid="location">{location.pathname}</div>;
}

function renderNavbar() {
  return renderWithProviders(
    <>
      <NavbarAdmin />
      <LocationDisplay />
    </>,
    { initialEntries: ['/dashboard-admin'] },
  );
}

function loginAsAdmin(name = 'Root') {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 1, name, email: 'root@lubix.test', role_id: 'admin' }),
  );
}

async function openProfileMenu() {
  // El botón de la marca ("Lubix Console / Admin Root") también contiene el nombre.
  const buttons = screen.getAllByRole('button', { name: /Root|Admin/ });
  await userEvent.click(buttons[buttons.length - 1]);
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.get.mockResolvedValue({
    data: { items: [], subtotal: 0, total_items: 0 },
  });
});

describe('Navbar de administración', () => {
  it('muestra la marca de consola y el badge de rol', () => {
    loginAsAdmin();
    renderNavbar();

    expect(screen.getByText('Lubix Console')).toBeInTheDocument();
    expect(screen.getByText('Admin Root')).toBeInTheDocument();
    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('muestra "Admin" cuando el usuario no tiene nombre', () => {
    loginAsAdmin('');
    renderNavbar();

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('navega al inicio desde la marca', async () => {
    loginAsAdmin();
    renderNavbar();

    await userEvent.click(screen.getByTitle('Ir al inicio'));

    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('abre el menú, muestra el nivel y se cierra al hacer clic fuera', async () => {
    loginAsAdmin();
    renderNavbar();

    await openProfileMenu();
    expect(screen.getByText('Nivel: Superusuario')).toBeInTheDocument();

    await userEvent.click(document.body);

    await waitFor(() =>
      expect(screen.queryByText('Nivel: Superusuario')).not.toBeInTheDocument(),
    );
  });

  it('cierra la sesión y redirige al login', async () => {
    loginAsAdmin();
    renderNavbar();

    await openProfileMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('alterna el tema', async () => {
    loginAsAdmin();
    localStorage.setItem('theme', 'dark');
    renderNavbar();

    await userEvent.click(screen.getByTitle('Modo claro'));

    expect(screen.getByTitle('Modo oscuro')).toBeInTheDocument();
  });
});
