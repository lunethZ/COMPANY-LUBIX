import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import ProductoDetalle from './producto-detalle';
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

const producto = {
  id: 'p1',
  name: 'Portátil ASUS',
  price: 2500000,
  images: ['/placeholder.png'],
  descripcion: '14 pulgadas, 16GB RAM',
  stock: 10,
  discount_enable: false,
  discount_value: 0,
  company_id: 'c1',
  company_name: 'TecnoLubix',
  technical_spec: null,
  avg_rating: 0,
  review_count: 0,
};

const renderDetalle = () =>
  renderWithProviders(
    <Routes>
      <Route path="/producto/:id" element={<ProductoDetalle />} />
    </Routes>,
    { initialEntries: ['/producto/p1'] },
  );

const mockDetalle = ({
  productoData = producto,
  reviews = [] as unknown[],
  fallaProducto = false,
} = {}) => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/products/p1') {
      return fallaProducto
        ? Promise.reject(new Error('404'))
        : Promise.resolve({ data: productoData });
    }
    if (url === '/products/p1/reviews') return Promise.resolve({ data: reviews });
    if (url === '/products/p1/related') {
      return Promise.resolve({ data: { products: [] } });
    }
    return Promise.resolve({ data: null });
  });
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Página de detalle de producto', () => {
  it('renderiza la información del producto y la tienda', async () => {
    mockDetalle();
    renderDetalle();

    expect(
      await screen.findByRole('heading', { name: 'Portátil ASUS' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText(/2\.500\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/10 disponibles/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Tienda que vende este producto' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('TecnoLubix').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Opiniones y Reseñas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aún no hay reseñas')).toBeInTheDocument();
    // Sin sesión se invita a iniciar sesión para dejar reseña.
    expect(
      screen.getByText('Inicia sesión para dejar tu reseña'),
    ).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1');
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1/reviews');
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1/related');
  });

  it('muestra las reseñas existentes del producto', async () => {
    mockDetalle({
      productoData: { ...producto, avg_rating: 4, review_count: 1 },
      reviews: [
        {
          id: 'r1',
          rating: 4,
          title: 'Muy bueno',
          comment: 'Cumple lo prometido',
          created_at: '2026-01-05T10:00:00',
          user_name: 'Ana',
        },
      ],
    });
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Muy bueno')).toBeInTheDocument();
    expect(screen.getByText('Cumple lo prometido')).toBeInTheDocument();
    expect(screen.queryByText('Aún no hay reseñas')).not.toBeInTheDocument();
  });

  it('deshabilita la compra cuando el producto está agotado', async () => {
    mockDetalle({ productoData: { ...producto, stock: 0 } });
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeDisabled();
  });

  it('muestra el estado de producto no encontrado si la consulta falla', async () => {
    mockDetalle({ fallaProducto: true });
    renderDetalle();

    expect(
      await screen.findByText('Producto no encontrado'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    ).toBeInTheDocument();
  });
});
