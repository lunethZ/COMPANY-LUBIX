import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewPassword from './new-password';
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
  return renderWithProviders(<NewPassword />);
}

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('No se encontró el formulario');
  fireEvent.submit(form);
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    email?: string;
    code?: string;
    password?: string;
    confirm?: string;
  } = {}
) {
  const {
    email = 'ana@example.com',
    code = '123456',
    password = 'Prueba123',
    confirm = 'Prueba123',
  } = options;

  await user.type(screen.getByPlaceholderText('tu@email.com'), email);
  await user.type(screen.getByPlaceholderText('123456'), code);
  const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
  await user.type(passwordInput, password);
  await user.type(confirmInput, confirm);
}

describe('NewPassword', () => {
  beforeEach(() => {
    post.mockReset();
    mocks.navigate.mockReset();
    localStorage.clear();
  });

  it('muestra el formulario y el botón deshabilitado', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();
    expect(screen.getByText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('valida email, código y contraseña antes de enviar', async () => {
    const user = userEvent.setup();
    renderPage();

    submitForm();
    expect(await screen.findByText('Ingresa tu email')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    submitForm();
    expect(await screen.findByText('Ingresa el código')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('123456'), '123456');
    submitForm();
    expect(await screen.findByText('Ingresa nueva contraseña')).toBeInTheDocument();

    const [password] = screen.getAllByPlaceholderText('••••••••');
    await user.type(password, 'abc');
    submitForm();
    expect(
      await screen.findByText('Contraseña débil (8+ chars, A, a, 0)')
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('avisa cuando las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    renderPage();

    await fillForm(user, { confirm: 'Prueba124' });
    submitForm();

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('pinta la barra de fortaleza según la contraseña', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const [password] = screen.getAllByPlaceholderText('••••••••');

    await user.type(password, 'a');
    expect(container.querySelector('.bg-red-500')).not.toBeNull();

    await user.type(password, 'B');
    expect(container.querySelector('.bg-orange-500')).not.toBeNull();

    await user.type(password, '1');
    expect(container.querySelector('.bg-yellow-400')).not.toBeNull();

    await user.type(password, 'defgh');
    expect(container.querySelector('.bg-green-500')).not.toBeNull();
  });

  it('alterna la visibilidad de ambas contraseñas', async () => {
    const user = userEvent.setup();
    renderPage();

    const [password, confirm] = screen.getAllByPlaceholderText('••••••••');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(password.parentElement!.querySelector('button')!);
    expect(password).toHaveAttribute('type', 'text');

    await user.click(confirm.parentElement!.querySelector('button')!);
    expect(confirm).toHaveAttribute('type', 'text');
  });

  it('marca en rojo la confirmación cuando no coincide', async () => {
    const user = userEvent.setup();
    renderPage();

    const [, confirm] = screen.getAllByPlaceholderText('••••••••');
    await user.type(screen.getByPlaceholderText('123456'), '123456');
    await user.type(confirm, 'Otra1234');

    expect(confirm).toHaveStyle({ borderColor: 'rgb(239, 68, 68)' });
  });

  it('restablece la contraseña y navega al login', async () => {
    post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user);
    const submit = screen.getByRole('button', { name: 'Restablecer' });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(
      await screen.findByText('¡Contraseña restablecida! 🔐')
    ).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/auth/reset-password-user', {
      email: 'ana@example.com',
      code: '123456',
      new_password: 'Prueba123',
    });

    await waitFor(
      () => {
        expect(mocks.navigate).toHaveBeenCalledWith('/login');
      },
      { timeout: 3000 }
    );
  });

  it('muestra el detalle en array que devuelve el servidor', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: [{ msg: 'Código inválido' }, { msg: 'Código expirado' }] } },
    });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));

    expect(
      await screen.findByText('Código inválido · Código expirado')
    ).toBeInTheDocument();
  });

  it('usa el campo message del servidor si no hay detail', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'No se pudo actualizar' } },
    });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));

    expect(await screen.findByText('No se pudo actualizar')).toBeInTheDocument();
  });

  it('usa "Código inválido" y "Error de conexión" como fallbacks', async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { data: {} } });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(await screen.findByText('Código inválido')).toBeInTheDocument();

    post.mockRejectedValue(new Error('network down'));
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });

  it('muestra el estado de carga mientras guarda', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const user = userEvent.setup();
    renderPage();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));

    expect(await screen.findByText('Guardando...')).toBeInTheDocument();

    resolveRequest({ data: {} });
    await waitFor(() => {
      expect(screen.queryByText('Guardando...')).not.toBeInTheDocument();
    });
  });
});
