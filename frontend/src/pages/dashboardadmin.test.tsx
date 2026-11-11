import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardAdminPage from './dashboardadmin';
import { renderWithProviders } from '../test/utils';

// Se dobla el cliente axios: ninguna prueba debe tocar la red.
const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

const adminUser = {
  id: 'a1',
  name: 'Admin Lubix',
  email: 'admin@x.com',
  role_id: 'admin',
};

const stats = {
  totalUsers: 10,
  totalCompanies: 4,
  pendingCompanies: 1,
  activeUsers: 8,
  inactiveUsers: 2,
};

const company = {
  id: 'c1',
  userId: 'u9',
  nameCompany: 'TechStore',
  nit: '900123',
  nitDV: '1',
  addressCompany: 'Calle 1 #2-3',
  email: 'tienda@x.com',
  ownerName: 'Ana',
  ownerTell: '3001234567',
  verified: false,
  isActive: true,
  certificate: null,
  memberSince: '2026-01-01T10:00:00',
};

const usuario = {
  id: 'u1',
  fullName: 'Luis Pérez',
  email: 'luis@x.com',
  tell: '3000000000',
  role: 'user',
  verified: true,
  isActive: true,
  memberSince: '2026-01-02T10:00:00',
};

const pqrs = {
  id: 'pq1',
  type: 'queja',
  subject: 'Producto dañado',
  description: 'El producto llegó roto',
  status: 'pending',
  user_role: 'user',
  user_name: 'Luis Pérez',
  user_email: 'luis@x.com',
  created_at: '2026-01-03T10:00:00',
};

const mockDatos = () => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') return Promise.resolve({ data: { items: [] } });
    if (url === '/admin/dashboard/me') return Promise.resolve({ data: stats });
    if (url === '/admin/companies') return Promise.resolve({ data: [company] });
    if (url === '/admin/users') return Promise.resolve({ data: [usuario] });
    if (url === '/admin/pqrs') return Promise.resolve({ data: [pqrs] });
    return Promise.resolve({ data: [] });
  });
};

const seedAdmin = () => {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('user', JSON.stringify(adminUser));
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Panel de administración', () => {
  it('muestra los indicadores y las empresas pendientes de validación', async () => {
    seedAdmin();
    mockDatos();
    renderWithProviders(<DashboardAdminPage />);

    expect(
      await screen.findByRole('heading', { name: 'Panel de Administración' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Usuarios registrados')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Empresas por validar (1)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText('tienda@x.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Validar empresa' }),
    ).toBeInTheDocument();
  });

  it('navega entre las pestañas de empresas, usuarios y PQRS', async () => {
    seedAdmin();
    mockDatos();
    const user = userEvent.setup();
    renderWithProviders(<DashboardAdminPage />);

    await screen.findByRole('heading', { name: 'Panel de Administración' });

    await user.click(screen.getByRole('button', { name: 'Empresas (1)' }));
    expect(
      screen.getByRole('heading', { name: 'Empresas registradas (1)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('900123-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usuarios (1)' }));
    expect(
      screen.getByRole('heading', { name: 'Usuarios registrados (1)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'PQRS (1)' }));
    expect(
      screen.getByRole('heading', { name: 'PQRS recibidas (1)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Producto dañado')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Marcar resuelta' }),
    ).toBeInTheDocument();
  });

  it('valida una empresa y recarga los datos del panel', async () => {
    seedAdmin();
    mockDatos();
    apiMocks.patch.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<DashboardAdminPage />);

    await screen.findByRole('heading', { name: 'Panel de Administración' });
    const llamadasIniciales = apiMocks.get.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Validar empresa' }));

    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith('/admin/companies/c1/validate');
    });
    // Se recargan los cuatro recursos del panel.
    await waitFor(() => {
      expect(apiMocks.get.mock.calls.length).toBeGreaterThan(llamadasIniciales);
    });
  });

  it('muestra un error si no se pueden cargar los datos', async () => {
    seedAdmin();
    apiMocks.get.mockRejectedValue(new Error('network down'));
    renderWithProviders(<DashboardAdminPage />);

    expect(
      await screen.findByText(
        'No se pudieron cargar los datos del panel de administración.',
      ),
    ).toBeInTheDocument();
  });
});
