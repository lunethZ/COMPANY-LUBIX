import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import NavbarEmpresa from './navbar-empresa';
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
      <NavbarEmpresa />
      <LocationDisplay />
    </>,
  );
}

function loginAsCompany(name = 'TechStore') {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 1, name, email: 'tienda@lubix.test', role_id: 'empresa' }),
  );
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.get.mockResolvedValue({
    data: { items: [], subtotal: 0, total_items: 0 },
  });
});

describe('Navbar de empresa', () => {
  it('muestra la marca, el nombre y el acceso a PQRS', () => {
    loginAsCompany();
    renderNavbar();

    expect(screen.getByRole('link', { name: 'Lubix' })).toHaveAttribute(
      'href',
      '/dashboard-empresa',
    );
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('PQRS')).toBeInTheDocument();
  });

  it('usa el icono genérico si la empresa no tiene nombre', () => {
    loginAsCompany('');
    renderNavbar();

    expect(screen.queryByText('T')).not.toBeInTheDocument();
    expect(screen.getByText('PQRS')).toBeInTheDocument();
  });

  it('abre el menú de perfil y se cierra al hacer clic fuera', async () => {
    loginAsCompany();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: /TechStore/ }));
    expect(screen.getByRole('link', { name: 'Perfil de Empresa' })).toHaveAttribute(
      'href',
      '/dashboard-empresa',
    );

    await userEvent.click(document.body);

    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Perfil de Empresa' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('cierra la sesión y redirige al login', async () => {
    loginAsCompany();
    renderNavbar();

    await userEvent.click(screen.getByRole('button', { name: /TechStore/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('alterna el tema', async () => {
    loginAsCompany();
    localStorage.setItem('theme', 'light');
    renderNavbar();

    await userEvent.click(screen.getByTitle('Modo oscuro'));

    expect(screen.getByTitle('Modo claro')).toBeInTheDocument();
  });
});
