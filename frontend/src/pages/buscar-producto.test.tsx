import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuscarProducto from './buscar-producto';
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
  stock: 3,
  discount_enable: false,
  discount_value: 0,
  company_id: 'c1',
  company_name: 'TecnoLubix',
};

const mockBusqueda = (products = [producto]) => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/products/catalogs') {
      return Promise.resolve({
        data: [{ name: 'Computadores' }, { name: 'Audio' }],
      });
    }
    if (url === '/products/search') {
      return Promise.resolve({ data: { products } });
    }
    return Promise.resolve({ data: [] });
  });
};

const ultimaBusqueda = () => {
  const llamadas = apiMocks.get.mock.calls.filter(
    ([url]) => url === '/products/search',
  );
  return llamadas[llamadas.length - 1];
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Página de búsqueda de productos', () => {
  it('busca usando los parámetros de la URL y muestra los resultados', async () => {
    mockBusqueda();
    renderWithProviders(<BuscarProducto />, {
      initialEntries: ['/buscar?q=portatil'],
    });

    expect(await screen.findByText('Portátil ASUS')).toBeInTheDocument();
    expect(screen.getByText('TecnoLubix')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.getByText('Ordenar:')).toBeInTheDocument();

    const [, config] = ultimaBusqueda();
    expect((config.params as URLSearchParams).get('q')).toBe('portatil');
  });

  it('carga las categorías y filtra por la categoría seleccionada', async () => {
    mockBusqueda();
    const user = userEvent.setup();
    renderWithProviders(<BuscarProducto />);

    await screen.findByText('Portátil ASUS');
    await user.click(screen.getByRole('button', { name: /Filtros/ }));

    expect(
      await screen.findByRole('heading', { name: 'Categorías' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Audio' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Audio' }));

    await waitFor(() => {
      const [, config] = ultimaBusqueda();
      expect((config.params as URLSearchParams).get('categoria')).toBe('Audio');
    });
  });

  it('muestra sin resultados y permite limpiar la búsqueda', async () => {
    mockBusqueda([]);
    const user = userEvent.setup();
    renderWithProviders(<BuscarProducto />, {
      initialEntries: ['/buscar?q=inexistente'],
    });

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    expect(
      screen.getByText(/No encontramos productos para "inexistente"/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Ver todos los productos' }),
    );

    await waitFor(() => {
      const [, config] = ultimaBusqueda();
      expect((config.params as URLSearchParams).get('q')).toBeNull();
    });
  });
});
