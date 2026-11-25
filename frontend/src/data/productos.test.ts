import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OFERTAS,
  PRODUCTOS,
  TIENDAS,
  addToCart,
  formatCOP,
  getCart,
  getFavorites,
  getProductoById,
  saveCart,
  toggleFavorite,
} from './productos';

describe('Datos de catálogo de ejemplo', () => {
  it('expone tiendas, productos y ofertas con contenido', () => {
    expect(Object.keys(TIENDAS).length).toBeGreaterThan(0);
    expect(PRODUCTOS.length).toBeGreaterThan(0);
    expect(OFERTAS.length).toBeGreaterThan(0);

    const producto = PRODUCTOS[0];
    expect(producto.nombre).toBeTruthy();
    expect(typeof producto.precio).toBe('number');
  });
});

describe('Helpers del catálogo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('busca productos por id numérico o string', () => {
    const first = PRODUCTOS[0];
    expect(getProductoById(first.id)).toBe(first);
    expect(getProductoById(String(first.id))).toBe(first);
    expect(getProductoById('inexistente')).toBeUndefined();
  });

  it('lee favoritos tolerando datos ausentes o corruptos', () => {
    expect(getFavorites()).toEqual([]);

    localStorage.setItem('favorites', '[1,2]');
    expect(getFavorites()).toEqual([1, 2]);

    localStorage.setItem('favorites', '{corrupto');
    expect(getFavorites()).toEqual([]);
  });

  it('alterna favoritos y los persiste', () => {
    expect(toggleFavorite(3)).toEqual([3]);
    expect(toggleFavorite(5)).toEqual([3, 5]);
    expect(toggleFavorite(3)).toEqual([5]);
    expect(JSON.parse(localStorage.getItem('favorites') as string)).toEqual([5]);
  });

  it('lee el carrito tolerando datos ausentes o corruptos', () => {
    expect(getCart()).toEqual([]);

    localStorage.setItem('cart', '{corrupto');
    expect(getCart()).toEqual([]);
  });

  it('guarda el carrito y notifica el cambio', () => {
    const listener = vi.fn();
    window.addEventListener('cart-changed', listener);

    saveCart([{ id: 1, name: 'Monitor', price: 500000, image: '', quantity: 2 }]);

    expect(JSON.parse(localStorage.getItem('cart') as string)).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('cart-changed', listener);
  });

  it('agrega productos nuevos o acumula cantidad en el existente', () => {
    const prod = PRODUCTOS[0];

    addToCart(prod);
    addToCart(prod, 2);

    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      id: prod.id,
      name: prod.nombre,
      price: prod.precio,
      quantity: 3,
    });
  });

  it('formatea precios en pesos colombianos', () => {
    expect(formatCOP(5400000)).toBe('$5.400.000');
    expect(formatCOP(0)).toBe('$0');
  });
});
