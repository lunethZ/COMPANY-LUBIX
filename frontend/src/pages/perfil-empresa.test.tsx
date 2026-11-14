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
});
