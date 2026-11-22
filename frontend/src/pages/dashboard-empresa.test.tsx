import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerDashboard from './dashboard-empresa';
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
    get: apiMocks.get,
    post: apiMocks.post,
    patch: apiMocks.patch,
    delete: apiMocks.delete,
    defaults: { headers: { common: {} } },
  },
}));

const companyUser = {
  id: 7,
  name: 'TechStore SAS',
  email: 'dueno@techstore.com',
  role_id: 'empresa' as const,
};

interface ProductFixture {
  id: string;
  name: string;
  price: number;
  images: string[];
  sold: number;
  views: number;
  stock: number;
  status: string;
  catalog_name: string;
  technical_spec?: Record<string, string>;
  discount_value?: number;
  descripcion?: string;
}

interface OrderItemFixture {
  id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface OrderFixture {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  recipient: string;
  address: string;
  city: string;
  department: string;
  postal_code: string;
  created_at: string;
  estimated_delivery: string;
  delivery_progress: number;
  buyer_email: string;
  buyer_name: string;
  items: OrderItemFixture[];
}

interface ReviewFixture {
  id: string;
  user_name?: string;
  comment?: string;
  rating: number;
  created_at: string;
}

const productA: ProductFixture = {
  id: 'p1',
  name: 'Celular Galaxy S24',
  price: 3500000,
  images: ['https://cdn.lubix.com/celular.jpg'],
  sold: 25,
  views: 120,
  stock: 12,
  status: 'active',
  catalog_name: 'Celulares',
  technical_spec: {
    brand: 'Samsung',
    model: 'Galaxy S24',
    warranty: '12 meses',
    weight: '0.25 kg',
    dimensions: '15 x 7 x 0.9 cm',
  },
  discount_value: 10,
  descripcion: 'Celular de alta gama',
};

const productB: ProductFixture = {
  id: 'p2',
  name: 'Tablet Galaxy Tab',
  price: 1800000,
  images: [],
  sold: 5,
  views: 30,
  stock: 0,
  status: 'inactive',
  catalog_name: 'Tablets',
};

const meData = {
  nameCompany: 'TechStore',
  emailCompany: 'tienda@techstore.com',
  tellCompany: '3001234567',
  memberAT: '2026-01-15T10:00:00',
  sales: 520,
  stars: 4.8,
  totalRevenue: 9000000,
  reviews: 42,
};

const profileData = {
  nameCompany: 'TechStore',
  emailCompany: 'tienda@techstore.com',
  tellCompany: '3001234567',
  logo: null as string | null,
  banner: null as string | null,
  completeSales: 0,
  averageRating: 0,
  totalRevenue: 0,
  totalReviews: 0,
};

const makeOrder = (overrides: Partial<OrderFixture> = {}): OrderFixture => ({
  id: 'ord-12345678',
  status: 'pending',
  subtotal: 3500000,
  discount: 0,
  shipping: 0,
  total: 3500000,
  payment_method: 'tarjeta',
  recipient: 'Juan Pérez',
  address: 'Calle 1 #2-3',
  city: 'Bogotá',
  department: 'Cundinamarca',
  postal_code: '110111',
  created_at: '2026-02-10T10:00:00',
  estimated_delivery: '2026-02-15',
  delivery_progress: 10,
  buyer_email: 'juan@x.com',
  buyer_name: 'Juan Pérez',
  items: [
    {
      id: 'i1',
      product_id: 'p1',
      name: 'Celular Galaxy S24',
      price: 3500000,
      quantity: 1,
    },
  ],
  ...overrides,
});

interface DashboardOptions {
  products?: ProductFixture[];
  orders?: OrderFixture[];
  reviewsByProduct?: Record<string, ReviewFixture[]>;
  me?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  productDetailError?: boolean;
}

const mockDashboard = (options: DashboardOptions = {}) => {
  const {
    products = [productA, productB],
    orders = [],
    reviewsByProduct = {},
    me = meData,
    profile = profileData,
    productDetailError = false,
  } = options;

  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') return Promise.resolve({ data: { items: [] } });
    if (url === '/company/dashboard/me') return Promise.resolve({ data: me });
    if (url === '/company/dashboard/my-profile') return Promise.resolve({ data: profile });
    if (url === '/company/products') return Promise.resolve({ data: products });
    if (url === '/company/orders') return Promise.resolve({ data: orders });
    if (url.startsWith('/company/products/')) {
      if (productDetailError) {
        return Promise.reject(new Error('product detail down'));
      }
      const id = url.split('/').pop();
      return Promise.resolve({ data: products.find((p) => p.id === id) ?? productA });
    }
    if (url.startsWith('/products/') && url.endsWith('/reviews')) {
      const id = url.split('/')[2];
      return Promise.resolve({ data: reviewsByProduct[id] ?? [] });
    }
    return Promise.resolve({ data: [] });
  });
};

