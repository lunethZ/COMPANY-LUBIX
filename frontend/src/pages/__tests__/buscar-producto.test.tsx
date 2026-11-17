import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import BuscarProducto from '../buscar-producto';
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
    if (url === '/products/catalogs') {
      return Promise.resolve({ data: [{ name: 'Tecnología' }] });
    }
    if (url === '/products/search') {
      return Promise.resolve({
        data: {
          products: [{
            id: 'p1',
            name: 'Mouse Gamer',
            descripcion: 'Mouse inalámbrico',
            price: 85000,
            stock: 5,
            images: ['products/mouse.png'],
            company_name: 'Lubix Store',
          }],
        },
      });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('BuscarProducto (humo)', () => {
  it('renderiza resultados y resuelve la imagen relativa', async () => {
    renderWithProviders(<BuscarProducto />, { initialEntries: ['/buscar?q=mouse'] });

    const image = await screen.findByAltText('Mouse Gamer');
    expect(image).toHaveAttribute('src', expect.stringContaining('/files/products/mouse.png'));
  });
});
