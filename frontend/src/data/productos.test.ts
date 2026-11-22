import { describe, expect, it } from 'vitest';
import { OFERTAS, PRODUCTOS, TIENDAS } from './productos';

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
