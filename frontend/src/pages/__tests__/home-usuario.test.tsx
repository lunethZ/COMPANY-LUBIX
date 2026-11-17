import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
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
});
