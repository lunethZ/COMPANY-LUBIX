import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import DashboardUsuario from '../dashboard-usuario';
import { renderWithProviders } from '../../test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('access_token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({
    id: 1,
    name: 'Ana',
    email: 'ana@ejemplo.com',
    role_id: 'user',
  }));
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') {
      return Promise.resolve({ data: { items: [] } });
    }
    if (url === '/user/dashboard/me') {
      return Promise.resolve({
        data: {
          fullName: 'Ana Pérez',
          email: 'ana@ejemplo.com',
          avatar: 'users/avatar.png',
          banner: 'users/banner.png',
          totalOrders: 1,
          totalSpent: 85000,
        },
      });
    }
    if (url === '/user/favorites') {
      return Promise.resolve({
        data: [{
          product: {
            id: 'p1',
            name: 'Mouse Gamer',
            descripcion: 'Mouse inalámbrico',
            price: 85000,
            stock: 5,
            images: ['products/mouse.png'],
            company_name: 'Lubix Store',
          },
        }],
      });
    }
    if (url === '/user/orders') {
      return Promise.resolve({
        data: [{
          id: 'ord-1',
          created_at: '2026-01-01',
          status: 'pending',
          items: [{ id: 'i1', name: 'Mouse Gamer', quantity: 1, price: 85000 }],
          subtotal: 85000,
          discount: 0,
          shipping: 0,
          total: 85000,
          payment_method: 'Tarjeta',
          address: 'Calle 1',
          city: 'Bogotá',
          recipient: 'Ana',
          estimated_delivery: '2026-01-05',
          delivery_progress: 25,
        }],
      });
    }
    if (url === '/user/addresses') {
      return Promise.resolve({
        data: [{ id: 'a1', label: 'Casa', address: 'Calle 1', city: 'Bogotá', department: 'Cundinamarca', is_default: true }],
      });
    }
    if (url === '/user/export') {
      return Promise.resolve({
        data: { fullName: 'Ana Pérez', email: 'ana@ejemplo.com', tell: '3001234567', role: 'user', verified: true, memberSince: '2025-01-01' },
      });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('DashboardUsuario', () => {
  it('renderiza el panel y resuelve avatar y favoritos relativos', async () => {
    renderWithProviders(<DashboardUsuario />);

    const avatar = await screen.findByAltText('Avatar');
    expect(avatar).toHaveAttribute('src', expect.stringContaining('/files/users/avatar.png'));
    expect(await screen.findByAltText('Mouse Gamer')).toHaveAttribute(
      'src',
      expect.stringContaining('/files/products/mouse.png'),
    );
  });

  it('lista pedidos y muestra el mensaje de error al cancelar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    apiMocks.patch.mockRejectedValueOnce({ response: { data: { detail: 'No se puede cancelar' } } });

    renderWithProviders(<DashboardUsuario />);
    await screen.findByAltText('Avatar');

    fireEvent.click(screen.getByRole('button', { name: 'Mis Pedidos' }));
    const status = await screen.findByText('Pendiente');
    fireEvent.click(status.closest('button') as HTMLButtonElement);

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No se puede cancelar');
    });
  });

  it('muestra errores de validación del backend al agregar una dirección', async () => {
    apiMocks.post.mockRejectedValueOnce({
      response: { data: { detail: [{ msg: 'Código postal inválido' }] } },
    });

    renderWithProviders(<DashboardUsuario />);
    await screen.findByAltText('Avatar');

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    await screen.findByPlaceholderText('Dirección');

    fireEvent.change(screen.getByPlaceholderText('Dirección'), { target: { value: 'Calle 2' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad'), { target: { value: 'Medellín' } });
    fireEvent.change(screen.getByPlaceholderText('Departamento'), { target: { value: 'Antioquia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar dirección' }));

    expect(await screen.findByText('Código postal inválido')).toBeInTheDocument();
  });

  it('descarga los datos personales como HTML', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:lubix');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DashboardUsuario />);
    await screen.findByAltText('Avatar');

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Descargar mis datos' }));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(createObjectURL.mock.calls[0][0]).toHaveProperty('type', 'text/html');
    });
  });

  it('muestra el error al solicitar la inhabilitación de la cuenta', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockReturnValue('INHABILITAR');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    apiMocks.post.mockRejectedValueOnce({ response: { data: { detail: 'No autorizado' } } });

    renderWithProviders(<DashboardUsuario />);
    await screen.findByAltText('Avatar');

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Solicitar inhabilitación de cuenta' }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No autorizado');
    });
  });
});
