import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import AuthModal from '../AuthModal';
import { useAuthModal } from '../../context/AuthModalContext';
import { renderWithProviders } from '../../test/utils';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../../api/axios', () => ({
  default: {
    ...apiMocks,
    defaults: { headers: { common: {} } },
  },
}));

const Opener = () => {
  const { openLogin, openRegister } = useAuthModal();
  return (
    <>
      <button onClick={openLogin}>abrir login</button>
      <button onClick={openRegister}>abrir registro</button>
    </>
  );
};

const renderModal = () =>
  renderWithProviders(
    <>
      <AuthModal />
      <Opener />
    </>,
  );

const submitForm = (container: HTMLElement) => {
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
};

const axiosError = (status: number, detail: unknown) => ({
  isAxiosError: true,
  response: { status, data: { detail } },
});

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.get.mockResolvedValue({ data: { items: [] } });
});

describe('AuthModal', () => {
  it('valida el login y cubre los errores del backend y el cambio de tipo de cuenta', async () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByText('abrir login'));

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();

    submitForm(container);
    expect(await screen.findByText('Completa todos los campos')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ejemplo.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secreta' } });

    apiMocks.post.mockRejectedValueOnce(axiosError(403, 'Esta cuenta es de empresa'));
    submitForm(container);
    expect(await screen.findByText('Esta cuenta es de tipo empresa.')).toBeInTheDocument();

    apiMocks.post.mockRejectedValueOnce(axiosError(400, 'Datos incorrectos'));
    submitForm(container);
    expect(await screen.findByText('El correo o la contraseña son incorrectos.')).toBeInTheDocument();

    apiMocks.post.mockRejectedValueOnce(new Error('offline'));
    submitForm(container);
    expect(await screen.findByText('Error de conexión.')).toBeInTheDocument();

    apiMocks.post.mockResolvedValueOnce({
      data: {
        access_token: 'token-empresa',
        refresh_token: 'refresh',
        role: 'company',
        id: 7,
        Nombre: 'Lubix S.A.S',
        email: 'empresa@ejemplo.com',
      },
    });
    submitForm(container);
    expect(await screen.findByText('Esta cuenta es de tipo empresa. Selecciona \'Empresa\'.')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Empresa' })[0]);
    apiMocks.post.mockResolvedValueOnce({
      data: {
        access_token: 'token-empresa',
        refresh_token: 'refresh',
        role: 'company',
        id: 7,
        Nombre: 'Lubix S.A.S',
        email: 'empresa@ejemplo.com',
      },
    });
    submitForm(container);
    expect(await screen.findByRole('button', { name: 'abrir login' })).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBe('token-empresa');
  });

  it('valida el registro y cubre el flujo de empresa', async () => {
    const { container } = renderModal();
    fireEvent.click(screen.getByText('abrir registro'));

    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'Abcdef12' } });
    fireEvent.change(confirmInput, { target: { value: 'Abcdef1' } });
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();

    fireEvent.change(confirmInput, { target: { value: 'Abcdef12' } });
    submitForm(container);
    expect(await screen.findByText('Nombre obligatorio')).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: 'Ana' } });
    fireEvent.change(container.querySelector('input[name="surname"]') as HTMLInputElement, { target: { value: 'Pérez' } });
    submitForm(container);
    expect(await screen.findByText('Correo obligatorio')).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[name="email"]') as HTMLInputElement, { target: { value: 'ana@ejemplo.com' } });
    submitForm(container);
    expect(await screen.findByText('Teléfono obligatorio')).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[name="tell"]') as HTMLInputElement, { target: { value: '3001234567' } });
    apiMocks.post.mockRejectedValueOnce(axiosError(400, [{ msg: 'Correo ya registrado' }]));
    submitForm(container);
    expect(await screen.findByText('Correo ya registrado')).toBeInTheDocument();

    apiMocks.post.mockRejectedValueOnce(axiosError(500, undefined));
    submitForm(container);
    expect(await screen.findByText('Error al registrar')).toBeInTheDocument();

    apiMocks.post.mockResolvedValueOnce({ data: {} });
    submitForm(container);
    expect(await screen.findByRole('button', { name: 'abrir registro' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('abrir registro'));
    fireEvent.click(screen.getByRole('button', { name: 'Empresa' }));
    fireEvent.change(container.querySelector('input[name="password"]') as HTMLInputElement, { target: { value: 'Abcdef12' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]') as HTMLInputElement, { target: { value: 'Abcdef12' } });
    submitForm(container);
    expect(await screen.findByText('Nombre de empresa obligatorio')).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[name="companyName"]') as HTMLInputElement, { target: { value: 'Lubix SAS' } });
    submitForm(container);
    expect(await screen.findByText('NIT obligatorio')).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[name="nit"]') as HTMLInputElement, { target: { value: '900123456' } });
    submitForm(container);
    expect(await screen.findByText('Dirección obligatoria')).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[name="address"]') as HTMLInputElement, { target: { value: 'Calle 1' } });
    apiMocks.post.mockResolvedValueOnce({ data: {} });
    submitForm(container);
    expect(await screen.findByRole('button', { name: 'abrir registro' })).toBeInTheDocument();
  });
});
