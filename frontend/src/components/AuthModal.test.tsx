import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from './AuthModal';
import { useAuthModal } from '../context/AuthModalContext';
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

function ModalLauncher() {
  const { openLogin, openRegister } = useAuthModal();
  return (
    <div>
      <button onClick={openLogin}>abrir-login</button>
      <button onClick={openRegister}>abrir-registro</button>
    </div>
  );
}

function renderModal() {
  return renderWithProviders(
    <>
      <ModalLauncher />
      <AuthModal />
    </>
  );
}

async function openLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'abrir-login' }));
}

async function openRegister(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'abrir-registro' }));
}

async function fillLogin(
  user: ReturnType<typeof userEvent.setup>,
  email = 'ana@example.com',
  password = 'Prueba123'
) {
  await user.type(screen.getByPlaceholderText('tu@email.com'), email);
  await user.type(screen.getByPlaceholderText('••••••••'), password);
}

const loginResponse = (role: string) => ({
  data: {
    message: 'ok',
    access_token: 'token-abc',
    refresh_token: 'refresh-xyz',
    token_type: 'bearer',
    id: 7,
    Nombre: 'Ana',
    email: 'ana@example.com',
    role,
  },
});

async function fillUserRegister(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Nombre'), 'Ana');
  await user.type(screen.getByPlaceholderText('Apellido'), 'Pérez');
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
  await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567');
  const [password, confirm] = screen.getAllByPlaceholderText('••••••••');
  await user.type(password, 'Prueba123');
  await user.type(confirm, 'Prueba123');
}

async function fillCompanyRegister(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Nombre contacto'), 'Ana');
  await user.type(screen.getByPlaceholderText('Lubix S.A.S'), 'Lubix S.A.S');
  await user.type(screen.getByPlaceholderText('900123456'), '900123456');
  await user.type(screen.getByPlaceholderText('7'), '1');
  await user.type(screen.getByPlaceholderText('Calle 123 #45-67'), 'Calle 1 #2-3');
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'empresa@example.com');
  await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567');
  const [password, confirm] = screen.getAllByPlaceholderText('••••••••');
  await user.type(password, 'Prueba123');
  await user.type(confirm, 'Prueba123');
}

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('No se encontró el formulario');
  fireEvent.submit(form);
}

