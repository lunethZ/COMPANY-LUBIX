import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import Login from './login';
import { AuthProvider } from '../context/AuthProvider';

describe('MSW - Integración API en Login (Éxito y Error)', () => {
  it('intercepta POST /auth/login-user y completa el flujo en caso de éxito (200)', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    const emailInput = inputs[0];
    const passwordInput = inputs[1];
    const submitBtn = screen.getByRole('button', { name: /iniciar|ingresar|entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@lubix.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

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
    const emailInput = inputs[0];
    const passwordInput = inputs[1];
    const submitBtn = screen.getByRole('button', { name: /iniciar|ingresar|entrar/i });

    fireEvent.change(emailInput, { target: { value: 'error@lubix.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
    });
  });
});
