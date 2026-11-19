import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import NavbarAuto from './navbar-auto';
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

function loginAs(roleId: 'user' | 'empresa' | 'admin', name = 'Ana Tester') {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 1, name, email: 'ana@lubix.test', role_id: roleId }),
  );
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.get.mockResolvedValue({
    data: { items: [], subtotal: 0, total_items: 0 },
  });
});

describe('NavbarAuto', () => {
  it('muestra la navbar pública cuando no hay sesión', () => {
    renderWithProviders(<NavbarAuto />);

    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('muestra la navbar de usuario para el rol user', () => {
    loginAs('user');
    renderWithProviders(<NavbarAuto />);

    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('PQRS')).toBeInTheDocument();
  });

  it('muestra la navbar de empresa para el rol empresa', () => {
    loginAs('empresa', 'TechStore');
    renderWithProviders(<NavbarAuto />);

    const brand = screen.getByRole('link', { name: 'Lubix' });
    expect(brand).toHaveAttribute('href', '/dashboard-empresa');
    expect(screen.getByText('PQRS')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Buscar productos...')).not.toBeInTheDocument();
  });

  it('muestra la navbar de administración para el rol admin', () => {
    loginAs('admin', 'Root');
    renderWithProviders(<NavbarAuto />);

    expect(screen.getByText('Lubix Console')).toBeInTheDocument();
    expect(screen.getByText('Admin Root')).toBeInTheDocument();
  });
});
