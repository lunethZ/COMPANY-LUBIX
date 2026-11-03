import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from './register';
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

/** El formulario no asocia <label> con los inputs, así que se busca por `name`. */
const inputByName = (container: HTMLElement, name: string) => {
  const input = container.querySelector<HTMLInputElement>(`[name="${name}"]`);
  if (!input) throw new Error(`No se encontró el input [name="${name}"]`);
  return input;
};

const STRONG_PASSWORD = 'Abcdef12';

const fillUsuarioForm = async (
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) => {
  await user.type(inputByName(container, 'name'), 'Maria');
  await user.type(inputByName(container, 'surname'), 'Lopez');
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'maria@x.com');
  await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567');
  await user.type(inputByName(container, 'password'), STRONG_PASSWORD);
  await user.type(inputByName(container, 'confirmPassword'), STRONG_PASSWORD);
};

describe('Página de registro', () => {
  it('renderiza el formulario de usuario con sus campos y botón', () => {
    renderWithProviders(<Register />);

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();
    expect(screen.getByText('Crea tu cuenta gratis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuario' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empresa' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Su Nombre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Su Apellido')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument();
  });

  it('muestra los campos de empresa al cambiar al modo empresa', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    await user.click(screen.getByRole('button', { name: 'Empresa' }));

    expect(screen.getByText('Registra tu empresa')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Lubix S.A.S')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('900123456')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Calle 123 #45-67')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar empresa' })).toBeInTheDocument();
  });

  it('muestra errores de validación visibles y no envía si faltan campos', () => {
    const { container } = renderWithProviders(<Register />);

    // Los campos `required` hacen que el navegador (y jsdom) bloqueen el click
    // en el botón, así que se envía el formulario directamente para ejercitar
    // la validación propia del componente.
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(screen.getAllByText('El nombre es obligatorio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('El correo es obligatorio').length).toBeGreaterThan(0);
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('muestra el error de formato de correo sin llamar al backend', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Register />);

    await user.type(inputByName(container, 'name'), 'Maria');
    await user.type(inputByName(container, 'surname'), 'Lopez');
    // "a@b" pasa la validación nativa del navegador pero no la de la app.
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'a@b');
    await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567');
    await user.type(inputByName(container, 'password'), STRONG_PASSWORD);
    await user.type(inputByName(container, 'confirmPassword'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      screen.getAllByText('Ingresa un correo electrónico válido').length,
    ).toBeGreaterThan(0);
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('bloquea el envío cuando las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Register />);

    await user.type(inputByName(container, 'name'), 'Maria');
    await user.type(inputByName(container, 'surname'), 'Lopez');
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'maria@x.com');
    await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567');
    await user.type(inputByName(container, 'password'), STRONG_PASSWORD);
    await user.type(inputByName(container, 'confirmPassword'), 'Diferente1');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getAllByText(/no coinciden/).length).toBeGreaterThan(0);
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('registra un usuario y envía el payload correcto al backend', async () => {
    apiMocks.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Register />);

    await fillUsuarioForm(user, container);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Usuario registrado correctamente')).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith('/auth/register-user', {
      fullName: 'Maria Lopez',
      email: 'maria@x.com',
      tell: '3001234567',
      password: STRONG_PASSWORD,
    });
  });

  it('muestra el error del backend cuando el correo ya existe', async () => {
    apiMocks.post.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { detail: 'El correo ya está registrado' },
      },
    });
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Register />);

    await fillUsuarioForm(user, container);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      (await screen.findAllByText('El correo ya está registrado')).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Error en el Registro')).toBeInTheDocument();
  });
});
