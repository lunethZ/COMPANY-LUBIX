import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Home from './Home';
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

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
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
});
