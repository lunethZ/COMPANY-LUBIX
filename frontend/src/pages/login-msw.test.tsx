import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import Login from './login';
import { AuthProvider } from '../context/AuthProvider';

describe('MSW - Integración API en Login y Handlers (Éxito y Error)', () => {
  it('intercepta POST /auth/login-user y completa el flujo en caso de éxito (200)', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'test@lubix.com' } });
    fireEvent.change(inputs[1], { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar|ingresar|entrar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Error de Inicio de Sesion/i)).not.toBeInTheDocument();
    });
  });

  it('intercepta POST /auth/login-user y muestra error cuando la API responde 401', async () => {
    server.use(
      http.post('*/auth/login*', () => {
        return HttpResponse.json(
          { detail: 'Credenciales inválidas' },
          { status: 401 }
        );
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'error@lubix.com' } });
    fireEvent.change(inputs[1], { target: { value: 'WrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar|ingresar|entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error de Inicio de Sesion/i)).toBeInTheDocument();
    });
  });

  it('intercepta endpoints simulados de registro, productos, carrito y PQRS', async () => {
    const regRes = await fetch('http://localhost/auth/register-user', { method: 'POST' });
    expect(regRes.status).toBe(201);

    const prodRes = await fetch('http://localhost/products');
    expect(prodRes.status).toBe(200);
    expect(await prodRes.json()).toHaveLength(2);

    const getCartRes = await fetch('http://localhost/cart');
    expect(getCartRes.status).toBe(200);

    const postCartRes = await fetch('http://localhost/cart/add', { method: 'POST' });
    expect(postCartRes.status).toBe(200);

    const getPqrsRes = await fetch('http://localhost/pqrs');
    expect(getPqrsRes.status).toBe(200);

    const postPqrsRes = await fetch('http://localhost/pqrs', { method: 'POST' });
    expect(postPqrsRes.status).toBe(201);
  });
});
