import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import HomeUsuario from '../home-usuario';
import { renderWithProviders } from '../../test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
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
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') {
      return Promise.resolve({ data: { items: [] } });
    }
    if (url === '/products/search') {
      return Promise.resolve({
        data: {
          products: [{
            id: 'p1',
            name: 'iPhone 15',
            descripcion: 'Smartphone',
            price: 3500000,
            stock: 4,
            images: ['products/iphone.png'],
            company_name: 'Lubix Store',
          }],
        },
      });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('HomeUsuario (humo)', () => {
  it('renderiza el catálogo y resuelve la imagen relativa', async () => {
    renderWithProviders(<HomeUsuario />);

    const images = await screen.findAllByAltText('iPhone 15');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('/files/products/iphone.png'));
  });

  it('muestra descuento, calificación y confirma el agregado al carrito', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [] } });
      if (url === '/user/favorites') return Promise.resolve({ data: [] });
      if (url === '/products/search') {
        return Promise.resolve({
          data: {
            products: [{
              id: 'p1',
              name: 'Consola Pro',
              descripcion: 'Edición limitada',
              price: 2000000,
              stock: 3,
              images: ['https://cdn.lubix.test/consola.png'],
              discount_enable: true,
              discount_value: 20,
              avg_rating: 4.5,
              review_count: 10,
            }],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<HomeUsuario />);

    const images = await screen.findAllByAltText('Consola Pro');
    expect(images[0]).toHaveAttribute('src', 'https://cdn.lubix.test/consola.png');
    expect(screen.getAllByText('-20%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4.5 (10)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$2.000.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tienda').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Agregar al carrito' })[0]);
    expect(await screen.findByText('✓ Agregado')).toBeInTheDocument();
  });

  it('muestra los estados vacíos del carrusel y de destacados', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [] } });
      if (url === '/products/search') return Promise.resolve({ data: { products: [] } });
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<HomeUsuario />);

    expect(await screen.findByText('No hay productos disponibles')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay productos publicados por las empresas')).toBeInTheDocument();
  });
});