const mockWrites = () => {
  apiMocks.post.mockImplementation((url: string) => {
    if (url === '/company/products/upload-image') {
      return Promise.resolve({ data: { url: 'https://cdn.lubix.com/subida.jpg' } });
    }
    return Promise.resolve({ data: {} });
  });
  apiMocks.patch.mockImplementation((url: string) => {
    if (url === '/company/dashboard/upload-logo') {
      return Promise.resolve({ data: { logo: 'logo.png' } });
    }
    if (url === '/company/dashboard/upload-banner') {
      return Promise.resolve({ data: { banner: '/files/banner.png' } });
    }
    return Promise.resolve({ data: {} });
  });
  apiMocks.delete.mockResolvedValue({ data: {} });
};

const seedCompany = () => {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem('user', JSON.stringify(companyUser));
};

const openProfileDrawer = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Editar perfil' }));
  await screen.findByRole('heading', { name: 'Editar perfil de tienda' });
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:preview'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Panel de empresa', () => {
  it('muestra un indicador de carga mientras llegan los datos', () => {
    seedCompany();
    apiMocks.get.mockImplementation(() => new Promise(() => {}));

    const { container } = renderWithProviders(<SellerDashboard />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('carga los datos y muestra productos, estadísticas y perfil', async () => {
    seedCompany();
    mockDashboard();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    expect(
      await screen.findByRole('heading', { name: 'TechStore' }),
    ).toBeInTheDocument();
    expect(screen.getByText('(42 reseñas)')).toBeInTheDocument();
    expect(screen.getByText('520 ventas')).toBeInTheDocument();
    expect(screen.getByText(/Miembro desde/)).toBeInTheDocument();
    expect(screen.getByText('Celular Galaxy S24')).toBeInTheDocument();
    expect(screen.getByText('Tablet Galaxy Tab')).toBeInTheDocument();
    expect(screen.getByText('Stock: 12')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByText('Desactivar')).toBeInTheDocument();
    expect(screen.getByText('Activar')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith('/company/dashboard/me');
      expect(apiMocks.get).toHaveBeenCalledWith('/company/dashboard/my-profile');
      expect(apiMocks.get).toHaveBeenCalledWith('/company/products');
      expect(apiMocks.get).toHaveBeenCalledWith('/company/orders');
    });

    await user.click(screen.getByRole('button', { name: 'Estadísticas' }));
    expect(screen.getByText('Productos activos')).toBeInTheDocument();
    expect(screen.getByText('Ventas totales')).toBeInTheDocument();
    expect(screen.getByText('Ingresos totales')).toBeInTheDocument();
    expect(screen.getByText('$9.0M')).toBeInTheDocument();
    expect(screen.getByText('Calificación')).toBeInTheDocument();
    expect(screen.getAllByText('4.8').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Rendimiento por producto' }),
    ).toBeInTheDocument();
    expect(screen.getByText('25 vendidos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mi Perfil' }));
    expect(screen.getByText('Información del vendedor')).toBeInTheDocument();
    expect(screen.getByText('Nombre de tienda')).toBeInTheDocument();
    expect(screen.getByText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByText('Teléfono')).toBeInTheDocument();
    expect(screen.getByText('Reputación y métricas')).toBeInTheDocument();
    expect(screen.getByText('Nivel de vendedor')).toBeInTheDocument();
    expect(screen.getByText('Diamond')).toBeInTheDocument();
    expect(screen.getByText('Progreso nivel')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar Información' }),
    ).toBeInTheDocument();
  });

  it('muestra los estados vacíos de productos, pedidos, estadísticas y reseñas', async () => {
    seedCompany();
    mockDashboard({
      products: [],
      orders: [],
      me: { ...meData, sales: 0, stars: 0, totalRevenue: 0, reviews: 0 },
    });
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    expect(
      await screen.findByText('No tienes productos aún'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pedidos' }));
    expect(screen.getByText('Pedidos recibidos (0)')).toBeInTheDocument();
    expect(screen.getByText('No tienes pedidos aún')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Estadísticas' }));
    expect(
      screen.getByText('No hay productos para mostrar'),
    ).toBeInTheDocument();
    expect(screen.getByText('$0.0M')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reseñas' }));
    expect(await screen.findByText('No hay reseñas aún')).toBeInTheDocument();
  });

  it('muestra un error si falla la carga y permite navegar igualmente', async () => {
    seedCompany();
    apiMocks.get.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    expect(
      await screen.findByText('No tienes productos aún'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reseñas' }));
    expect(await screen.findByText('No hay reseñas aún')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it.each([
    [520, 'Diamond', 100],
    [260, 'Platinum', 20],
    [60, 'Gold', 7],
    [15, 'Silver', 13],
    [5, 'Bronze', 50],
  ])(
    'calcula el nivel de vendedor con %i ventas',
    async (sales, level, progress) => {
      seedCompany();
      mockDashboard({ me: { ...meData, sales, totalRevenue: 0 } });
      const user = userEvent.setup();
      renderWithProviders(<SellerDashboard />);

      await screen.findByRole('heading', { name: 'TechStore' });
      await user.click(screen.getByRole('button', { name: 'Mi Perfil' }));

      expect(screen.getByText(level)).toBeInTheDocument();
      expect(screen.getByText(`${progress}%`)).toBeInTheDocument();
    },
  );

  it('activa, desactiva y elimina un producto', async () => {
    seedCompany();
    mockDashboard();
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith('/company/products/p1/status');
    });

    await user.click(screen.getAllByTitle('Eliminar producto')[0]);
    expect(
      screen.getByRole('heading', { name: '¿Eliminar producto?' }),
    ).toBeInTheDocument();

    // Cancela el primer intento y vuelve a abrir el diálogo.
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.queryByRole('heading', { name: '¿Eliminar producto?' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getAllByTitle('Eliminar producto')[0]);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(apiMocks.delete).toHaveBeenCalledWith('/company/products/p1');
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: '¿Eliminar producto?' }),
      ).not.toBeInTheDocument();
    });
  });

  it('crea un producto con imagen y valida los campos numéricos', async () => {
    seedCompany();
    mockDashboard({ products: [] });
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByText('No tienes productos aún');

    // Abre desde el estado vacío y cierra con la X.
    await user.click(screen.getAllByRole('button', { name: 'Agregar producto' })[1]);
    const firstModal = (
      await screen.findByRole('heading', { name: 'Agregar nuevo producto' })
    ).closest('.fixed') as HTMLElement;
    const closeButton = firstModal.querySelector('button');
    if (closeButton) await user.click(closeButton);
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Agregar nuevo producto' }),
      ).not.toBeInTheDocument();
    });

    // Reabre y cancela desde el pie del formulario.
    await user.click(screen.getAllByRole('button', { name: 'Agregar producto' })[1]);
    await screen.findByRole('heading', { name: 'Agregar nuevo producto' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Agregar nuevo producto' }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Agregar producto' })[1]);
    await screen.findByRole('heading', { name: 'Agregar nuevo producto' });

    const publish = screen.getByRole('button', { name: 'Publicar producto' });
    expect(publish).toBeDisabled();

    const price = screen.getByPlaceholderText('Ej: 3500000');
    const discount = screen.getByPlaceholderText('Ej: 15');

    await user.type(price, '0');
    expect(screen.getByText('El precio debe ser mayor a 0.')).toBeInTheDocument();

    await user.type(discount, '150');
    expect(
      screen.getByText('El descuento no puede superar el 100%'),
    ).toBeInTheDocument();

    await user.clear(price);
    await user.type(price, '3500000');
    await user.clear(discount);
    await user.type(discount, '10');

    await user.type(
      screen.getByPlaceholderText('Ej: Celular Samsung Galaxy S24'),
      'Televisor Smart 55',
    );
    await user.type(screen.getByPlaceholderText('Ej: 20'), '20');
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Televisores');
    await user.selectOptions(screen.getAllByRole('combobox')[1], '12');
    await user.type(
      screen.getByPlaceholderText(
        'Describe las características principales del producto...',
      ),
      'Televisor 4K de 55 pulgadas',
    );
    await user.type(screen.getByPlaceholderText('Ej: Samsung'), 'LG');
    await user.type(screen.getByPlaceholderText('Ej: Galaxy S24 Ultra'), 'OLED55');
    await user.type(screen.getByPlaceholderText('Ej: 0.25'), '12kg');
    await user.type(
      screen.getByPlaceholderText('Ej: 15 x 7 x 0.9 cm'),
      '123 x 70 x 8 cm',
    );

    // Imagen por URL con Enter: se agrega y se puede quitar.
    const imageUrl = screen.getByPlaceholderText('o pega URL https://...');
    await user.type(imageUrl, 'https://cdn.lubix.com/tv.jpg{Enter}');
    expect(screen.getByAltText('Imagen 1')).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();

    await user.click(screen.getByTitle('Quitar imagen'));
    expect(screen.queryByAltText('Imagen 1')).not.toBeInTheDocument();

    // Se vuelve a agregar con el botón y se suben archivos hasta el límite.
    await user.type(imageUrl, 'https://cdn.lubix.com/tv.jpg');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    const addModal = screen
      .getByRole('heading', { name: 'Agregar nuevo producto' })
      .closest('.fixed') as HTMLElement;
    const fileInput = addModal.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();
    if (fileInput) {
      await user.upload(fileInput, [
        new File(['foto1'], 'producto1.png', { type: 'image/png' }),
        new File(['foto2'], 'producto2.png', { type: 'image/png' }),
        new File(['foto3'], 'producto3.png', { type: 'image/png' }),
        new File(['foto4'], 'producto4.png', { type: 'image/png' }),
      ]);
    }
    expect(await screen.findByAltText('Imagen 5')).toBeInTheDocument();
    expect(screen.queryByAltText('Imagen 6')).not.toBeInTheDocument();

    expect(publish).toBeEnabled();
    await user.click(publish);

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/company/products/upload-image',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      );
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/company/products',
        expect.objectContaining({
          name: 'Televisor Smart 55',
          price: 3500000,
          stock: 20,
          discount_enable: true,
          discount_value: 10,
          catalog_name: 'Televisores',
          images: expect.arrayContaining([
            'https://cdn.lubix.com/tv.jpg',
            'https://cdn.lubix.com/subida.jpg',
          ]),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Agregar nuevo producto' }),
      ).not.toBeInTheDocument();
    });
  }, 30000);

  it('edita un producto y valida el precio antes de guardar', async () => {
    seedCompany();
    mockDashboard();
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await user.click(screen.getAllByTitle('Editar producto')[0]);
    const firstEdit = (
      await screen.findByRole('heading', { name: 'Editar producto' })
    ).closest('.fixed') as HTMLElement;

    // Cierra con la X y reabre para cancelar desde el pie.
    const closeButton = firstEdit.querySelector('button');
    if (closeButton) await user.click(closeButton);
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Editar producto' }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getAllByTitle('Editar producto')[0]);
    await screen.findByRole('heading', { name: 'Editar producto' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Editar producto' }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getAllByTitle('Editar producto')[0]);
    await screen.findByRole('heading', { name: 'Editar producto' });

    const price = screen.getByPlaceholderText('Ej: 3500000');
    await user.clear(price);
    await user.type(price, '0');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText('El precio debe ser mayor a 0.')).toBeInTheDocument();
    expect(apiMocks.patch).not.toHaveBeenCalled();

    await user.clear(price);
    await user.type(price, '2900000');

    const name = screen.getByPlaceholderText('Ej: Celular Samsung Galaxy S24');
    await user.clear(name);
    await user.type(name, 'Celular Editado');

    const stock = screen.getByPlaceholderText('Ej: 20');
    await user.clear(stock);
    await user.type(stock, '8');

    const discount = screen.getByPlaceholderText('Ej: 15');
    await user.clear(discount);
    await user.type(discount, '5');

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Gaming');
    await user.selectOptions(screen.getAllByRole('combobox')[1], '24');
    const weight = screen.getByPlaceholderText('Ej: 0.25');
    await user.clear(weight);
    await user.type(weight, '0.5');

    const description = screen.getByPlaceholderText(
      'Describe las características principales del producto...',
    );
    await user.clear(description);
    await user.type(description, 'Descripción editada');

    const brand = screen.getByPlaceholderText('Ej: Samsung');
    await user.clear(brand);
    await user.type(brand, 'Apple');

    const model = screen.getByPlaceholderText('Ej: Galaxy S24 Ultra');
    await user.clear(model);
    await user.type(model, 'iPhone 15');

    const dimensions = screen.getByPlaceholderText('Ej: 15 x 7 x 0.9 cm');
    await user.clear(dimensions);
    await user.type(dimensions, '20 x 10 x 1 cm');

    const imageUrl = screen.getByPlaceholderText('o pega URL https://...');
    await user.clear(imageUrl);
    await user.type(imageUrl, 'https://cdn.lubix.com/nueva.jpg');

    const editModal = screen
      .getByRole('heading', { name: 'Editar producto' })
      .closest('.fixed') as HTMLElement;
    const fileInput = editModal.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    if (fileInput) {
      await user.upload(
        fileInput,
        new File(['foto'], 'nueva.png', { type: 'image/png' }),
      );
    }

    const save = screen.getByRole('button', { name: 'Guardar cambios' });
    expect(save).toBeEnabled();
    await user.click(save);

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/company/products/upload-image',
        expect.any(FormData),
        expect.any(Object),
      );
      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/company/products/p1',
        expect.objectContaining({
          name: 'Celular Editado',
          price: 2900000,
          stock: 8,
          discount_value: 5,
          images: ['https://cdn.lubix.com/subida.jpg'],
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Editar producto' }),
      ).not.toBeInTheDocument();
    });
  }, 30000);

  it('muestra los pedidos y permite confirmar o rechazar uno pendiente', async () => {
    seedCompany();
    mockDashboard({ orders: [makeOrder()] });
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await user.click(screen.getByRole('button', { name: 'Pedidos' }));

    expect(screen.getByText('Pedidos recibidos (1)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Pendiente/ }));

    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Cantidad: 1')).toBeInTheDocument();
    expect(screen.getByText('GRATIS')).toBeInTheDocument();
    expect(screen.getByText('Pago: Tarjeta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/company/orders/ord-12345678/status',
        { status: 'confirmed' },
      );
    });

    await user.click(screen.getByRole('button', { name: 'Rechazar' }));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/company/orders/ord-12345678/status',
        { status: 'cancelled' },
      );
    });
  }, 30000);

  it.each([
    ['confirmed', 'Marcar como enviado', 'shipped'],
    ['shipped', 'Marcar como entregado', 'delivered'],
  ])('avanza un pedido en estado %s', async (status, label, next) => {
    seedCompany();
    mockDashboard({ orders: [makeOrder({ status })] });
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await user.click(screen.getByRole('button', { name: 'Pedidos' }));
    await user.click(screen.getByRole('button', { name: /Confirmado|Enviado/ }));

    await user.click(screen.getByRole('button', { name: label }));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/company/orders/ord-12345678/status',
        { status: next },
      );
    });
  });

  it('muestra un pedido entregado y uno con estado desconocido sin acciones', async () => {
    seedCompany();
    mockDashboard({
      orders: [
        makeOrder({ id: 'ord-entregado', status: 'delivered', buyer_name: '' }),
        makeOrder({
          id: 'ord-raro',
          status: 'en_proceso',
          shipping: 15000,
          payment_method: 'pse',
        }),
      ],
    });
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await user.click(screen.getByRole('button', { name: 'Pedidos' }));

    expect(screen.getByText('Pedidos recibidos (2)')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('en_proceso')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /en_proceso/ }));
    expect(screen.getByText('Pago: PSE')).toBeInTheDocument();
    expect(screen.getByText('$15.000')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Confirmar pedido' }),
    ).not.toBeInTheDocument();
  });

  it('carga las reseñas de los productos', async () => {
    seedCompany();
    mockDashboard({
      reviewsByProduct: {
        p1: [
          {
            id: 'r1',
            user_name: 'Ana Torres',
            comment: 'Excelente producto, llegó rápido y en buen estado',
            rating: 5,
            created_at: '2026-03-01T10:00:00',
          },
          {
            id: 'r2',
            user_name: 'Carlos Ruiz',
            comment: 'Bueno',
            rating: 3,
            created_at: '2026-03-02T10:00:00',
          },
          {
            id: 'r3',
            user_name: 'Diana',
            comment: 'Regular',
            rating: 4,
            created_at: '2026-03-03T10:00:00',
          },
          {
            id: 'r4',
            user_name: 'No debería mostrarse',
            comment: 'Cuarta reseña',
            rating: 2,
            created_at: '2026-03-04T10:00:00',
          },
        ],
        p2: [
          {
            id: 'r5',
            comment: '',
            rating: 4,
            created_at: '2026-03-05T10:00:00',
          },
        ],
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await user.click(screen.getByRole('button', { name: 'Reseñas' }));

    expect(
      await screen.findByRole('heading', { name: 'Reseñas de productos' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
    expect(
      screen.getByText('Excelente producto, llegó rápido y en buen estado...'),
    ).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(
      screen.queryByText('No debería mostrarse'),
    ).not.toBeInTheDocument();
  });

  it('actualiza el perfil de la tienda y permite cancelar', async () => {
    seedCompany();
    mockDashboard();
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await openProfileDrawer(user);

    const name = screen.getByDisplayValue('TechStore');
    await user.clear(name);
    await user.type(name, 'TechStore Renovada');

    const email = screen.getByDisplayValue('tienda@techstore.com');
    await user.clear(email);
    await user.type(email, 'nuevo@techstore.com');

    const phone = screen.getByDisplayValue('3001234567');
    await user.clear(phone);
    await user.type(phone, '3110000000');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/company/dashboard/upgrade-my-profile',
        {
          nameCompany: 'TechStore Renovada',
          emailCompany: 'nuevo@techstore.com',
          tellCompany: '3110000000',
        },
      );
    });
    expect(
      await screen.findByRole('heading', { name: 'TechStore Renovada' }),
    ).toBeInTheDocument();

    // Abre el drawer desde la pestaña de perfil (openEditProfile).
    await user.click(screen.getByRole('button', { name: 'Mi Perfil' }));
    await user.click(screen.getByRole('button', { name: 'Editar Información' }));
    await screen.findByRole('heading', { name: 'Editar perfil de tienda' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Editar perfil de tienda' }),
      ).not.toBeInTheDocument();
    });

    // Abre de nuevo y cierra con la X del drawer.
    await openProfileDrawer(user);
    const drawer = screen
      .getByRole('heading', { name: 'Editar perfil de tienda' })
      .closest('.fixed') as HTMLElement;
    const closeButton = drawer.querySelector('button');
    if (closeButton) await user.click(closeButton);
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Editar perfil de tienda' }),
      ).not.toBeInTheDocument();
    });
  }, 30000);

  it('sube el logo y el banner de la tienda', async () => {
    seedCompany();
    mockDashboard();
    mockWrites();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await openProfileDrawer(user);

    const logoInput = screen
      .getByText('Cambiar logo')
      .closest('label')
      ?.querySelector('input[type="file"]') as HTMLInputElement | null;
    const bannerInput = screen
      .getByText('Subir banner')
      .closest('label')
      ?.querySelector('input[type="file"]') as HTMLInputElement | null;

    expect(logoInput).not.toBeNull();
    expect(bannerInput).not.toBeNull();

    if (logoInput) {
      await user.upload(
        logoInput,
        new File(['logo'], 'logo.png', { type: 'image/png' }),
      );
    }
    expect(
      await screen.findByText('Foto de perfil actualizada'),
    ).toBeInTheDocument();

    if (bannerInput) {
      await user.upload(
        bannerInput,
        new File(['banner'], 'banner.png', { type: 'image/png' }),
      );
    }
    expect(await screen.findByAltText('Banner')).toBeInTheDocument();

    expect(apiMocks.patch).toHaveBeenCalledWith(
      '/company/dashboard/upload-logo',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
    expect(apiMocks.patch).toHaveBeenCalledWith(
      '/company/dashboard/upload-banner',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  }, 30000);

  it('muestra el error cuando falla la subida del logo', async () => {
    seedCompany();
    mockDashboard();
    apiMocks.patch.mockRejectedValue({
      response: { data: { detail: 'No se pudo subir la imagen' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await openProfileDrawer(user);

    const logoInput = screen
      .getByText('Cambiar logo')
      .closest('label')
      ?.querySelector('input[type="file"]') as HTMLInputElement | null;

    if (logoInput) {
      await user.upload(
        logoInput,
        new File(['logo'], 'logo.png', { type: 'image/png' }),
      );
    }

    expect(
      await screen.findByText('No se pudo subir la imagen'),
    ).toBeInTheDocument();
  });

  it('registra los errores de red de las acciones del panel', async () => {
    seedCompany();
    mockDashboard({ orders: [makeOrder()], productDetailError: true });
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    apiMocks.patch.mockRejectedValue(new Error('patch fail'));
    apiMocks.delete.mockRejectedValue(new Error('delete fail'));

    // Error al cambiar el estado del producto.
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    // Error al cambiar el estado del pedido.
    await user.click(screen.getByRole('button', { name: 'Pedidos' }));
    await user.click(screen.getByRole('button', { name: /Pendiente/ }));
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    // Error al eliminar el producto.
    await user.click(screen.getByRole('button', { name: 'Mis Productos' }));
    await user.click(screen.getAllByTitle('Eliminar producto')[0]);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Error al cargar el detalle del producto para editarlo.
    await user.click(screen.getAllByTitle('Editar producto')[0]);
    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith('/company/products/p1');
    });

    // Error al guardar el perfil de la tienda.
    await user.click(screen.getByRole('button', { name: 'Editar perfil' }));
    await screen.findByRole('heading', { name: 'Editar perfil de tienda' });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  }, 30000);

  it('cierra la sesión desde la barra de navegación', async () => {
    seedCompany();
    mockDashboard();
    const user = userEvent.setup();
    renderWithProviders(<SellerDashboard />);

    await screen.findByRole('heading', { name: 'TechStore' });
    await user.click(screen.getByRole('button', { name: /TechStore SAS/ }));
    await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
