import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import ProductoDetalle from './producto-detalle';
import AuthModal from '../components/AuthModal';
import { renderWithProviders } from '../test/utils';

// Se dobla el cliente axios: ninguna prueba debe tocar la red.
const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('../api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => routerMocks.navigate };
});

const producto = {
  id: 'p1',
  name: 'Portátil ASUS',
  price: 2500000,
  images: ['/placeholder.png'],
  descripcion: '14 pulgadas, 16GB RAM',
  stock: 10,
  discount_enable: false,
  discount_value: 0,
  company_id: 'c1',
  company_name: 'TecnoLubix',
  technical_spec: null as Record<string, string> | null,
  avg_rating: 0,
  review_count: 0,
};

const renderDetalle = (conModal = false) =>
  renderWithProviders(
    <>
      <Routes>
        <Route path="/producto/:id" element={<ProductoDetalle />} />
      </Routes>
      {conModal && <AuthModal />}
    </>,
    { initialEntries: ['/producto/p1'] },
  );

function loginAsUser() {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: 'u1',
      name: 'Ana Tester',
      email: 'ana@lubix.test',
      role_id: 'user',
    }),
  );
}

const mockDetalle = ({
  productoData = producto,
  reviews = [] as unknown[],
  fallaProducto = false,
  favoritos = [] as unknown[],
} = {}) => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/products/p1') {
      return fallaProducto
        ? Promise.reject(new Error('404'))
        : Promise.resolve({ data: productoData });
    }
    if (url === '/products/p1/reviews') return Promise.resolve({ data: reviews });
    if (url === '/products/p1/related') {
      return Promise.resolve({ data: { products: [] } });
    }
    if (url === '/user/favorites') return Promise.resolve({ data: favoritos });
    if (url === '/cart') {
      return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
    }
    return Promise.resolve({ data: null });
  });
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.delete.mockReset();
  routerMocks.navigate.mockReset();
});

