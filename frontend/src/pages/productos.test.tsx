import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductosPage from './productos';
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

const baseProduct = {
  id: 'p1',
  name: 'Mouse Gamer',
  price: 85000,
  images: ['/placeholder.png'],
  stock: 5,
  descripcion: 'Mouse inalámbrico con luz LED',
  technical_spec: null,
  discount_enable: false,
  discount_value: 0,
};

const segundoProducto = {
  ...baseProduct,
  id: 'p2',
  name: 'Teclado Mecánico',
  price: 150000,
  descripcion: 'Teclado con switches azules',
};

const review = {
  id: 'r1',
  rating: 5,
  title: 'Excelente compra',
  comment: 'Muy buen producto',
  created_at: '2026-01-05T10:00:00',
  user_name: 'Ana',
};

const mockCatalogo = (products = [baseProduct]) => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/company/products') {
      return Promise.resolve({ data: products });
    }
    if (url === '/products/p1') {
      return Promise.resolve({
        data: { ...baseProduct, avg_rating: 5, review_count: 1 },
      });
    }
    if (url === '/products/p1/reviews') {
      return Promise.resolve({ data: [review] });
    }
    return Promise.resolve({ data: [] });
  });
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Página de catálogo de productos', () => {
  it('lista los productos de la empresa', async () => {
    mockCatalogo();
    renderWithProviders(<ProductosPage />);

    expect(
      screen.getByRole('heading', { name: 'Catálogo de Productos' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Mouse Gamer')).toBeInTheDocument();
    expect(screen.getByText(/85\.000/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ver reseñas' }),
    ).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/company/products');
  });

  it('filtra por nombre o descripción desde el buscador', async () => {
    mockCatalogo([baseProduct, segundoProducto]);
    const user = userEvent.setup();
    renderWithProviders(<ProductosPage />);

    await screen.findByText('Mouse Gamer');
    await user.type(
      screen.getByPlaceholderText('Buscar producto por nombre o descripción...'),
      'teclado',
    );

    expect(screen.getByText('Teclado Mecánico')).toBeInTheDocument();
    expect(screen.queryByText('Mouse Gamer')).not.toBeInTheDocument();
  });

  it('abre el detalle con sus reseñas y permite volver al listado', async () => {
    mockCatalogo();
    const user = userEvent.setup();
    renderWithProviders(<ProductosPage />);

    await screen.findByText('Mouse Gamer');
    await user.click(screen.getByRole('button', { name: 'Ver reseñas' }));

    expect(
      await screen.findByRole('heading', { name: 'Reseñas de Clientes' }),
    ).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1');
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1/reviews');
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Excelente compra')).toBeInTheDocument();
    expect(screen.getByText(/"Muy buen producto"/)).toBeInTheDocument();
    expect(screen.getByText(/5 unidades/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Volver al listado de productos/ }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Catálogo de Productos' }),
      ).toBeInTheDocument();
    });
  });

  it('indica que el producto aún no tiene reseñas', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/company/products') return Promise.resolve({ data: [baseProduct] });
      if (url === '/products/p1') {
        return Promise.resolve({
          data: { ...baseProduct, avg_rating: 0, review_count: 0 },
        });
      }
      return Promise.resolve({ data: [] });
    });
    const user = userEvent.setup();
    renderWithProviders(<ProductosPage />);

    await screen.findByText('Mouse Gamer');
    await user.click(screen.getByRole('button', { name: 'Ver reseñas' }));

    expect(
      await screen.findByText('Este producto aún no tiene reseñas.'),
    ).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando la empresa no tiene productos', async () => {
    mockCatalogo([]);
    renderWithProviders(<ProductosPage />);

    expect(
      await screen.findByText('No tienes productos aún. Crea uno desde el dashboard.'),
    ).toBeInTheDocument();
  });
});
