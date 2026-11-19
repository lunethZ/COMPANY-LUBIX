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

  it('toma todos los filtros iniciales desde la URL', async () => {
    mockBusqueda();
    renderWithProviders(<BuscarProducto />, {
      initialEntries: [
        '/buscar?q=portatil&categoria=Audio&orden=price_asc&min=100&max=900',
      ],
    });

    await screen.findByText('Portátil ASUS');
    const [, config] = ultimaBusqueda();
    const params = config.params as URLSearchParams;
    expect(params.get('q')).toBe('portatil');
    expect(params.get('categoria')).toBe('Audio');
    expect(params.get('orden')).toBe('price_asc');
    expect(params.get('min')).toBe('100');
    expect(params.get('max')).toBe('900');
  });

  it('ordenar por precio actualiza la búsqueda', async () => {
    mockBusqueda();
    const user = userEvent.setup();
    renderWithProviders(<BuscarProducto />);

    await screen.findByText('Portátil ASUS');
    await user.selectOptions(screen.getByRole('combobox'), 'price_desc');

    await waitFor(() => {
      const [, config] = ultimaBusqueda();
      expect((config.params as URLSearchParams).get('orden')).toBe('price_desc');
    });
  });

  it('filtra por rango de precio y limpia los filtros', async () => {
    mockBusqueda();
    const user = userEvent.setup();
    renderWithProviders(<BuscarProducto />);

    await screen.findByText('Portátil ASUS');
    await user.click(screen.getByRole('button', { name: /Filtros/ }));
    await user.type(screen.getByPlaceholderText('Min'), '100000');
    await user.type(screen.getByPlaceholderText('Max'), '3000000');

    await waitFor(() => {
      const [, config] = ultimaBusqueda();
      const params = config.params as URLSearchParams;
      expect(params.get('min')).toBe('100000');
      expect(params.get('max')).toBe('3000000');
    });

    await user.click(
      screen.getByRole('button', { name: 'Limpiar filtros' }),
    );

    await waitFor(() => {
      const [, config] = ultimaBusqueda();
      const params = config.params as URLSearchParams;
      expect(params.get('min')).toBeNull();
      expect(params.get('max')).toBeNull();
    });
  });

  it('muestra el descuento y el estado agotado de los productos', async () => {
    mockBusqueda([
      {
        ...producto,
        id: 'p2',
        name: 'Audífonos',
        price: 100000,
        stock: 0,
        discount_enable: true,
        discount_value: 25,
      },
    ]);
    renderWithProviders(<BuscarProducto />);

    expect(await screen.findByText('Audífonos')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('$75.000')).toBeInTheDocument();
    expect(screen.getByText('$100.000')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByText('Stock: Agotado')).toBeInTheDocument();
  });

  it('describe el estado vacío según los filtros activos', async () => {
    mockBusqueda([]);
    const { unmount } = (() => {
      return renderWithProviders(<BuscarProducto />, {
        initialEntries: ['/buscar?categoria=Gaming'],
      });
    })();

    expect(
      await screen.findByText(/No hay productos en la categoría "Gaming"/),
    ).toBeInTheDocument();
    unmount();

    mockBusqueda([]);
    renderWithProviders(<BuscarProducto />);

    expect(
      await screen.findByText(/No hay productos disponibles/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Las empresas aún no han publicado productos/),
    ).toBeInTheDocument();
  });

  it('usa las categorías por defecto si el backend no devuelve catálogos', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/catalogs') {
        return Promise.reject(new Error('sin catálogos'));
      }
      if (url === '/products/search') {
        return Promise.resolve({ data: { products: [producto] } });
      }
      return Promise.resolve({ data: [] });
    });
    const user = userEvent.setup();
    renderWithProviders(<BuscarProducto />);

    await screen.findByText('Portátil ASUS');
    await user.click(screen.getByRole('button', { name: /Filtros/ }));

    expect(screen.getByRole('button', { name: 'Computadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Televisores' })).toBeInTheDocument();
  });
});