describe('AuthModal', () => {
  beforeEach(() => {
    post.mockReset();
    mocks.navigate.mockReset();
    localStorage.clear();
  });

  it('abre en la pestaña de login y permite cambiar a registro y volver', async () => {
    const user = userEvent.setup();
    renderModal();

    await openLogin(user);

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();
    expect(screen.getByText('Tu marketplace de confianza')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Registrarse' }));
    expect(screen.getByText('¿Ya tienes cuenta?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(screen.getByText('¿No tienes cuenta?')).toBeInTheDocument();
  });

  it('abre directamente en la pestaña de registro con openRegister', async () => {
    const user = userEvent.setup();
    renderModal();

    await openRegister(user);

    expect(screen.getByPlaceholderText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('¿Ya tienes cuenta?')).toBeInTheDocument();
  });

  it('alterna la visibilidad de la contraseña en login', async () => {
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);

    const password = screen.getByPlaceholderText('••••••••');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(password.parentElement!.querySelector('button')!);
    expect(password).toHaveAttribute('type', 'text');

    await user.click(password.parentElement!.querySelector('button')!);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('alterna la visibilidad de contraseña y confirmación en registro', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);

    const [password, confirm] = screen.getAllByPlaceholderText('••••••••');
    await user.click(password.parentElement!.querySelector('button')!);
    expect(password).toHaveAttribute('type', 'text');

    await user.click(confirm.parentElement!.querySelector('button')!);
    expect(confirm).toHaveAttribute('type', 'text');
  });

  it('avisa cuando el login se envía con campos vacíos', async () => {
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    expect(await screen.findByText('Completa todos los campos')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('inicia sesión como usuario y redirige a home-usuario', async () => {
    post.mockResolvedValue(loginResponse('user'));
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/home-usuario', { replace: true });
    });
    expect(post).toHaveBeenCalledWith('/auth/login-user', {
      email: 'ana@example.com',
      password: 'Prueba123',
    });
    expect(localStorage.getItem('access_token')).toBe('token-abc');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-xyz');
    expect(api.defaults.headers.common.Authorization).toBe('Bearer token-abc');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('tu@email.com')).not.toBeInTheDocument();
    });
  });

  it('inicia sesión como empresa y redirige a dashboard-empresa', async () => {
    post.mockResolvedValue(loginResponse('company'));
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await user.click(screen.getByRole('button', { name: 'Usuario' }));
    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/dashboard-empresa', { replace: true });
    });
    expect(post).toHaveBeenCalledWith('/auth/login-company', {
      email: 'ana@example.com',
      password: 'Prueba123',
    });
  });

  it('inicia sesión como admin y redirige a dashboard-admin', async () => {
    post.mockResolvedValue(loginResponse('admin'));
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/dashboard-admin', { replace: true });
    });
  });

  it('pide seleccionar Empresa cuando la cuenta es de empresa', async () => {
    post.mockResolvedValue(loginResponse('company'));
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    expect(
      await screen.findByText("Esta cuenta es de tipo empresa. Selecciona 'Empresa'.")
    ).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('pide seleccionar Usuario cuando la cuenta es de usuario', async () => {
    post.mockResolvedValue(loginResponse('user'));
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    expect(
      await screen.findByText("Esta cuenta es de tipo usuario. Selecciona 'Usuario'.")
    ).toBeInTheDocument();
  });

  it('muestra el detalle en array que devuelve el servidor al fallar el login', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: { detail: [{ msg: 'Email inválido' }, { msg: 'Contraseña corta' }] },
      },
    });
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    expect(
      await screen.findByText('Email inválido. Contraseña corta')
    ).toBeInTheDocument();
  });

  it('traduce el error 400 de credenciales incorrectas', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { detail: 'Datos incorrectos' } },
    });
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    expect(
      await screen.findByText('El correo o la contraseña son incorrectos.')
    ).toBeInTheDocument();
  });

  it('traduce el error 403 según el tipo de cuenta', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { detail: 'Cuenta de empresa' } },
    });
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);
    expect(
      await screen.findByText('Esta cuenta es de tipo empresa.')
    ).toBeInTheDocument();
  });

  it('usa el mensaje genérico ante un error de conexión en login', async () => {
    post.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);
    await fillLogin(user);

    await user.click(screen.getAllByRole('button', { name: 'Iniciar Sesión' })[1]);

    expect(await screen.findByText('Error de conexión.')).toBeInTheDocument();
  });

  it('muestra los requisitos y la fortaleza de la contraseña al registrarse', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);

    const [password] = screen.getAllByPlaceholderText('••••••••');
    await user.type(password, 'abc');

    expect(screen.getByText('8+ chars')).toBeInTheDocument();
    expect(screen.getByText('A-Z')).toBeInTheDocument();
    expect(screen.getByText('a-z')).toBeInTheDocument();
    expect(screen.getByText('0-9')).toBeInTheDocument();
    expect(screen.getByText('Débil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();
  });

  it('actualiza la fortaleza de la contraseña al escribir', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);

    const [password] = screen.getAllByPlaceholderText('••••••••');
    await user.type(password, 'Abcdef12');

    expect(screen.getByText('Fuerte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();
  });

  it('avisa cuando las contraseñas del registro no coinciden', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    const [, confirm] = screen.getAllByPlaceholderText('••••••••');
    await user.clear(confirm);
    await user.type(confirm, 'Prueba124');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findAllByText('Las contraseñas no coinciden')
    ).not.toHaveLength(0);
    expect(post).not.toHaveBeenCalled();
  });

  it('valida nombre, apellido, correo y teléfono antes de registrar', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    await user.clear(screen.getByPlaceholderText('Nombre'));
    submitForm();
    expect(await screen.findByText('Nombre obligatorio')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Nombre'), 'Ana');
    await user.clear(screen.getByPlaceholderText('Apellido'));
    submitForm();
    expect(await screen.findByText('Apellido obligatorio')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Apellido'), 'Pérez');
    await user.clear(screen.getByPlaceholderText('tu@email.com'));
    submitForm();
    expect(await screen.findByText('Correo obligatorio')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.clear(screen.getByPlaceholderText('+57 300 123 4567'));
    submitForm();
    expect(await screen.findByText('Teléfono obligatorio')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('valida que la contraseña cumpla los requisitos antes de registrar', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    const [password] = screen.getAllByPlaceholderText('••••••••');
    await user.clear(password);
    await user.type(password, 'abc');
    const [, confirm] = screen.getAllByPlaceholderText('••••••••');
    await user.clear(confirm);
    await user.type(confirm, 'abc');
    submitForm();

    expect(
      await screen.findByText(
        'La contraseña debe tener 8+ chars, mayúscula, minúscula y número.'
      )
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('registra un usuario y navega a la verificación de correo', async () => {
    post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/register/VerifyEmailPage', {
        replace: true,
      });
    });
    expect(post).toHaveBeenCalledWith('/auth/register-user', {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      tell: '3001234567',
      password: 'Prueba123',
    });
  });

  it('valida los campos obligatorios de la empresa', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await fillCompanyRegister(user);

    await user.clear(screen.getByPlaceholderText('Lubix S.A.S'));
    submitForm();
    expect(await screen.findByText('Nombre de empresa obligatorio')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Lubix S.A.S'), 'Lubix');
    await user.clear(screen.getByPlaceholderText('900123456'));
    submitForm();
    expect(await screen.findByText('NIT obligatorio')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('900123456'), '900123456');
    await user.clear(screen.getByPlaceholderText('Calle 123 #45-67'));
    submitForm();
    expect(await screen.findByText('Dirección obligatoria')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('valida el formato de NIT, dígito y nombre de empresa', async () => {
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await fillCompanyRegister(user);

    const companyName = screen.getByPlaceholderText('Lubix S.A.S');
    const nit = screen.getByPlaceholderText('900123456');
    const nitDV = screen.getByPlaceholderText('7');

    await user.clear(companyName);
    await user.type(companyName, 'Lu');
    submitForm();
    expect(
      await screen.findByText('El nombre de la empresa debe tener entre 3 y 50 caracteres'),
    ).toBeInTheDocument();

    await user.clear(companyName);
    await user.type(companyName, 'Lubix S.A.S');
    await user.clear(nit);
    await user.type(nit, '1234');
    submitForm();
    expect(await screen.findByText('El NIT debe tener al menos 5 dígitos')).toBeInTheDocument();

    await user.clear(nit);
    await user.type(nit, '900123456');
    await user.clear(nitDV);
    submitForm();
    expect(
      await screen.findByText('Dígito de verificación obligatorio'),
    ).toBeInTheDocument();

    await user.type(nitDV, 'a');
    submitForm();
    expect(
      await screen.findByText('El dígito de verificación debe ser un solo número'),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('registra una empresa enviando FormData y navega al login', async () => {
    post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await user.click(screen.getByRole('button', { name: 'Empresa' }));
    await fillCompanyRegister(user);

    await user.click(screen.getByRole('button', { name: 'Registrar empresa' }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
    });
    expect(post).toHaveBeenCalledWith(
      '/auth/register-company',
      expect.any(FormData)
    );
  });

  it('muestra el detalle en array al fallar el registro', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: [{ msg: 'Correo ya existe' }, { msg: 'NIT inválido' }] } },
    });
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText('Correo ya existe. NIT inválido')
    ).toBeInTheDocument();
  });

  it('muestra el detalle string y los mensajes de fallback al fallar el registro', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'El correo ya está registrado' } },
    });
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(
      await screen.findByText('El correo ya está registrado')
    ).toBeInTheDocument();
  });

  it('usa "Error al registrar" cuando el error no trae detalle', async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { data: {} } });
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Error al registrar')).toBeInTheDocument();
  });

  it('usa "Error desconocido" ante un fallo no axios en el registro', async () => {
    post.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderModal();
    await openRegister(user);
    await fillUserRegister(user);

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Error desconocido')).toBeInTheDocument();
  });

  it('cierra el modal al hacer clic en el fondo', async () => {
    const user = userEvent.setup();
    renderModal();
    await openLogin(user);

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('tu@email.com')).not.toBeInTheDocument();
    });
  });
});
