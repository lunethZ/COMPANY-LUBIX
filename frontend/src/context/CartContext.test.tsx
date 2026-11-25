import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from './CartContext';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import * as cartApi from '../api/cart';
import type { CartItem } from '../types/cart';

vi.mock('../api/cart', () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  setCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
  mergeCart: vi.fn(),
}));

const mockedApi = vi.mocked(cartApi);

const product = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'p1',
  product_id: 'p1',
  name: 'Monitor',
  price: 500000,
  discount_enable: false,
  discount_value: 0,
  unit_price: 500000,
  image: '',
  stock: 5,
  quantity: 1,
  line_total: 500000,
  ...overrides,
});

const cartResponse = (items: CartItem[]) => ({ items, subtotal: 0, total_items: 0 }) as never;

function Probe() {
  const cart = useCart();
  const auth = useAuth();
  return (
    <div>
      <p data-testid="items">{cart.items.map((i) => `${i.name}x${i.quantity}`).join(',') || 'vacio'}</p>
      <p data-testid="totals">{`${cart.totalItems}:${cart.subtotal}`}</p>
      <p data-testid="error">{cart.error || '-'}</p>
      <p data-testid="auth">{String(auth.isAuthenticated)}</p>
      <button
        onClick={() =>
          cart.addToCart({ id: 'p1', name: 'Monitor', price: 500000, stock: 5 }, 1)
        }
      >
        agregar-p1
      </button>
      <button onClick={() => cart.addToCart({ id: 'p2', name: 'Mouse', price: 80000 }, 2)}>
        agregar-p2
      </button>
      <button onClick={() => cart.increment('p1')}>mas-p1</button>
      <button onClick={() => cart.decrement('p1')}>menos-p1</button>
      <button onClick={() => cart.removeItem('p1')}>borrar-p1</button>
      <button onClick={() => cart.emptyCart()}>vaciar</button>
      <button onClick={() => cart.refresh()}>refrescar</button>
      <button
        onClick={() =>
          auth.login('token', { id: 7, name: 'Ana', email: 'ana@lubix.test', role_id: 'user' })
        }
      >
        entrar
      </button>
      <button onClick={auth.logout}>salir</button>
    </div>
  );
}

function renderCart() {
  return render(
    <AuthProvider>
      <CartProvider>
        <Probe />
      </CartProvider>
    </AuthProvider>,
  );
}

function seedAuth() {
  localStorage.setItem('access_token', 'token');
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 7, name: 'Ana', email: 'ana@lubix.test', role_id: 'user' }),
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CartProvider invitado', () => {
  it('carga el carrito local y calcula totales', async () => {
    localStorage.setItem('cart', JSON.stringify([product()]));

    renderCart();

    expect(await screen.findByTestId('items')).toHaveTextContent('Monitorx1');
    expect(screen.getByTestId('totals')).toHaveTextContent('1:500000');
  });

  it('ignora un carrito corrupto o con forma inválida', async () => {
    localStorage.setItem('cart', '{no-json');
    const first = renderCart();
    expect(await screen.findByTestId('items')).toHaveTextContent('vacio');
    first.unmount();

    localStorage.setItem('cart', JSON.stringify('texto'));
    renderCart();
    expect(await screen.findByTestId('items')).toHaveTextContent('vacio');
  });

  it('agrega productos nuevos y respeta el stock al repetir', async () => {
    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'agregar-p2' }));
    expect(screen.getByTestId('items')).toHaveTextContent('Mousex2');
    expect(JSON.parse(localStorage.getItem('cart') as string)).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'agregar-p1' }));
    await userEvent.click(screen.getByRole('button', { name: 'agregar-p1' }));
    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx2');

    for (let i = 0; i < 5; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'agregar-p1' }));
    }
    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx5');
  });

  it('incrementa, decrementa y elimina sin superar el stock', async () => {
    localStorage.setItem('cart', JSON.stringify([product({ quantity: 1 })]));

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'mas-p1' }));
    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx2');

    await userEvent.click(screen.getByRole('button', { name: 'menos-p1' }));
    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx1');

    await userEvent.click(screen.getByRole('button', { name: 'menos-p1' }));
    expect(screen.getByTestId('items')).toHaveTextContent('vacio');
    expect(localStorage.getItem('cart')).toBe('[]');
  });

  it('elimina un producto y vacía el carrito', async () => {
    localStorage.setItem(
      'cart',
      JSON.stringify([product(), product({ id: 'p2', product_id: 'p2', name: 'Mouse', price: 1, unit_price: 1, line_total: 1 })]),
    );

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'borrar-p1' }));
    expect(screen.getByTestId('items')).toHaveTextContent('Mousex1');

    await userEvent.click(screen.getByRole('button', { name: 'vaciar' }));
    expect(screen.getByTestId('items')).toHaveTextContent('vacio');
  });

  it('refresca desde localStorage cuando no hay sesión', async () => {
    renderCart();
    await screen.findByTestId('items');

    localStorage.setItem('cart', JSON.stringify([product()]));
    await userEvent.click(screen.getByRole('button', { name: 'refrescar' }));

    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx1');
    expect(mockedApi.getCart).not.toHaveBeenCalled();
  });

  it('guarda el carrito local al cerrar sesión', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([product({ quantity: 3, line_total: 1500000 })]));

    renderCart();
    await screen.findByTestId('items');
    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx3');

    await userEvent.click(screen.getByRole('button', { name: 'salir' }));

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('false');
    });
    expect(JSON.parse(localStorage.getItem('cart') as string)[0].quantity).toBe(3);
  });
});

