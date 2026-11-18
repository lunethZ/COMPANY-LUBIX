import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

  it('muestra descuento, agotado y valores por defecto del producto', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/catalogs') {
        return Promise.resolve({ data: [{ name: 'Tecnología' }] });
      }
      if (url === '/products/search') {
        return Promise.resolve({
          data: {
            products: [{
              id: 'p2',
              name: 'Teclado Mecánico',
              descripcion: 'Sin stock',
              price: 100000,
              stock: 0,
              images: [],
              discount_enable: true,
              discount_value: 10,
            }],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<BuscarProducto />, { initialEntries: ['/buscar'] });

    const image = await screen.findByAltText('Teclado Mecánico');
    expect(image).toHaveAttribute('src', '/placeholder.png');
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getAllByText('Agotado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Stock: Agotado/)).toBeInTheDocument();
    expect(screen.getByText('$90.000')).toBeInTheDocument();
    expect(screen.getByText('$100.000')).toBeInTheDocument();
    expect(screen.getAllByText('Tienda').length).toBeGreaterThan(0);
  });

  it('abre filtros, limpia filtros y vuelve a todos los productos', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/catalogs') {
        return Promise.resolve({ data: [{ name: 'Tecnología' }, { name: 'Hogar' }] });
      }
      if (url === '/products/search') {
        return Promise.resolve({ data: { products: [] } });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<BuscarProducto />, {
      initialEntries: ['/buscar?q=xyz&categoria=Tecnología&orden=price_asc&min=1000'],
    });

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    expect(
      screen.getByText(/No encontramos productos para "xyz" en "Tecnología"/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Intenta con otros filtros/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(screen.getByText('Rango de Precio')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Min'), { target: { value: '2000' } });
    fireEvent.change(screen.getByPlaceholderText('Max'), { target: { value: '9000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hogar' }));
    expect(
      await screen.findByText(/No encontramos productos para "xyz" en "Hogar"/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos los productos' }));
    expect(await screen.findByText(/No hay productos disponibles/)).toBeInTheDocument();
  });

  it('respeta imágenes absolutas y rutas que ya empiezan por /files', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/catalogs') return Promise.resolve({ data: [] });
      if (url === '/products/search') {
        return Promise.resolve({
          data: {
            products: [
              { id: 'p3', name: 'Foto Externa', descripcion: 'x', price: 1000, stock: 1, images: ['https://cdn.lubix.test/foto.png'] },
              { id: 'p4', name: 'Foto Interna', descripcion: 'y', price: 1000, stock: 1, images: ['/files/products/interna.png'] },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<BuscarProducto />, { initialEntries: ['/buscar'] });

    expect(await screen.findByAltText('Foto Externa')).toHaveAttribute('src', 'https://cdn.lubix.test/foto.png');
    expect(screen.getByAltText('Foto Interna')).toHaveAttribute(
      'src',
      expect.stringContaining('/files/products/interna.png'),
    );
  });

  it('cubre los mensajes de estado vacío según la búsqueda', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/catalogs') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    const { unmount } = renderWithProviders(<BuscarProducto />, {
      initialEntries: ['/buscar?categoria=Hogar'],
    });
    expect(await screen.findByText(/No hay productos en la categoría "Hogar"/)).toBeInTheDocument();
    unmount();

    renderWithProviders(<BuscarProducto />, { initialEntries: ['/buscar?q=zzz'] });
    expect(await screen.findByText(/Prueba con otros términos/)).toBeInTheDocument();
    unmount();

    renderWithProviders(<BuscarProducto />, { initialEntries: ['/buscar'] });
    expect(await screen.findByText(/Las empresas aún no han publicado productos/)).toBeInTheDocument();
  });
});
