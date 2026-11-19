import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerificationCode from './verific-code';
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
  return renderWithProviders(<VerificationCode />);
}

function codeInputs() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')
  );
}

async function writeCode(
  user: ReturnType<typeof userEvent.setup>,
  code = '123456'
) {
  const inputs = codeInputs();
  for (let i = 0; i < code.length; i += 1) {
    await user.type(inputs[i], code[i]);
  }
}

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('No se encontró el formulario');
  fireEvent.submit(form);
}

describe('VerificationCode', () => {
  beforeEach(() => {
    post.mockReset();
    mocks.navigate.mockReset();
    localStorage.clear();
  });

  it('muestra el formulario, los seis dígitos y los enlaces', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument();
    expect(screen.getByText('Verifica email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(codeInputs()).toHaveLength(6);
    expect(screen.getByText('Ctrl+V para pegar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reenviar' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Cambiar email' })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('avisa cuando se intenta verificar sin email', async () => {
    const user = userEvent.setup();
    renderPage();

    await writeCode(user);
    submitForm();

    expect(await screen.findByText('Ingresa tu email')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('avisa cuando el código está incompleto', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await writeCode(user, '123');
    submitForm();

    expect(await screen.findByText('Código incompleto')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('verifica el correo, muestra el éxito y navega al login', async () => {
    post.mockResolvedValue({ data: { data: { token: 'token-verificacion' } } });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await writeCode(user);

    const verify = screen.getByRole('button', { name: 'Verificar' });
    expect(verify).toBeEnabled();
    await user.click(verify);

    expect(await screen.findByText('¡Verificado!')).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/auth/verify-email-user', {
      email: 'ana@example.com',
      code: '123456',
    });

    await waitFor(
      () => {
        expect(mocks.navigate).toHaveBeenCalledWith('/login', {
          state: {
            email: 'ana@example.com',
            verified: true,
            token: 'token-verificacion',
          },
        });
      },
      { timeout: 3000 }
    );
  });

  it('muestra el detalle en array y limpia el código cuando falla la verificación', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: [{ msg: 'Código expirado' }, { msg: 'Intenta de nuevo' }] } },
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await writeCode(user);
    await user.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(
      await screen.findByText('Código expirado · Intenta de nuevo')
    ).toBeInTheDocument();
    expect(codeInputs().every((input) => input.value === '')).toBe(true);
  });

  it('usa "Código inválido" cuando el error no trae detalle', async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { data: {} } });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await writeCode(user);
    await user.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('Código inválido')).toBeInTheDocument();
  });

  it('usa "Error de conexión" ante un fallo no axios', async () => {
    post.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await writeCode(user);
    await user.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });

  it('reenvía el código correctamente', async () => {
    post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Reenviar' }));

    expect(await screen.findByText('Nuevo código enviado')).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/auth/resend-verification', {
      email: 'ana@example.com',
    });
  });

  it('muestra el error del servidor al reenviar', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'No se pudo reenviar' } },
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Reenviar' }));
    expect(await screen.findByText('No se pudo reenviar')).toBeInTheDocument();
  });

  it('usa "Error de conexión" al reenviar si el fallo no es axios', async () => {
    post.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Reenviar' }));

    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });

  it('pega el código, navega con teclado y verifica con Enter', async () => {
    post.mockResolvedValue({ data: { data: {} } });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com');
    const pasteZone = screen.getByText('Código').parentElement!;
    fireEvent.paste(pasteZone, {
      clipboardData: { getData: () => '12a34 56' },
    });

    await waitFor(() => {
      expect(codeInputs().map((input) => input.value).join('')).toBe('123456');
    });

    fireEvent.keyDown(codeInputs()[5], { key: 'Enter' });

    expect(await screen.findByText('¡Verificado!')).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/auth/verify-email-user', {
      email: 'ana@example.com',
      code: '123456',
    });
  });

  it('mueve el foco al dígito anterior con Backspace', async () => {
    const user = userEvent.setup();
    renderPage();

    await writeCode(user, '12');
    const inputs = codeInputs();
    inputs[2].focus();
    fireEvent.keyDown(inputs[2], { key: 'Backspace' });

    expect(document.activeElement).toBe(inputs[1]);
  });
});
