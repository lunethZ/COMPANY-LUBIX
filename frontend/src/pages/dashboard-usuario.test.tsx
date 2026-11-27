import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuyerDashboard from './dashboard-usuario';
import { renderWithProviders } from '../test/utils';

// Se dobla el cliente axios: ninguna prueba debe tocar la red.
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

const endUser = {
  id: 7,
  name: 'Ana Gómez',
  email: 'ana@x.com',
  role_id: 'user',
};

const dashboardData = {
  fullName: 'Ana Gómez',
  email: 'ana@x.com',
  tell: '3001234567',
  memberSince: '2026-01-02T10:00:00',
  avatar: '',
  banner: '',
  totalOrders: 3,
  totalSpent: 150000,
  savedProducts: 2,
  addresses: 1,
};

const favorite = {
  product: {
    id: 'p1',
    name: 'Mouse Gamer',
    descripcion: 'Mouse con luces',
    price: 25000,
    discount_enable: true,
    discount_value: 10,
    images: ['files/mouse.png'],
    stock: 5,
    company_name: 'TechStore',
  },
};

const pendingOrder = {
  id: 'ORD-1234ABCD',
  created_at: '2026-01-05T10:00:00',
  status: 'pending',
  items: [{ id: 'i1', name: 'Mouse Gamer', price: 25000, quantity: 2 }],
  subtotal: 50000,
  discount: 0,
  shipping: 0,
  total: 50000,
  payment_method: 'tarjeta',
  address: 'Calle 1 #2-3',
  city: 'Bogotá',
  recipient: 'Ana Gómez',
  estimated_delivery: '2026-02-01T10:00:00',
  delivery_progress: 40,
};

const deliveredOrder = {
  id: 'ORD-5678EFGH',
  created_at: '2025-12-01T10:00:00',
  status: 'delivered',
  items: [{ id: 'i2', name: 'Teclado Mecánico', price: 70000, quantity: 1 }],
  subtotal: 70000,
  discount: 0,
  shipping: 0,
  total: 70000,
  payment_method: 'pse',
  address: 'Carrera 9 #10-11',
  city: 'Medellín',
  recipient: 'Ana Gómez',
  estimated_delivery: '',
  delivery_progress: 100,
};

const address = {
  id: 'addr1',
  label: 'Casa',
  address: 'Calle 1 #2-3',
  city: 'Bogotá',
  department: 'Cundinamarca',
  postal_code: '110111',
  is_default: true,
};

const exportData = {
  fullName: 'Ana Gómez',
  email: 'ana@x.com',
  tell: '3001234567',
  role: 'user',
  verified: true,
  memberSince: '2026-01-02T10:00:00',
};

interface MockGetOptions {
  favorites?: unknown[];
  orders?: unknown[];
  addresses?: unknown[];
}

const mockGet = ({
  favorites = [favorite],
  orders = [pendingOrder, deliveredOrder],
  addresses = [address],
}: MockGetOptions = {}) => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') return Promise.resolve({ data: { items: [] } });
    if (url === '/user/dashboard/me') {
      return Promise.resolve({ data: dashboardData });
    }
    if (url === '/user/favorites') return Promise.resolve({ data: favorites });
    if (url === '/user/orders') return Promise.resolve({ data: orders });
    if (url === '/user/addresses') return Promise.resolve({ data: addresses });
    if (url === '/user/export') return Promise.resolve({ data: exportData });
    return Promise.resolve({ data: [] });
  });
};

const seedUser = () => {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem('user', JSON.stringify(endUser));
};

const openDrawer = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByRole('heading', { name: 'Ana Gómez' });
  await user.click(screen.getByRole('button', { name: /Editar perfil/ }));
  await screen.findByRole('heading', { name: 'Mi perfil' });
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(window, 'prompt').mockReturnValue('INHABILITAR');
});

