import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import PerfilEmpresa from '../perfil-empresa';
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
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/products/company/c1/profile') {
      return Promise.resolve({
        data: {
          id: 'c1',
          name: 'Lubix Store',
          address: 'Bogotá',
          logo: 'companies/logo.png',
          banner: 'companies/banner.png',
          member_at: '2024-01-01',
          total_sales: 10,
          avg_rating: 4,
          total_reviews: 2,
          total_products: 1,
        },
      });
    }
    if (url === '/products/search') {
      return Promise.resolve({
        data: {
          products: [{
            id: 'p1',
            name: 'Mouse Gamer',
            price: 85000,
            images: ['products/mouse.png'],
            stock: 5,
            discount_enable: false,
            discount_value: 0,
            avg_rating: 4,
          }],
        },
      });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('PerfilEmpresa (humo)', () => {
  it('renderiza el perfil y resuelve logo e imágenes relativas', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/empresa/:id" element={<PerfilEmpresa />} />
      </Routes>,
      { initialEntries: ['/empresa/c1'] },
    );

    expect(await screen.findByAltText('Logo')).toHaveAttribute(
      'src',
      expect.stringContaining('/files/companies/logo.png'),
    );
    expect(await screen.findByAltText('Mouse Gamer')).toHaveAttribute(
      'src',
      expect.stringContaining('/files/products/mouse.png'),
    );
  });
});
