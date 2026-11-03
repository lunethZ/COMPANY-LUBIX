import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './login';
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

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

const fillCredentials = async (
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) => {
  await user.type(screen.getByPlaceholderText('tu@email.com'), email);
  const passwordInput = document.querySelector<HTMLInputElement>(
    'input[type="password"]',
  );
  if (!passwordInput) throw new Error('No se encontró el input de contraseña');
  await user.type(passwordInput, password);
};

describe('Página de login', () => {
  it('renderiza el formulario con su encabezado y acciones principales', () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();
    expect(screen.getByText(/Inicia sesi/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesi/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuario' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empresa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reg/ })).toBeInTheDocument();
  });

  it('muestra el error de validación si el correo está vacío y no llama al backend', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.click(screen.getByRole('button', { name: /Iniciar Sesi/ }));

    expect(
      await screen.findByText('El correo es obligatorio'),
    ).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('muestra el error de formato si el correo no es válido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    // "a@b" pasa la validación nativa del navegador (sin TLD) pero no la
    // validación propia de la app, que es la que debe mostrar el mensaje.
    await fillCredentials(user, 'a@b', 'Secret12');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesi/ }));

    expect(
      await screen.findByText('Ingresa un correo electrónico válido'),
    ).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('envía las credenciales al endpoint correcto y guarda los tokens', async () => {
    apiMocks.post.mockResolvedValue({
      data: {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        role: 'user',
        id: 'user-1',
        Nombre: 'Ana Torres',
        email: 'ana@x.com',
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await fillCredentials(user, 'ana@x.com', 'Secret12');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesi/ }));

    expect(await screen.findByText(/Bienvenido Ana Torres/)).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith('/auth/login-user', {
      email: 'ana@x.com',
      password: 'Secret12',
    });
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('access-token-123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token-456');
      expect(JSON.parse(localStorage.getItem('user') ?? 'null')).toMatchObject({
        email: 'ana@x.com',
        role_id: 'user',
      });
    });
  });

  it('usa el endpoint de empresa cuando se selecciona la pestaña Empresa', async () => {
    apiMocks.post.mockResolvedValue({
      data: {
        access_token: 'company-token',
        refresh_token: 'company-refresh',
        role: 'company',
        id: 'company-1',
        Nombre: 'Lubix SAS',
        email: 'empresa@x.com',
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await fillCredentials(user, 'empresa@x.com', 'Secret12');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesi/ }));

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/login-company', {
      email: 'empresa@x.com',
      password: 'Secret12',
    });
    expect(
      await screen.findByText(/Bienvenido Lubix SAS/),
    ).toBeInTheDocument();
  });

  it('muestra el detalle del backend cuando el login falla', async () => {
    apiMocks.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { detail: 'Credenciales invalidas' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await fillCredentials(user, 'ana@x.com', 'Wrong123');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesi/ }));

    expect(await screen.findByText('Credenciales invalidas')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
