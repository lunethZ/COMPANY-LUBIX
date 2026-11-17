import { describe, expect, it } from 'vitest';
import { resolveImage } from '../images';
import { API_BASE_URL } from '../../api/config';

describe('resolveImage', () => {
  it('devuelve el placeholder cuando no hay imagen', () => {
    expect(resolveImage()).toBe('/placeholder.png');
    expect(resolveImage('/placeholder.png')).toBe('/placeholder.png');
  });

  it('respeta URLs absolutas', () => {
    expect(resolveImage('https://cdn.ejemplo.com/foto.png')).toBe('https://cdn.ejemplo.com/foto.png');
    expect(resolveImage('http://cdn.ejemplo.com/foto.png')).toBe('http://cdn.ejemplo.com/foto.png');
  });

  it('compone la URL del backend para una ruta relativa', () => {
    expect(resolveImage('products/iphone.png')).toBe(`${API_BASE_URL}/files/products/iphone.png`);
    expect(resolveImage('/uploads/logo.png')).toBe(`${API_BASE_URL}/files/uploads/logo.png`);
  });

  it('normaliza rutas que ya empiezan con /files', () => {
    expect(resolveImage('/files/products/iphone.png')).toBe(`${API_BASE_URL}/files/products/iphone.png`);
    expect(resolveImage('/files/files/products/iphone.png')).toBe(`${API_BASE_URL}/files/products/iphone.png`);
  });
});
