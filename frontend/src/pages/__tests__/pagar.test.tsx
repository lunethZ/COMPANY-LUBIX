import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import PagarPage from '../pagar';
import { renderWithProviders } from '../../test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('cart', JSON.stringify([{
    id: 'p1',
    product_id: 'p1',
    name: 'Mouse Gamer',
    price: 85000,
    discount_enable: false,
    discount_value: 0,
    unit_price: 85000,
    image: 'products/mouse.png',
    stock: 5,
    quantity: 1,
    line_total: 85000,
  }]));
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/user/addresses') return Promise.resolve({ data: [] });
    return Promise.resolve({ data: {} });
  });
});

describe('PagarPage (humo)', () => {
  it('renderiza el resumen y resuelve la imagen relativa del carrito', async () => {
    renderWithProviders(<PagarPage />);

    const image = await screen.findByAltText('Mouse Gamer');
    expect(image).toHaveAttribute('src', expect.stringContaining('/files/products/mouse.png'));
  });
});
