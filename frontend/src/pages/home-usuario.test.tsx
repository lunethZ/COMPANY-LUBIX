import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeUsuario from './home-usuario';
import { renderWithProviders } from '../test/utils';

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

const productoApi = {
  id: 'p1',
  name: 'Portátil ASUS',
  descripcion: '14 pulgadas, 16GB RAM',
  price: 2500000,
  discount_enable: true,
  discount_value: 10,
  images: ['/files/products/p1.jpg'],
  stock: 4,
  company_id: 'c1',
  company_name: 'TecnoLubix',
  avg_rating: 4.5,
  review_count: 12,
};

function loginAsUser() {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: 'u1',
      name: 'Ana Tester',
      email: 'ana@lubix.test',
      role_id: 'user',
    }),
  );
}

function mockGet() {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
    if (url === '/products/search')
      return Promise.resolve({ data: { products: [productoApi] } });
    if (url === '/user/favorites') return Promise.resolve({ data: [] });
    if (url === '/user/dashboard/me')
      return Promise.resolve({ data: { fullName: 'Ana Tester' } });
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Home del usuario', () => {
  it('saluda al usuario y muestra los productos de la API', async () => {
    loginAsUser();
    mockGet();
    apiMocks.post.mockResolvedValue({ data: { is_favorite: true } });

    renderWithProviders(<HomeUsuario />);

    expect(
      screen.getByRole('heading', { name: 'Bienvenido de nuevo a Lubix' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Productos Destacados')).toBeInTheDocument();
    expect(screen.getAllByText('Portátil ASUS').length).toBeGreaterThan(0);
    expect(screen.getByText('TecnoLubix')).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/user/favorites');
  });

  it('agrega un producto al carrito autenticado', async () => {
    loginAsUser();
    mockGet();
    apiMocks.post.mockResolvedValue({ data: {} });
    apiMocks.patch.mockResolvedValue({ data: {} });

    renderWithProviders(<HomeUsuario />);

    const botones = await screen.findAllByRole('button', {
      name: 'Agregar al carrito',
    });
    await userEvent.click(botones[0]);

    expect(apiMocks.post).toHaveBeenCalledWith('/cart/items', {
      product_id: 'p1',
      quantity: 1,
    });
  });

  it('muestra el estado vacío cuando no hay productos', async () => {
    loginAsUser();
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/search') return Promise.resolve({ data: { products: [] } });
      if (url === '/user/favorites') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
    });

    renderWithProviders(<HomeUsuario />);

    expect(
      await screen.findByText('No hay productos disponibles'),
    ).toBeInTheDocument();
  });
});
