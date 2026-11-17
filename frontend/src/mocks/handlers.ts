import { http, HttpResponse } from 'msw';

export const handlers = [
  // Login - Caso de éxito por defecto (200)
  http.post('*/auth/login', async () => {
    return HttpResponse.json(
      {
        access_token: 'mock-jwt-token-lubix',
        token_type: 'bearer',
        user: {
          id: 1,
          nombre: 'Jose Armenta',
          email: 'test@lubix.com',
          rol: 'cliente',
        },
      },
      { status: 200 }
    );
  }),

  // Registro - Caso de éxito (201)
  http.post('*/auth/register', async () => {
    return HttpResponse.json(
      { message: 'Usuario registrado exitosamente' },
      { status: 201 }
    );
  }),

  // Productos - Caso de éxito (200)
  http.get('*/products*', () => {
    return HttpResponse.json([
      {
        id: 1,
        nombre: 'Aceite Sintético 5W-30',
        precio: 85000,
        stock: 15,
        categoria: 'Lubricantes',
        imagen: '/placeholder.png',
      },
      {
        id: 2,
        nombre: 'Filtro de Aceite Premium',
        precio: 32000,
        stock: 20,
        categoria: 'Filtros',
        imagen: '/placeholder.png',
      },
    ]);
  }),

  // Carrito - Casos de éxito (200)
  http.get('*/cart*', () => {
    return HttpResponse.json({ items: [], total: 0 });
  }),

  http.post('*/cart*', () => {
    return HttpResponse.json({ message: 'Producto agregado al carrito' }, { status: 200 });
  }),

  // PQRS - Casos de éxito (200 / 201)
  http.get('*/pqrs*', () => {
    return HttpResponse.json([]);
  }),

  http.post('*/pqrs*', () => {
    return HttpResponse.json({ message: 'PQRS enviada correctamente' }, { status: 201 });
  }),
];
