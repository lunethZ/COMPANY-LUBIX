import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import HomeUsuario from './home-usuario';
import AuthModal from '../components/AuthModal';
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

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
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
    expect(screen.getByText('No hay productos')).toBeInTheDocument();
  });

  it('muestra las categorías y navega al buscador con el filtro', async () => {
    loginAsUser();
    mockGet();
    renderWithProviders(
      <>
        <HomeUsuario />
        <LocationDisplay />
      </>,
    );

    await screen.findByText('Categorías Principales');
    await userEvent.click(screen.getByRole('button', { name: /Celulares/ }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/buscar?categoria=Celulares',
    );
  });

  it('muestra hasta dos filas de productos y navega al detalle', async () => {
    loginAsUser();
    const productos = Array.from({ length: 5 }, (_, i) => ({
      ...productoApi,
      id: `p${i + 1}`,
      name: `Producto ${i + 1}`,
    }));
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/search') {
        return Promise.resolve({ data: { products: productos } });
      }
      if (url === '/user/favorites') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
    });

    renderWithProviders(
      <>
        <HomeUsuario />
        <LocationDisplay />
      </>,
    );

    expect(await screen.findByText('Producto 5')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Ver detalle' }),
    ).toHaveLength(5);

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Ver detalle' })[4],
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/producto/p5');
  });

  it('alterna un favorito con sesión iniciada', async () => {
    loginAsUser();
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/search') {
        return Promise.resolve({ data: { products: [productoApi] } });
      }
      if (url === '/user/favorites') {
        return Promise.resolve({ data: [{ product: { id: 'p1' } }] });
      }
      return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
    });
    apiMocks.post.mockResolvedValue({ data: { is_favorite: false } });
    const { container } = renderWithProviders(<HomeUsuario />);

    await screen.findByText('Productos Destacados');
    const favorito = container.querySelector(
      'button.absolute.top-3.right-3',
    ) as HTMLElement;
    await userEvent.click(favorito);

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/favorites/p1');
    });
  });

  it('lleva al login al guardar un favorito sin sesión', async () => {
    mockGet();
    const { container } = renderWithProviders(
      <>
        <HomeUsuario />
        <LocationDisplay />
      </>,
    );

    await screen.findByText('Productos Destacados');
    const favorito = container.querySelector(
      'button.absolute.top-3.right-3',
    ) as HTMLElement;
    await userEvent.click(favorito);

    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('muestra mensaje de agregado al carrito con sesión', async () => {
    loginAsUser();
    mockGet();
    apiMocks.post.mockResolvedValue({ data: {} });
    renderWithProviders(<HomeUsuario />);

    const botones = await screen.findAllByRole('button', {
      name: 'Agregar al carrito',
    });
    await userEvent.click(botones[0]);

    expect(await screen.findByText('✓ Agregado')).toBeInTheDocument();
  });

  it('abre el modal de login al agregar al carrito sin sesión', async () => {
    mockGet();
    renderWithProviders(
      <>
        <HomeUsuario />
        <AuthModal />
      </>,
    );

    const botones = await screen.findAllByRole('button', {
      name: 'Agregar al carrito',
    });
    await userEvent.click(botones[0]);

    expect(
      await screen.findByText('Tu marketplace de confianza'),
    ).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('navega al detalle desde el carrusel', async () => {
    loginAsUser();
    mockGet();
    renderWithProviders(
      <>
        <HomeUsuario />
        <LocationDisplay />
      </>,
    );

    const imagenes = await screen.findAllByRole('img', {
      name: 'Portátil ASUS',
    });
    await userEvent.click(
      imagenes[0].closest('div[class*="cursor-pointer"]') as HTMLElement,
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/producto/p1');
  });
});
