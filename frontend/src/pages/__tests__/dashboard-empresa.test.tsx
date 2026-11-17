import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import DashboardEmpresa from '../dashboard-empresa';
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
  localStorage.setItem('access_token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({
    id: 2,
    name: 'Lubix Corp',
    email: 'empresa@ejemplo.com',
    role_id: 'empresa',
  }));
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') {
      return Promise.resolve({ data: { items: [] } });
    }
    if (url === '/company/dashboard/me') {
      return Promise.resolve({
        data: { sales: 12, stars: 4, totalRevenue: 1250000, reviews: 3, nameCompany: 'Lubix Corp' },
      });
    }
    if (url === '/company/dashboard/my-profile') {
      return Promise.resolve({
        data: { nameCompany: 'Lubix Corp', logo: 'companies/logo.png', banner: 'companies/banner.png' },
      });
    }
    if (url === '/company/products') {
      return Promise.resolve({
        data: [{ id: 'p1', name: 'Mouse Gamer', price: 85000, images: ['products/mouse.png'], stock: 5 }],
      });
    }
    if (url === '/company/products/p1') {
      return Promise.resolve({
        data: {
          id: 'p1',
          name: 'Mouse Gamer',
          price: 85000,
          stock: 5,
          discount_value: 0,
          catalog_name: 'Gaming',
          descripcion: 'Mouse inalámbrico',
          images: ['products/mouse.png'],
          technical_spec: { brand: 'Logitech', model: 'G502', warranty: '12 meses', weight: '0.25 kg', dimensions: '15 x 7 x 4 cm' },
        },
      });
    }
    if (url === '/company/orders') {
      return Promise.resolve({
        data: [{
          id: 'o1',
          status: 'pending',
          buyer_name: 'Ana',
          created_at: '2026-01-01',
          total: 85000,
          items: [{ id: 'i1', name: 'Mouse Gamer', quantity: 1, price: 85000 }],
        }],
      });
    }
    if (url === '/products/p1/reviews') {
      return Promise.resolve({
        data: [{ id: 'r1', user_name: 'Ana', comment: 'Excelente producto', rating: 5, created_at: '2026-01-02' }],
      });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('DashboardEmpresa', () => {
  it('renderiza el panel y resuelve logo y banner relativos', async () => {
    renderWithProviders(<DashboardEmpresa />);

    const logo = await screen.findByAltText('Logo');
    expect(logo).toHaveAttribute('src', expect.stringContaining('/files/companies/logo.png'));
    expect(screen.getByText('Mouse Gamer')).toBeInTheDocument();
  });

  it('valida campos numéricos, normaliza el peso y agrega una imagen por URL', async () => {
    renderWithProviders(<DashboardEmpresa />);
    await screen.findByAltText('Logo');

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar producto/i })[0]);
    expect(await screen.findByText('Agregar nuevo producto')).toBeInTheDocument();

    const price = screen.getByPlaceholderText('Ej: 3500000');
    fireEvent.change(price, { target: { value: '0' } });
    expect(await screen.findByText('El precio debe ser mayor a 0.')).toBeInTheDocument();
    fireEvent.change(price, { target: { value: '' } });
    expect(await screen.findByText('Ingresa el precio del producto')).toBeInTheDocument();
    Object.defineProperty(price, 'value', { configurable: true, value: 'abc' });
    fireEvent.change(price);
    expect(await screen.findByText('Ingresa un precio válido')).toBeInTheDocument();

    const stock = screen.getByPlaceholderText('Ej: 20');
    fireEvent.change(stock, { target: { value: '0' } });
    expect(await screen.findByText('El stock debe ser mayor a 0')).toBeInTheDocument();

    const discount = screen.getByPlaceholderText('Ej: 15');
    fireEvent.change(discount, { target: { value: '-1' } });
    expect(await screen.findByText('El descuento no puede ser negativo')).toBeInTheDocument();
    fireEvent.change(discount, { target: { value: '101' } });
    expect(await screen.findByText('El descuento no puede superar el 100%')).toBeInTheDocument();
    Object.defineProperty(discount, 'value', { configurable: true, value: 'abc' });
    fireEvent.change(discount);
    expect(await screen.findByText('Ingresa un descuento válido')).toBeInTheDocument();

    const weight = screen.getByPlaceholderText('Ej: 0.25');
    fireEvent.change(weight, { target: { value: '1.2kg' } });
    expect(weight).toHaveValue('1.2');

    const imageUrl = screen.getByPlaceholderText('o pega URL https://...');
    fireEvent.change(imageUrl, { target: { value: 'https://ejemplo.com/mouse.png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByAltText('Imagen 1')).toHaveAttribute('src', 'https://ejemplo.com/mouse.png');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByText('Agregar nuevo producto')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar producto/i })[0]);
    await screen.findByText('Agregar nuevo producto');
    const addHeader = screen.getByText('Agregar nuevo producto').closest('div');
    fireEvent.click(addHeader?.querySelector('button') as HTMLButtonElement);
    await waitFor(() => {
      expect(screen.queryByText('Agregar nuevo producto')).not.toBeInTheDocument();
    });
  });

  it('publica un producto con imagen por URL y especificaciones normalizadas', async () => {
    renderWithProviders(<DashboardEmpresa />);
    await screen.findByAltText('Logo');

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar producto/i })[0]);
    await screen.findByText('Agregar nuevo producto');

    fireEvent.change(screen.getByPlaceholderText('Ej: Celular Samsung Galaxy S24'), { target: { value: 'Teclado Mecánico' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 3500000'), { target: { value: '85000' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 20'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Describe las características principales del producto...'), { target: { value: 'Teclado mecánico retroiluminado' } });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Gaming' } });
    fireEvent.change(selects[1], { target: { value: '12' } });

    fireEvent.change(screen.getByPlaceholderText('Ej: Samsung'), { target: { value: 'Logitech' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Galaxy S24 Ultra'), { target: { value: 'G512' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 0.25'), { target: { value: '0.75' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 15 x 7 x 0.9 cm'), { target: { value: '44 x 15 x 3 cm' } });

    const imageUrl = screen.getByPlaceholderText('o pega URL https://...');
    fireEvent.change(imageUrl, { target: { value: 'https://ejemplo.com/teclado.png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publicar producto' }));

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/company/products', expect.objectContaining({
        name: 'Teclado Mecánico',
        price: 85000,
        stock: 5,
        discount_enable: false,
        discount_value: 0,
        catalog_name: 'Gaming',
        images: ['https://ejemplo.com/teclado.png'],
        technical_spec: expect.objectContaining({
          brand: 'Logitech',
          model: 'G512',
          warranty: '12 meses',
          weight: '0.75 kg',
          dimensions: '44 x 15 x 3 cm',
        }),
      }));
    });
    await waitFor(() => {
      expect(screen.queryByText('Agregar nuevo producto')).not.toBeInTheDocument();
    });
  });

  it('abre el editor, normaliza campos y guarda los cambios del producto', async () => {
    renderWithProviders(<DashboardEmpresa />);
    await screen.findByTitle('Editar producto');

    fireEvent.click(screen.getByTitle('Editar producto'));
    expect(await screen.findByText('Editar producto')).toBeInTheDocument();

    const editHeader = screen.getByText('Editar producto').closest('div');
    fireEvent.click(editHeader?.querySelector('button') as HTMLButtonElement);
    await waitFor(() => {
      expect(screen.queryByText('Editar producto')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Editar producto'));
    await screen.findByText('Editar producto');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByText('Editar producto')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Editar producto'));
    await screen.findByText('Editar producto');

    fireEvent.change(screen.getByPlaceholderText('Ej: Celular Samsung Galaxy S24'), { target: { value: 'Mouse Gamer Pro' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 3500000'), { target: { value: '90000' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 20'), { target: { value: '7' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 15'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 0.25'), { target: { value: '0.5kg' } });
    expect(screen.getByPlaceholderText('Ej: 0.25')).toHaveValue('0.5');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith('/company/products/p1', expect.objectContaining({
        name: 'Mouse Gamer Pro',
        price: 90000,
        stock: 7,
        discount_enable: true,
        discount_value: 10,
        images: ['products/mouse.png'],
        technical_spec: expect.objectContaining({
          warranty: '12 meses',
          weight: '0.5 kg',
        }),
      }));
    });
  });

  it('abre el formulario desde el estado vacío de productos', async () => {
    const originalGet = apiMocks.get.getMockImplementation();
    apiMocks.get.mockImplementation((url: string) =>
      url === '/company/products'
        ? Promise.resolve({ data: [] })
        : originalGet?.(url),
    );

    renderWithProviders(<DashboardEmpresa />);
    expect(await screen.findByText('No tienes productos aún')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar producto/i })[1]);
    expect(await screen.findByText('Agregar nuevo producto')).toBeInTheDocument();
  });

  it('muestra el error del backend al fallar la subida del logo', async () => {
    apiMocks.patch.mockRejectedValueOnce({
      response: { data: { detail: 'No se pudo subir el logo' } },
    });

    const { container } = renderWithProviders(<DashboardEmpresa />);
    await screen.findByAltText('Logo');

    const logoInput = container.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
    fireEvent.change(logoInput, {
      target: { files: [new File(['logo'], 'logo.png', { type: 'image/png' })] },
    });

    expect(await screen.findByText('No se pudo subir el logo')).toBeInTheDocument();
  });

  it('muestra reseñas, pedidos y permite alternar o eliminar productos', async () => {
    renderWithProviders(<DashboardEmpresa />);
    await screen.findByAltText('Logo');

    fireEvent.click(screen.getByRole('button', { name: 'Reseñas' }));
    expect(await screen.findByText(/Excelente producto/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));
    expect(await screen.findByText('Pedidos recibidos (1)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mis Productos' }));
    await screen.findByTitle('Desactivar');
    fireEvent.click(screen.getByTitle('Desactivar'));
    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalledWith('/company/products/p1/status');
    });

    fireEvent.click(screen.getByTitle('Eliminar producto'));
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(apiMocks.delete).toHaveBeenCalledWith('/company/products/p1');
    });
  });
});