describe('Página de detalle de producto', () => {
  it('renderiza la información del producto y la tienda', async () => {
    mockDetalle();
    renderDetalle();

    expect(
      await screen.findByRole('heading', { name: 'Portátil ASUS' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText(/2\.500\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/10 disponibles/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Tienda que vende este producto' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('TecnoLubix').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Opiniones y Reseñas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aún no hay reseñas')).toBeInTheDocument();
    // Sin sesión se invita a iniciar sesión para dejar reseña.
    expect(
      screen.getByText('Inicia sesión para dejar tu reseña'),
    ).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1');
    expect(apiMocks.get).toHaveBeenCalledWith('/products/p1/reviews');
  });

  it('muestra las reseñas existentes del producto', async () => {
    mockDetalle({
      productoData: { ...producto, avg_rating: 4, review_count: 1 },
      reviews: [
        {
          id: 'r1',
          rating: 4,
          title: 'Muy bueno',
          comment: 'Cumple lo prometido',
          created_at: '2026-01-05T10:00:00',
          user_name: 'Ana',
        },
      ],
    });
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Muy bueno')).toBeInTheDocument();
    expect(screen.getByText('Cumple lo prometido')).toBeInTheDocument();
    expect(screen.queryByText('Aún no hay reseñas')).not.toBeInTheDocument();
  });

  it('deshabilita la compra cuando el producto está agotado', async () => {
    mockDetalle({ productoData: { ...producto, stock: 0 } });
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeDisabled();
  });

  it('muestra el estado de producto no encontrado si la consulta falla', async () => {
    mockDetalle({ fallaProducto: true });
    renderDetalle();

    expect(
      await screen.findByText('Producto no encontrado'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    ).toBeInTheDocument();
  });

  it('vuelve al inicio desde el estado de producto no encontrado', async () => {
    mockDetalle({ fallaProducto: true });
    renderDetalle();

    const boton = await screen.findByRole('button', { name: 'Volver al inicio' });
    await userEvent.click(boton);

    expect(routerMocks.navigate).toHaveBeenCalledWith('/home-usuario');
  });

  it('muestra descuento, especificaciones y permite cambiar de imagen', async () => {
    const { container } = (() => {
      mockDetalle({
        productoData: {
          ...producto,
          price: 1000000,
          discount_enable: true,
          discount_value: 20,
          images: ['/files/a.jpg', '/files/b.jpg', '/files/c.jpg'],
          technical_spec: { Pantalla: '14 pulgadas', RAM: '16 GB' },
        },
      });
      return renderDetalle();
    })();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });

    expect(screen.getByText('$800.000')).toBeInTheDocument();
    expect(screen.getByText('$1.000.000')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Características y detalles' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pantalla')).toBeInTheDocument();
    expect(screen.getByText('16 GB')).toBeInTheDocument();

    const principal = screen.getByRole('img', { name: 'Portátil ASUS' });
    const miniaturas = container.querySelectorAll('button img');
    expect(miniaturas.length).toBe(3);

    await userEvent.click(miniaturas[1].parentElement as HTMLElement);

    expect(principal).toHaveAttribute(
      'src',
      expect.stringContaining('/files/b.jpg'),
    );
  });

  it('vuelve a la página anterior al pulsar Volver', async () => {
    mockDetalle();
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(routerMocks.navigate).toHaveBeenCalledWith(-1);
  });

  it('lleva al login al guardar un favorito sin sesión', async () => {
    mockDetalle();
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(routerMocks.navigate).toHaveBeenCalledWith('/login');
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('abre el modal de login al agregar al carrito sin sesión', async () => {
    mockDetalle();
    renderDetalle(true);

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    );

    expect(
      await screen.findByText('Tu marketplace de confianza'),
    ).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalledWith(
      '/cart/items',
      expect.anything(),
    );
  });

  it('carga el estado de favorito y permite quitarlo con sesión', async () => {
    loginAsUser();
    mockDetalle({ favoritos: [{ product: { id: 'p1' } }] });
    apiMocks.post.mockResolvedValue({ data: { is_favorite: false } });

    renderDetalle();

    const guardado = await screen.findByRole('button', { name: 'Guardado' });
    await userEvent.click(guardado);

    expect(apiMocks.post).toHaveBeenCalledWith('/user/favorites/p1');
    expect(
      await screen.findByRole('button', { name: 'Guardar' }),
    ).toBeInTheDocument();
  });

  it('agrega al carrito la cantidad elegida con sesión iniciada', async () => {
    loginAsUser();
    mockDetalle();
    apiMocks.post.mockResolvedValue({ data: {} });

    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText('3')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar al carrito' }),
    );

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/cart/items', {
        product_id: 'p1',
        quantity: 3,
      });
    });
    expect(
      await screen.findByText('✓ Agregado al carrito'),
    ).toBeInTheDocument();
  });

  it('no permite bajar de 1 la cantidad y respeta el stock al subir', async () => {
    mockDetalle({
      productoData: { ...producto, stock: 2 },
    });
    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    await userEvent.click(screen.getByRole('button', { name: '−' }));
    expect(screen.getByText('1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('agrega el producto y navega al pago al pulsar Comprar', async () => {
    loginAsUser();
    mockDetalle();
    apiMocks.post.mockResolvedValue({ data: {} });

    renderDetalle();

    await screen.findByRole('heading', { name: 'Portátil ASUS' });
    await userEvent.click(screen.getByRole('button', { name: 'Comprar' }));

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith('/cart/items', {
        product_id: 'p1',
        quantity: 1,
      });
    });
    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith('/pago');
    });
  });

  it('muestra el formulario de reseña para usuarios autenticados', async () => {
    loginAsUser();
    mockDetalle();

    renderDetalle();

    expect(
      await screen.findByRole('heading', { name: 'Escribe tu reseña' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Publicar reseña' }),
    ).toBeDisabled();
  });

  it('publica una reseña y actualiza el listado', async () => {
    loginAsUser();
    mockDetalle();
    const { container } = renderDetalle();

    await screen.findByRole('heading', { name: 'Escribe tu reseña' });

    const estrellas = container.querySelectorAll(
      '.inline-flex.items-center.gap-1 button',
    );
    await userEvent.click(estrellas[4]);
    await userEvent.type(
      screen.getByPlaceholderText('Ej: Muy buen producto'),
      'Excelente',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Cuéntanos tu experiencia con el producto...'),
      'Muy recomendado',
    );

    const nuevas = [
      {
        id: 'r2',
        rating: 5,
        title: 'Excelente',
        comment: 'Muy recomendado',
        created_at: '2026-02-01T10:00:00',
        user_name: 'Ana',
      },
    ];
    apiMocks.post.mockResolvedValue({ data: {} });
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/products/p1') return Promise.resolve({ data: producto });
      if (url === '/products/p1/reviews') {
        return Promise.resolve({ data: nuevas });
      }
      if (url === '/user/favorites') return Promise.resolve({ data: [] });
      if (url === '/cart') {
        return Promise.resolve({ data: { items: [], subtotal: 0, total_items: 0 } });
      }
      return Promise.resolve({ data: null });
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Publicar reseña' }),
    );

    expect(
      await screen.findByText('Reseña publicada correctamente'),
    ).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith('/products/p1/reviews', {
      rating: 5,
      title: 'Excelente',
      comment: 'Muy recomendado',
    });
    expect(await screen.findByText('Muy recomendado')).toBeInTheDocument();
  });

  it('muestra el error del servidor al fallar la publicación de la reseña', async () => {
    loginAsUser();
    mockDetalle();
    apiMocks.post.mockRejectedValue({
      response: { data: { detail: 'No autorizado para comentar' } },
    });
    const { container } = renderDetalle();

    await screen.findByRole('heading', { name: 'Escribe tu reseña' });

    const estrellas = container.querySelectorAll(
      '.inline-flex.items-center.gap-1 button',
    );
    await userEvent.click(estrellas[3]);
    await userEvent.type(
      screen.getByPlaceholderText('Cuéntanos tu experiencia con el producto...'),
      'No me gustó',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Publicar reseña' }),
    );

    expect(
      await screen.findByText('No autorizado para comentar'),
    ).toBeInTheDocument();
  });

  it('lleva al login desde la invitación a dejar reseña', async () => {
    mockDetalle();
    renderDetalle();

    await screen.findByRole('heading', { name: 'Opiniones y Reseñas' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Iniciar sesión' }),
    );

    expect(routerMocks.navigate).toHaveBeenCalledWith('/login');
  });
});
