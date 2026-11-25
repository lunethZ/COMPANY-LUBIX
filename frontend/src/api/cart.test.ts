import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './axios';
import {
  addCartItem,
  clearCart,
  getCart,
  mergeCart,
  removeCartItem,
  setCartItemQuantity,
} from './cart';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const cart = { items: [], subtotal: 0, total_items: 0 } as never;

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.get.mockResolvedValue({ data: cart } as never);
  mockedApi.post.mockResolvedValue({ data: { message: 'ok' } } as never);
  mockedApi.patch.mockResolvedValue({ data: { message: 'ok' } } as never);
  mockedApi.delete.mockResolvedValue({ data: { message: 'ok' } } as never);
});

describe('api/cart', () => {
  it('obtiene el carrito', async () => {
    await expect(getCart()).resolves.toBe(cart);
    expect(mockedApi.get).toHaveBeenCalledWith('/cart');
  });

  it('agrega un producto y devuelve el carrito actualizado', async () => {
    await expect(addCartItem('p1', 2)).resolves.toBe(cart);
    expect(mockedApi.post).toHaveBeenCalledWith('/cart/items', { product_id: 'p1', quantity: 2 });
    expect(mockedApi.get).toHaveBeenCalledWith('/cart');
  });

  it('agrega un producto con cantidad por defecto', async () => {
    await addCartItem('p2');
    expect(mockedApi.post).toHaveBeenCalledWith('/cart/items', { product_id: 'p2', quantity: 1 });
  });

  it('cambia la cantidad de un producto', async () => {
    await expect(setCartItemQuantity('p1', 4)).resolves.toBe(cart);
    expect(mockedApi.patch).toHaveBeenCalledWith('/cart/items/p1', { quantity: 4 });
  });

  it('elimina un producto del carrito', async () => {
    await expect(removeCartItem('p1')).resolves.toBe(cart);
    expect(mockedApi.delete).toHaveBeenCalledWith('/cart/items/p1');
  });

  it('vacía el carrito sin devolver datos', async () => {
    await expect(clearCart()).resolves.toBeUndefined();
    expect(mockedApi.delete).toHaveBeenCalledWith('/cart');
  });

  it('fusiona el carrito local con el del backend', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: cart } as never);

    await expect(mergeCart([{ product_id: 'p1', quantity: 2 }])).resolves.toBe(cart);
    expect(mockedApi.post).toHaveBeenCalledWith('/cart/merge', {
      items: [{ product_id: 'p1', quantity: 2 }],
    });
  });

  it('propaga los errores del backend', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('boom'));
    await expect(addCartItem('p1')).rejects.toThrow('boom');
  });
});
