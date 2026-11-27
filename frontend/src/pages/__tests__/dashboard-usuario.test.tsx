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

  it('renderiza en tema oscuro y cubre el perfil sin banner ni avatar', async () => {
    localStorage.setItem('theme', 'dark');
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:lubix'), writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [] } });
      if (url === '/user/dashboard/me') return Promise.resolve({ data: {} });
      return Promise.resolve({ data: [] });
    });
    apiMocks.patch.mockResolvedValue({ data: {} });

    renderWithProviders(<DashboardUsuario />);

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.queryByAltText('Avatar')).not.toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByText('Bienvenido a Lubix')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    expect(await screen.findByText('No tienes direcciones guardadas')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Ana'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Perfil actualizado correctamente')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Descargar mis datos' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Mis Pedidos' }));
    expect(await screen.findByText('No tienes pedidos aún')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Producto Entregado' }));
    expect(await screen.findByText('No tienes productos Entregados aún')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Producto' }));
    expect(await screen.findByText('No tienes productos en pedidos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardados' }));
    expect(await screen.findByText('No tienes productos guardados')).toBeInTheDocument();
  });

  it('muestra pedidos cancelados, entregados y confirmados', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const makeOrder = (over: Record<string, unknown>) => ({
      id: 'ord-x',
      created_at: '2026-01-01',
      status: 'pending',
      items: [{ id: 'it-1', name: 'Mouse', quantity: 1, price: 10000 }],
      subtotal: 10000,
      discount: 0,
      shipping: 0,
      total: 10000,
      payment_method: 'tarjeta',
      address: 'Calle 1',
      city: 'Bogotá',
      recipient: 'Ana',
      estimated_delivery: '2026-01-05',
      delivery_progress: 25,
      ...over,
    });
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [] } });
      if (url === '/user/dashboard/me') return Promise.resolve({ data: { fullName: 'Ana' } });
      if (url === '/user/favorites') return Promise.resolve({ data: [] });
      if (url === '/user/orders') {
        return Promise.resolve({
          data: [
            makeOrder({ id: 'ord-cancel', status: 'cancelled', delivery_progress: 0, shipping: 15000, total: 25000 }),
            makeOrder({ id: 'ord-delivered', status: 'delivered', delivery_progress: 100, payment_method: 'efectivo' }),
            makeOrder({ id: 'ord-confirmed', status: 'confirmed', delivery_progress: 50, payment_method: 'pse' }),
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<DashboardUsuario />);
    await screen.findByRole('heading', { name: 'Ana' });
    fireEvent.click(screen.getByRole('button', { name: 'Mis Pedidos' }));

    fireEvent.click((await screen.findByText('ord-cancel')).closest('button') as HTMLButtonElement);
    expect(await screen.findByText('$15.000')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta de crédito/débito')).toBeInTheDocument();
    expect(screen.queryByText(/Llega estimado/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('ord-delivered').closest('button') as HTMLButtonElement);
    expect(await screen.findByText('GRATIS')).toBeInTheDocument();
    expect(screen.getByText('Pago contra entrega (efectivo)')).toBeInTheDocument();
    expect(screen.queryByText(/Llega estimado/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('ord-confirmed').closest('button') as HTMLButtonElement);
    expect(await screen.findByText('PSE')).toBeInTheDocument();
    expect(screen.getByText(/Llega estimado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(apiMocks.patch).not.toHaveBeenCalled();
  });

  it('cubre las pestañas de guardados, entregados y eliminación', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [] } });
      if (url === '/user/dashboard/me') return Promise.resolve({ data: { fullName: 'Ana' } });
      if (url === '/user/favorites') {
        return Promise.resolve({
          data: [
            { product: { id: 'p1', name: 'Mouse', descripcion: 'Mouse', price: 85000, stock: 5, images: ['products/mouse.png'], company_name: 'Lubix' } },
            { product: { id: 'p2', name: 'Teclado', descripcion: 'Teclado', price: 120000, stock: 3, images: [], discount_enable: true, discount_value: 10 } },
          ],
        });
      }
      if (url === '/user/orders') {
        return Promise.resolve({
          data: [{
            id: 'ord-1',
            created_at: '2026-01-01',
            status: 'delivered',
            items: [{ id: 'it-1', name: 'Mouse', quantity: 1, price: 85000 }],
            subtotal: 85000,
            discount: 0,
            shipping: 0,
            total: 85000,
            payment_method: 'tarjeta',
            address: 'Calle 1',
            city: 'Bogotá',
            recipient: 'Ana',
            estimated_delivery: '',
            delivery_progress: 100,
          }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<DashboardUsuario />);
    await screen.findByRole('heading', { name: 'Ana' });

    fireEvent.click(screen.getByRole('button', { name: 'Guardados' }));
    expect(await screen.findByText('Teclado')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Agregar al carrito' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Pagar' })[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Producto Entregado' }));
    expect(await screen.findByText('Producto entregado e integrado')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Producto' }));
    expect(await screen.findByRole('button', { name: 'Reportar' })).toBeInTheDocument();
  });

  it('valida direcciones y cubre acciones del cajón de perfil', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('NO');
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [] } });
      if (url === '/user/dashboard/me') return Promise.reject(new Error('offline'));
      if (url === '/user/addresses') {
        return Promise.resolve({ data: [{ id: 'a1', address: 'Calle 1', city: 'Bogotá', department: 'Cundinamarca' }] });
      }
      return Promise.resolve({ data: [] });
    });
    apiMocks.post.mockResolvedValue({ data: {} });
    apiMocks.patch.mockResolvedValue({ data: {} });
    apiMocks.delete.mockResolvedValue({ data: {} });

    const { container } = renderWithProviders(<DashboardUsuario />);

    // Sin /user/dashboard/me, el panel cae al usuario de localStorage.
    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    expect(await screen.findByText('Calle 1, Bogotá, Cundinamarca')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Agregar dirección' }));
    expect(await screen.findByText('Dirección, ciudad y departamento son obligatorios')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Dirección'), { target: { value: 'Calle 2' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad'), { target: { value: 'Medellín' } });
    fireEvent.change(screen.getByPlaceholderText('Departamento'), { target: { value: 'Antioquia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar dirección' }));
    expect(await screen.findByText('Dirección agregada correctamente')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Dirección'), { target: { value: 'Calle 3' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad'), { target: { value: 'Cali' } });
    fireEvent.change(screen.getByPlaceholderText('Departamento'), { target: { value: 'Valle' } });
    apiMocks.post.mockRejectedValueOnce({ response: { data: { detail: 'Fallo servidor' } } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar dirección' }));
    expect(await screen.findByText('Fallo servidor')).toBeInTheDocument();

    const passwordInputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
    fireEvent.change(passwordInputs[0], { target: { value: 'actual' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'nueva' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await screen.findByText('Contraseña actualizada correctamente')).toBeInTheDocument();

    apiMocks.patch.mockRejectedValueOnce({ response: { data: { detail: 'Nombre inválido' } } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Nombre inválido')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(apiMocks.delete).toHaveBeenCalled());

    const disableButton = screen.getByRole('button', { name: 'Solicitar inhabilitación de cuenta' });
    fireEvent.click(disableButton);
    confirmSpy.mockReturnValue(true);
    fireEvent.click(disableButton);
    promptSpy.mockReturnValue('INHABILITAR');
    fireEvent.click(disableButton);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('enviada correctamente'));
    });
  });

  it('sube avatar y banner desde el encabezado', async () => {
    const { container } = renderWithProviders(<DashboardUsuario />);
    await screen.findByAltText('Avatar');

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs).toHaveLength(2);

    apiMocks.post.mockResolvedValueOnce({ data: { url: 'users/banner-new.png' } });
    fireEvent.change(fileInputs[0], { target: { files: [new File(['x'], 'banner.png', { type: 'image/png' })] } });
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/banner/upload', expect.any(FormData));
    });

    apiMocks.post.mockResolvedValueOnce({ data: { url: 'users/avatar-new.png' } });
    fireEvent.change(fileInputs[1], { target: { files: [new File(['x'], 'avatar.png', { type: 'image/png' })] } });
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/avatar/upload', expect.any(FormData));
    });
  });
});
