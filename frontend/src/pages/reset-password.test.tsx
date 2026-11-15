import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecoverPassword from './reset-password';
import { renderWithProviders } from '../test/utils';
import api from '../api/axios';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mocks.navigate };
});

const post = vi.mocked(api.post);

function renderPage() {
  return renderWithProviders(<RecoverPassword />);
}

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('No se encontró el formulario');
  fireEvent.submit(form);
}

describe('RecoverPassword', () => {
  beforeEach(() => {
    post.mockReset();
    mocks.navigate.mockReset();
    localStorage.clear();
  });

  it('muestra el formulario y el enlace para volver al login', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar código' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('avisa cuando se envía sin email', async () => {
    renderPage();

    submitForm();

    expect(await screen.findByText('Ingresa tu email')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('envía el código y navega a nueva contraseña', async () => {
    post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(
      await screen.findByText('Código enviado a tu correo ✅')
    ).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/auth/forgot-password-user', {
      email: 'ana@example.com',
    });

    await waitFor(
      () => {
        expect(mocks.navigate).toHaveBeenCalledWith('/new-password', {
          state: { email: 'ana@example.com' },
        });
      },
      { timeout: 3000 }
    );
  });

  it('muestra el detalle que devuelve el servidor', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'El correo no existe' } },
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByText('El correo no existe')).toBeInTheDocument();
  });

  it('usa el mensaje de fallback si el error no trae detalle', async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { data: {} } });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(
      await screen.findByText('Error enviando el correo')
    ).toBeInTheDocument();
  });

  it('usa "Error de conexión" ante un fallo no axios', async () => {
    post.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });

  it('muestra el estado de carga mientras envía', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByText('Enviando...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeDisabled();

    resolveRequest({ data: {} });
    await waitFor(() => {
      expect(screen.queryByText('Enviando...')).not.toBeInTheDocument();
    });
  });
});
