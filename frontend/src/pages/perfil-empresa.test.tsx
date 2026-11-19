import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import PerfilEmpresa from './perfil-empresa';
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

const company = {
  id: 'c1',
  name: 'TechStore',
  email: 'tienda@lubix.test',
  phone: '3001234567',
  address: 'Calle 1',
  city: 'Bogotá',
  description: 'Tecnología para todos',
  logo: null,
  banner: null,
  rating: 4.7,
  totalReviews: 10,
  memberSince: '2025-01-01',
};

const product = {
  id: 'p1',
  name: 'Portátil Lubix Pro',
  price: 2000000,
  images: [],
  stock: 3,
  company_id: 'c1',
  company_name: 'TechStore',
};

function renderPerfil() {
  renderWithProviders(
    <Routes>
      <Route path="/empresa/:id" element={<PerfilEmpresa />} />
    </Routes>,
    { initialEntries: ['/empresa/c1'] },
  );
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
});

describe('Perfil público de empresa', () => {
  it('muestra la empresa y sus productos', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
      if (url === '/products/company/c1/profile') return Promise.resolve({ data: company });
      if (url === '/products/search') return Promise.resolve({ data: { products: [product] } });
      return Promise.resolve({ data: {} });
    });

    renderPerfil();

    expect(await screen.findByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText(/Productos de TechStore/)).toBeInTheDocument();
    expect(screen.getByText('Portátil Lubix Pro')).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/products/company/c1/profile');
  });

  it('muestra el estado de empresa no encontrada', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
      if (url === '/products/search') return Promise.resolve({ data: { products: [] } });
      return Promise.reject(new Error('not found'));
    });

    renderPerfil();

    expect(
      await screen.findByText('Empresa no encontrada'),
    ).toBeInTheDocument();
  });

  it('muestra logo, banner, calificación y descuentos', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
      if (url === '/products/company/c1/profile') {
        return Promise.resolve({
          data: {
            ...company,
            logo: 'https://cdn.lubix.test/logo.png',
            banner: 'https://cdn.lubix.test/banner.jpg',
            avg_rating: 0,
            total_reviews: 0,
            total_sales: 25,
            total_products: 2,
            member_at: '2025-03-01T10:00:00',
          },
        });
      }
      if (url === '/products/search') {
        return Promise.resolve({
          data: {
            products: [
              {
                ...product,
                images: ['https://cdn.lubix.test/producto.png'],
                discount_enable: true,
                discount_value: 10,
                avg_rating: 0,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderPerfil();

    expect(await screen.findByText('TechStore')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      'https://cdn.lubix.test/logo.png',
    );
    expect(screen.getByText('Sin calificación')).toBeInTheDocument();
    expect(screen.getByText('(0 reseñas)')).toBeInTheDocument();
    expect(screen.getByText('25 ventas')).toBeInTheDocument();
    expect(screen.getByText('2 productos')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText(/\$1[.,]800[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/\$2[.,]000[.,]000/)).toBeInTheDocument();
    expect(screen.getByText('Sin')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Portátil Lubix Pro' }),
    ).toHaveAttribute('src', 'https://cdn.lubix.test/producto.png');
  });

  it('indica cuando la empresa no tiene productos publicados', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
      if (url === '/products/company/c1/profile') return Promise.resolve({ data: company });
      if (url === '/products/search') return Promise.resolve({ data: null });
      return Promise.resolve({ data: {} });
    });

    renderPerfil();

    expect(
      await screen.findByText('Esta empresa aún no tiene productos publicados.'),
    ).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });
});
