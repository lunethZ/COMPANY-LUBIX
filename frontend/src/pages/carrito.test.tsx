import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CartPage from './carrito';
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

const cartItem = {
  id: 'p1',
  product_id: 'p1',
  name: 'Mouse Gamer',
  price: 85000,
  discount_enable: false,
  discount_value: 0,
  unit_price: 85000,
  image: '',
  stock: 5,
  quantity: 2,
  line_total: 170000,
};

const seedCart = () => {
  localStorage.setItem('cart', JSON.stringify([cartItem]));
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Página del carrito', () => {
  it('muestra el estado vacío cuando no hay productos', () => {
    renderWithProviders(<CartPage />);

    expect(
      screen.getByRole('heading', { name: 'Carrito de Compras' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Ver productos' }),
    ).toBeInTheDocument();
  });

  it('lista los productos guardados y calcula el total', async () => {
    seedCart();
    renderWithProviders(<CartPage />);

    expect(await screen.findByText('Mouse Gamer')).toBeInTheDocument();
    expect(screen.getByText('$85.000')).toBeInTheDocument();
    expect(screen.getByText(/Total \(2 artículos\)/)).toBeInTheDocument();
    expect(screen.getByText('$170.000')).toBeInTheDocument();
  });

  it('incrementa y decrementa la cantidad de un producto', async () => {
    seedCart();
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    await screen.findByText('Mouse Gamer');

    await user.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText(/Total \(3 artículos\)/)).toBeInTheDocument();
    expect(screen.getByText('$255.000')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '-' }));
    expect(screen.getByText(/Total \(2 artículos\)/)).toBeInTheDocument();
    expect(screen.getByText('$170.000')).toBeInTheDocument();
  });

  it('elimina un producto del carrito', async () => {
    seedCart();
    const { container } = renderWithProviders(<CartPage />);

    await screen.findByText('Mouse Gamer');
    const removeButton = container.querySelector('button.text-red-400');
    if (!removeButton) throw new Error('No se encontró el botón de eliminar');
    fireEvent.click(removeButton);

    expect(await screen.findByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('con sesión, "Proceder al pago" navega a la página de pago', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'u1', name: 'Ana', email: 'ana@x.com', role_id: 'user' }),
    );
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') {
        return Promise.resolve({ data: { items: [cartItem] } });
      }
      if (url === '/user/dashboard/me') return Promise.resolve({ data: {} });
      return Promise.resolve({ data: [] });
    });
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<CartPage />} />
        <Route path="/pago" element={<div>Página de pago</div>} />
      </Routes>,
    );

    expect(await screen.findByText('Mouse Gamer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Proceder al pago' }));

    expect(await screen.findByText('Página de pago')).toBeInTheDocument();
  });
});