describe('Panel del usuario comprador', () => {
  it('carga el resumen con los datos del backend y los favoritos', async () => {
    seedUser();
    mockGet();
    const user = userEvent.setup();
    renderWithProviders(<BuyerDashboard />);

    expect(
      await screen.findByRole('heading', { name: 'Ana Gómez' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('ana@x.com')).toBeInTheDocument();
    expect(screen.getByText(/Miembro desde/)).toBeInTheDocument();
    expect(screen.getByText('2 compras realizadas')).toBeInTheDocument();

    // Indicadores del resumen (el total se recalcula con los pedidos).
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(
      screen.getByText(`$${(120000).toLocaleString()}`),
    ).toBeInTheDocument();
    expect(screen.getByText('Direcciones')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);

    // Sección de productos guardados.
    expect(
      screen.getByRole('heading', { name: 'Productos guardados' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mouse Gamer')).toBeInTheDocument();

    // Quitar un favorito desde el resumen.
    const card = screen
      .getByRole('heading', { name: 'Productos guardados' })
      .closest('.rounded-xl') as HTMLElement;
    const botones = within(card).getAllByRole('button');
    await user.click(botones[1]);
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/favorites/p1');
    });

    // "Ver todos" lleva a la pestaña de guardados.
    await user.click(screen.getByRole('button', { name: /Ver todos/ }));
    expect(
      await screen.findByRole('heading', { name: 'Productos guardados (1)' }),
    ).toBeInTheDocument();

    expect(apiMocks.get).toHaveBeenCalledWith('/user/dashboard/me');
    expect(apiMocks.get).toHaveBeenCalledWith('/user/favorites');
    expect(apiMocks.get).toHaveBeenCalledWith('/user/orders');
  });

  it('navega por pedidos, cancela uno y muestra entregados y productos a reportar', async () => {
    seedUser();
    mockGet();
    apiMocks.patch.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<BuyerDashboard />);

    await user.click(await screen.findByRole('button', { name: /Mis Pedidos/ }));

    expect(
      await screen.findByRole('heading', { name: 'Todos mis pedidos (2)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('ORD-1234ABCD')).toBeInTheDocument();
    expect(screen.getByText('ORD-5678EFGH')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    // Desplegar el detalle del pedido pendiente.
    await user.click(screen.getByText('ORD-1234ABCD'));

    expect(screen.getByText('Estado del envío')).toBeInTheDocument();
    expect(screen.getByText(/Llega estimado:/)).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 2')).toBeInTheDocument();
    expect(screen.getByText('GRATIS')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta de crédito/débito')).toBeInTheDocument();
    expect(screen.getByText('Calle 1 #2-3, Bogotá')).toBeInTheDocument();

    // Cancelar el pedido.
    await user.click(screen.getByRole('button', { name: /Cancelar pedido/ }));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/user/orders/ORD-1234ABCD/cancel',
      );
    });
    expect((await screen.findAllByText('Cancelado')).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /Cancelar pedido/ }),
    ).not.toBeInTheDocument();

    // Pestaña de productos entregados.
    await user.click(
      screen.getByRole('button', { name: /Producto Entregado/ }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Productos Entregados' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Producto entregado e integrado'),
    ).toBeInTheDocument();
    expect(screen.getByText('Teclado Mecánico')).toBeInTheDocument();

    // Pestaña para reportar productos de los pedidos.
    await user.click(screen.getByRole('button', { name: /Eliminar Producto/ }));
    expect(
      await screen.findByRole('heading', { name: 'Eliminar Producto' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mouse Gamer'),
    ).toBeInTheDocument();
    const reportar = screen.getAllByRole('button', { name: /Reportar/ });
    expect(reportar).toHaveLength(2);
    await user.click(reportar[0]);
  });

  it('gestiona los productos guardados y los agrega al carrito', async () => {
    seedUser();
    mockGet();
    apiMocks.post.mockResolvedValue({ data: { items: [] } });
    const user = userEvent.setup();
    renderWithProviders(<BuyerDashboard />);

    await user.click(await screen.findByRole('button', { name: /Guardados/ }));

    expect(
      await screen.findByRole('heading', { name: 'Productos guardados (1)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mouse Gamer')).toBeInTheDocument();

    // Abrir el detalle del producto navega a su página.
    await user.click(screen.getByAltText('Mouse Gamer'));
    await user.click(screen.getByText('Mouse Gamer'));

    await user.click(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    );
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/cart/items', {
        product_id: 'p1',
        quantity: 1,
      });
    });

    // Quitar el favorito con el corazón de la tarjeta.
    const tarjeta = screen.getByText('Mouse Gamer').closest('.group') as HTMLElement;
    await user.click(within(tarjeta).getAllByRole('button')[0]);
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/favorites/p1');
    });

    // Ir a pagar (navegación interna del MemoryRouter).
    await user.click(screen.getByRole('button', { name: 'Pagar' }));
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/cart/items', {
        product_id: 'p1',
        quantity: 1,
      });
    });
  });

  it('muestra los estados vacíos cuando no hay favoritos ni pedidos', async () => {
    seedUser();
    mockGet({ favorites: [], orders: [] });
    const user = userEvent.setup();
    renderWithProviders(<BuyerDashboard />);

    expect(
      await screen.findByText('Bienvenido a Lubix'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mis Pedidos/ }));
    expect(
      await screen.findByRole('heading', { name: 'Todos mis pedidos (0)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('No tienes pedidos aún')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Guardados/ }));
    expect(
      await screen.findByRole('heading', { name: 'Productos guardados (0)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No tienes productos guardados'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Producto Entregado/ }),
    );
    expect(
      screen.getByText('No tienes productos Entregados aún'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Eliminar Producto/ }));
    expect(
      screen.getByText('No tienes productos en pedidos'),
    ).toBeInTheDocument();
  });

  it('abre el perfil, guarda cambios, cambia la contraseña y gestiona direcciones', async () => {
    seedUser();
    mockGet();
    apiMocks.patch.mockResolvedValue({ data: {} });
    apiMocks.post.mockResolvedValue({ data: {} });
    apiMocks.delete.mockResolvedValue({ data: {} });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lubix');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();
    const { container } = renderWithProviders(<BuyerDashboard />);

    await openDrawer(user);

    expect(apiMocks.get).toHaveBeenCalledWith('/user/addresses');
    expect(await screen.findByText('Casa')).toBeInTheDocument();
    expect(screen.getByText('(principal)')).toBeInTheDocument();
    expect(screen.getByText('ana@x.com')).toBeInTheDocument();

    // Guardar los datos personales.
    const nombre = screen.getByDisplayValue('Ana Gómez');
    await user.clear(nombre);
    await user.type(nombre, 'Ana María');
    const telefono = screen.getByDisplayValue('3001234567');
    await user.clear(telefono);
    await user.type(telefono, '3109999999');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith('/user/profile', {
        fullName: 'Ana María',
        tell: '3109999999',
      });
    });
    expect(
      await screen.findByText('Perfil actualizado correctamente'),
    ).toBeInTheDocument();

    // Cambiar la contraseña.
    const passwords = container.querySelectorAll('input[type="password"]');
    expect(passwords).toHaveLength(2);
    await user.type(passwords[0], 'actual123');
    await user.type(passwords[1], 'nueva123');
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contraseña' }),
    );
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith('/user/change-password', {
        current_password: 'actual123',
        new_password: 'nueva123',
      });
    });
    expect(
      await screen.findByText('Contraseña actualizada correctamente'),
    ).toBeInTheDocument();

    // Validación de campos obligatorios de dirección.
    await user.click(
      screen.getByRole('button', { name: 'Agregar dirección' }),
    );
    expect(
      screen.getByText('Dirección, ciudad y departamento son obligatorios'),
    ).toBeInTheDocument();

    // Agregar una dirección válida.
    await user.type(
      screen.getByPlaceholderText('Etiqueta (Casa, Oficina)'),
      'Oficina',
    );
    await user.type(screen.getByPlaceholderText('Código postal'), '110111');
    await user.type(screen.getByPlaceholderText('Dirección'), 'Calle 5 #6-7');
    await user.type(screen.getByPlaceholderText('Ciudad'), 'Cali');
    await user.type(
      screen.getByPlaceholderText('Departamento'),
      'Valle del Cauca',
    );
    await user.click(
      screen.getByRole('checkbox', { name: 'Usar como dirección principal' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Agregar dirección' }),
    );
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/addresses', {
        label: 'Oficina',
        address: 'Calle 5 #6-7',
        city: 'Cali',
        department: 'Valle del Cauca',
        postal_code: '110111',
        is_default: true,
      });
    });
    expect(
      await screen.findByText('Dirección agregada correctamente'),
    ).toBeInTheDocument();

    // Eliminar una dirección.
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(apiMocks.delete).toHaveBeenCalledWith('/user/addresses/addr1');
    });

    // Descargar los datos personales.
    await user.click(
      screen.getByRole('button', { name: /Descargar mis datos/ }),
    );
    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith('/user/export');
    });
    expect(URL.createObjectURL).toHaveBeenCalled();

    // Solicitar la inhabilitación de la cuenta.
    await user.click(
      screen.getByRole('button', { name: /Solicitar inhabilitación/ }),
    );
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/pqrs', {
        type: 'inhabilitar_cuenta',
        subject: 'Solicitud de inhabilitación de cuenta',
        description: 'El usuario ha solicitado la inhabilitación de su cuenta.',
      });
    });
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Tu solicitud ha sido enviada'),
    );

    // Cerrar el panel con el fondo y con el botón de la X.
    fireEvent.click(
      container.querySelector('.fixed.inset-0 > .absolute.inset-0') as HTMLElement,
    );
    expect(
      screen.queryByRole('heading', { name: 'Mi perfil' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }));
    const cerrar = container.querySelector(
      '.fixed.inset-0 button.w-8.h-8',
    ) as HTMLElement;
    await user.click(cerrar);
    expect(
      screen.queryByRole('heading', { name: 'Mi perfil' }),
    ).not.toBeInTheDocument();
  });

  it('sube el avatar y el banner del perfil', async () => {
    seedUser();
    mockGet();
    apiMocks.post.mockResolvedValue({
      data: { url: 'files/avatar.png', avatar: 'files/avatar.png' },
    });
    const { container } = renderWithProviders(<BuyerDashboard />);

    await screen.findByRole('heading', { name: 'Ana Gómez' });

    const inputs = () =>
      container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(inputs()).toHaveLength(2);

    // Sin archivo seleccionado no se sube nada.
    fireEvent.change(inputs()[1], { target: { files: [] } });
    expect(apiMocks.post).not.toHaveBeenCalled();

    const avatarFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(inputs()[1], { target: { files: [avatarFile] } });
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/user/avatar/upload',
        expect.any(FormData),
      );
    });

    const bannerFile = new File(['banner'], 'banner.png', { type: 'image/png' });
    fireEvent.change(inputs()[0], { target: { files: [bannerFile] } });
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/user/banner/upload',
        expect.any(FormData),
      );
    });
  });

  it('maneja errores de carga y de las acciones del perfil', async () => {
    seedUser();
    apiMocks.get.mockRejectedValue(new Error('network down'));
    apiMocks.patch.mockRejectedValue(new Error('fail'));
    apiMocks.post.mockResolvedValue({ data: {} });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lubix');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();
    const { container } = renderWithProviders(<BuyerDashboard />);

    // Si falla /user/dashboard/me se usa el usuario de la sesión.
    expect(
      await screen.findByRole('heading', { name: 'Ana Gómez' }),
    ).toBeInTheDocument();

    await openDrawer(user);
    expect(screen.getByText('No tienes direcciones guardadas')).toBeInTheDocument();

    // Error al guardar el perfil (sin detalle del backend).
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(
      await screen.findByText('Error al actualizar el perfil'),
    ).toBeInTheDocument();

    // Error al cambiar la contraseña.
    const passwords = container.querySelectorAll('input[type="password"]');
    await user.type(passwords[0], 'x');
    await user.type(passwords[1], 'y');
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contraseña' }),
    );
    expect(
      await screen.findByText('Error al cambiar la contraseña'),
    ).toBeInTheDocument();

    // Error con detalle de validación en forma de lista al agregar dirección.
    apiMocks.post.mockRejectedValueOnce({
      response: { data: { detail: [{ msg: 'La dirección es inválida' }] } },
    });
    await user.type(screen.getByPlaceholderText('Dirección'), 'Calle 9');
    await user.type(screen.getByPlaceholderText('Ciudad'), 'Cali');
    await user.type(screen.getByPlaceholderText('Departamento'), 'Valle');
    await user.click(
      screen.getByRole('button', { name: 'Agregar dirección' }),
    );
    expect(
      await screen.findByText('La dirección es inválida'),
    ).toBeInTheDocument();

    // La descarga tolera que fallen los recursos (cada uno tiene su catch).
    await user.click(
      screen.getByRole('button', { name: /Descargar mis datos/ }),
    );
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('informa errores al cancelar un pedido y al eliminar una dirección', async () => {
    seedUser();
    mockGet();
    apiMocks.patch.mockRejectedValue({
      response: { data: { detail: 'No se puede cancelar' } },
    });
    apiMocks.delete.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderWithProviders(<BuyerDashboard />);

    await user.click(await screen.findByRole('button', { name: /Mis Pedidos/ }));
    await user.click(await screen.findByText('ORD-1234ABCD'));
    await user.click(screen.getByRole('button', { name: /Cancelar pedido/ }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('No se puede cancelar');
    });

    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(apiMocks.delete).toHaveBeenCalledWith('/user/addresses/addr1');
    });
  });

  it('respeta confirmaciones canceladas e informa fallos de acciones', async () => {
    seedUser();
    mockGet();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('sin blob');
    });
    const user = userEvent.setup();
    const { container } = renderWithProviders(<BuyerDashboard />);

    // Cancelar un pedido sin confirmar no llama al backend.
    vi.mocked(window.confirm).mockReturnValue(false);
    await user.click(await screen.findByRole('button', { name: /Mis Pedidos/ }));
    await user.click(await screen.findByText('ORD-1234ABCD'));
    await user.click(screen.getByRole('button', { name: /Cancelar pedido/ }));
    expect(apiMocks.patch).not.toHaveBeenCalled();

    // Solicitar inhabilitación sin confirmar tampoco.
    await openDrawer(user);
    await user.click(
      screen.getByRole('button', { name: /Solicitar inhabilitación/ }),
    );
    expect(apiMocks.post).not.toHaveBeenCalled();

    // Confirmación simple pero texto de doble confirmación incorrecto.
    vi.mocked(window.confirm).mockReturnValue(true);
    vi.mocked(window.prompt).mockReturnValue('NO');
    await user.click(
      screen.getByRole('button', { name: /Solicitar inhabilitación/ }),
    );
    expect(apiMocks.post).not.toHaveBeenCalled();

    // El backend rechaza la solicitud y se informa con su detalle.
    vi.mocked(window.prompt).mockReturnValue('INHABILITAR');
    apiMocks.post.mockRejectedValueOnce({
      response: { data: { detail: 'No permitido' } },
    });
    await user.click(
      screen.getByRole('button', { name: /Solicitar inhabilitación/ }),
    );
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('No permitido');
    });

    // Error genérico (sin detalle) al agregar una dirección.
    apiMocks.post.mockRejectedValue(new Error('fail'));
    await user.type(screen.getByPlaceholderText('Dirección'), 'Calle 9');
    await user.type(screen.getByPlaceholderText('Ciudad'), 'Cali');
    await user.type(screen.getByPlaceholderText('Departamento'), 'Valle');
    await user.click(
      screen.getByRole('button', { name: 'Agregar dirección' }),
    );
    expect(
      await screen.findByText('Error al agregar la dirección'),
    ).toBeInTheDocument();

    // Si falla la generación del archivo de descarga se registra el error.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await user.click(
      screen.getByRole('button', { name: /Descargar mis datos/ }),
    );
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Error exporting data:',
        expect.any(Error),
      );
    });
    expect(container).toBeTruthy();
  });

  it('resuelve las URLs de las imágenes de los favoritos', async () => {
    seedUser();
    mockGet({
      favorites: [
        {
          product: {
            id: 'p2',
            name: 'Sin Imagen',
            price: 1000,
            stock: 1,
            company_name: 'Tienda',
          },
        },
        {
          product: {
            id: 'p3',
            name: 'Imagen Remota',
            price: 2000,
            stock: 1,
            company_name: 'Tienda',
            images: ['https://cdn.example.com/p3.png'],
          },
        },
      ],
    });
    renderWithProviders(<BuyerDashboard />);

    expect(await screen.findByText('Sin Imagen')).toBeInTheDocument();
    expect(screen.getByText('Imagen Remota')).toBeInTheDocument();
  });

  it('registra errores al quitar favoritos y subir imágenes', async () => {
    seedUser();
    mockGet();
    apiMocks.post.mockRejectedValue(new Error('fail'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    const { container } = renderWithProviders(<BuyerDashboard />);

    await screen.findByRole('heading', { name: 'Ana Gómez' });

    // Quitar un favorito que el backend rechaza.
    await user.click(screen.getByRole('button', { name: /Guardados/ }));
    const tarjeta = (
      await screen.findByText('Mouse Gamer')
    ).closest('.group') as HTMLElement;
    await user.click(within(tarjeta).getAllByRole('button')[0]);
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/favorites/p1');
    });

    // Subida de avatar y banner con error del backend.
    const inputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="file"]',
    );
    fireEvent.change(inputs[1], {
      target: { files: [new File(['a'], 'a.png', { type: 'image/png' })] },
    });
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/user/avatar/upload',
        expect.any(FormData),
      );
    });

    // Banner sin archivo no hace nada.
    fireEvent.change(inputs[0], { target: { files: [] } });
    fireEvent.change(inputs[0], {
      target: { files: [new File(['b'], 'b.png', { type: 'image/png' })] },
    });
    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/user/banner/upload',
        expect.any(FormData),
      );
    });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
