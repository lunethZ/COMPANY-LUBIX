import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import Home from './Home';
import AuthModal from '../components/AuthModal';
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

const productoApi = {
  id: 'p1',
  name: 'Portátil ASUS',
  descripcion: '14 pulgadas, 16GB RAM',
  price: 2500000,
  images: ['/files/products/p1.jpg'],
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

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
});

describe('Página de inicio', () => {
  it('renderiza los productos destacados que llegan de la API', async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [productoApi] } });
    renderWithProviders(<Home />);

    expect(screen.getByText('Bienvenidos a Lubix')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Tienda de Tecnología' }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Productos Destacados')).toBeInTheDocument();
    // El producto aparece en el carrusel y en la tarjeta destacada.
    expect(screen.getAllByText('Portátil ASUS').length).toBeGreaterThan(0);
    expect(screen.getByText('TecnoLubix')).toBeInTheDocument();
    expect(screen.getAllByText(/2\.500\.000/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: 'Agregar al carrito' }).length,
    ).toBeGreaterThan(0);
    expect(apiMocks.get).toHaveBeenCalledWith('/products/search');
    // Sin sesión no se consultan los favoritos.
    expect(apiMocks.get).not.toHaveBeenCalledWith('/user/favorites');
  });

  it('muestra el estado vacío cuando no hay productos publicados', async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [] } });
    renderWithProviders(<Home />);

    expect(
      await screen.findByText('No hay productos disponibles'),
    ).toBeInTheDocument();
    expect(screen.getByText('No hay productos')).toBeInTheDocument();
    expect(
      screen.getByText('Aún no hay productos publicados por las empresas'),
    ).toBeInTheDocument();
  });

  it('cae al estado vacío si la consulta de productos falla', async () => {
    apiMocks.get.mockRejectedValue(new Error('network down'));
    renderWithProviders(<Home />);

    expect(
      await screen.findByText('No hay productos disponibles'),
    ).toBeInTheDocument();
  });

  it('muestra el carrusel y hasta dos filas de productos destacados', async () => {
    const productos = Array.from({ length: 5 }, (_, i) => ({
      ...productoApi,
      id: `p${i + 1}`,
      name: `Producto ${i + 1}`,
    }));
    apiMocks.get.mockResolvedValue({ data: { products: productos } });

    renderWithProviders(
      <>
        <Home />
        <LocationDisplay />
      </>,
    );

    expect(await screen.findByText('Productos Destacados')).toBeInTheDocument();
    expect(screen.getByText('Producto 5')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Ver detalle' }),
    ).toHaveLength(5);

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Ver detalle' })[0],
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/producto/p1');
  });

  it('abre el modal de login al intentar guardar un favorito sin sesión', async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [productoApi] } });
    const { container } = renderWithProviders(
      <>
        <Home />
        <AuthModal />
      </>,
    );

    await screen.findByText('Productos Destacados');
    const favorito = container.querySelector(
      'button.absolute.top-3.right-3',
    ) as HTMLElement;
    await userEvent.click(favorito);

    expect(
      await screen.findByText('Tu marketplace de confianza'),
    ).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('abre el modal de login al agregar al carrito sin sesión', async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [productoApi] } });
    renderWithProviders(
      <>
        <Home />
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

  it('carga los favoritos y alterna el estado con sesión iniciada', async () => {
    loginAsUser();
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/search') {
        return Promise.resolve({ data: { products: [productoApi] } });
      }
      if (url === '/user/favorites') {
        return Promise.resolve({ data: [{ product: { id: 'p1' } }] });
      }
      if (url === '/cart') {
        return Promise.resolve({
          data: { items: [], subtotal: 0, total_items: 0 },
        });
      }
      return Promise.resolve({ data: null });
    });
    apiMocks.post.mockResolvedValue({ data: { is_favorite: false } });
    const { container } = renderWithProviders(<Home />);

    await screen.findByText('Productos Destacados');
    const favorito = container.querySelector(
      'button.absolute.top-3.right-3',
    ) as HTMLElement;
    await userEvent.click(favorito);

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/user/favorites/p1');
    });
  });

  it('agrega al carrito con sesión y muestra el aviso con enlace al carrito', async () => {
    loginAsUser();
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/search') {
        return Promise.resolve({ data: { products: [productoApi] } });
      }
      if (url === '/user/favorites') return Promise.resolve({ data: [] });
      if (url === '/cart') {
        return Promise.resolve({
          data: { items: [], subtotal: 0, total_items: 0 },
        });
      }
      return Promise.resolve({ data: null });
    });
    apiMocks.post.mockResolvedValue({ data: {} });
    renderWithProviders(
      <>
        <Home />
        <LocationDisplay />
      </>,
    );

    const botones = await screen.findAllByRole('button', {
      name: 'Agregar al carrito',
    });
    await userEvent.click(botones[0]);

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/cart/items', {
        product_id: 'p1',
        quantity: 1,
      });
    });
    expect(await screen.findByText('Agregado al carrito')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver carrito' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/carrito');
  });

  it('navega al detalle al pulsar el carrusel', async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [productoApi] } });
    renderWithProviders(
      <>
        <Home />
        <LocationDisplay />
      </>,
    );

    const imagenes = await screen.findAllByRole('img', { name: 'Portátil ASUS' });
    await userEvent.click(
      imagenes[0].closest('div[class*="cursor-pointer"]') as HTMLElement,
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/producto/p1');
  });
});