describe('CartProvider autenticado', () => {
  it('fusiona el carrito local, limpia el storage y carga el del backend', async () => {
    seedAuth();
    localStorage.setItem('cart', JSON.stringify([product({ quantity: 2 })]));
    mockedApi.mergeCart.mockResolvedValue(cartResponse([product({ quantity: 2 })]));
    mockedApi.getCart.mockResolvedValue(cartResponse([product({ quantity: 2, line_total: 1000000 })]));

    renderCart();

    expect(await screen.findByTestId('items')).toHaveTextContent('Monitorx2');
    expect(mockedApi.mergeCart).toHaveBeenCalledWith([{ product_id: 'p1', quantity: 2 }]);
    expect(mockedApi.getCart).toHaveBeenCalled();
    expect(localStorage.getItem('cart')).toBeNull();
  });

  it('usa el carrito local si la fusión y la carga remota fallan', async () => {
    seedAuth();
    localStorage.setItem('cart', JSON.stringify([product()]));
    mockedApi.mergeCart.mockRejectedValue(new Error('offline'));
    mockedApi.getCart.mockRejectedValue(new Error('offline'));

    renderCart();

    expect(await screen.findByTestId('items')).toHaveTextContent('Monitorx1');
  });

  it('agrega al backend y refresca el carrito', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([]));
    mockedApi.addCartItem.mockResolvedValue(cartResponse([]));
    mockedApi.getCart
      .mockResolvedValueOnce(cartResponse([]))
      .mockResolvedValueOnce(cartResponse([product()]));

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'agregar-p1' }));

    expect(await screen.findByTestId('items')).toHaveTextContent('Monitorx1');
    expect(mockedApi.addCartItem).toHaveBeenCalledWith('p1', 1);
  });

  it('muestra el detalle de error al agregar', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([]));
    mockedApi.addCartItem.mockRejectedValue({ response: { data: { detail: 'Sin stock' } } });

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'agregar-p1' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Sin stock');
    });
  });

  it('usa el mensaje por defecto cuando el error no trae detalle', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([product()]));
    mockedApi.setCartItemQuantity.mockRejectedValue(new Error('boom'));

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'mas-p1' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('No se pudo actualizar el carrito');
    });
    expect(mockedApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 2);
  });

  it('incrementa, decrementa, elimina y vacía contra la API', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([product({ quantity: 2 })]));
    mockedApi.setCartItemQuantity.mockResolvedValue(cartResponse([]));
    mockedApi.removeCartItem.mockResolvedValue(cartResponse([]));
    mockedApi.clearCart.mockResolvedValue(undefined);

    renderCart();
    await screen.findByTestId('items');
    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx2');

    await userEvent.click(screen.getByRole('button', { name: 'mas-p1' }));
    expect(mockedApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 3);

    await userEvent.click(screen.getByRole('button', { name: 'menos-p1' }));
    expect(mockedApi.setCartItemQuantity).toHaveBeenCalledWith('p1', 1);

    await userEvent.click(screen.getByRole('button', { name: 'borrar-p1' }));
    expect(mockedApi.removeCartItem).toHaveBeenCalledWith('p1');

    await userEvent.click(screen.getByRole('button', { name: 'vaciar' }));
    expect(mockedApi.clearCart).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId('items')).toHaveTextContent('vacio');
    });
  });

  it('refresca desde la API y conserva items si falla', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([product()]));

    renderCart();
    await screen.findByTestId('items');

    mockedApi.getCart.mockRejectedValueOnce(new Error('network'));
    await userEvent.click(screen.getByRole('button', { name: 'refrescar' }));

    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx1');
  });

  it('no falla al vaciar si la API responde con error', async () => {
    seedAuth();
    mockedApi.getCart.mockResolvedValue(cartResponse([product()]));
    mockedApi.clearCart.mockRejectedValue(new Error('boom'));

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'vaciar' }));

    expect(screen.getByTestId('items')).toHaveTextContent('Monitorx1');
  });

  it('entra a sesión y fusiona el carrito local', async () => {
    localStorage.setItem('cart', JSON.stringify([product()]));
    mockedApi.mergeCart.mockResolvedValue(cartResponse([product()]));
    mockedApi.getCart.mockResolvedValue(cartResponse([product()]));

    renderCart();
    await screen.findByTestId('items');

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('true');
    });
    expect(mockedApi.mergeCart).toHaveBeenCalledWith([{ product_id: 'p1', quantity: 1 }]);
    await waitFor(() => {
      expect(screen.getByTestId('items')).toHaveTextContent('Monitorx1');
    });
  });
});

describe('useCart', () => {
  it('lanza error fuera del provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useCart must be used within CartProvider');
    spy.mockRestore();
  });
});
