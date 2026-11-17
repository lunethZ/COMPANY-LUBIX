import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ProductosPage from '../productos';
import { renderWithProviders } from '../../test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
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
  apiMocks.patch.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/company/products') {
      return Promise.resolve({
        data: [{
          id: 'p1',
          name: 'Mouse Gamer',
          price: 85000,
          images: ['products/mouse.png'],
          stock: 5,
          descripcion: 'Mouse inalámbrico',
          technical_spec: 'USB-C',
          discount_enable: false,
          discount_value: 0,
        }],
      });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('ProductosPage (humo)', () => {
  it('renderiza el catálogo y resuelve la imagen relativa', async () => {
    renderWithProviders(<ProductosPage />);

    const image = await screen.findByAltText('Mouse Gamer');
    expect(image).toHaveAttribute('src', expect.stringContaining('/files/products/mouse.png'));
  });
});
