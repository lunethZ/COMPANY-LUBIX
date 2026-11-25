import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './ThemeContext';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { AuthModalProvider } from './AuthModalContext';
import { useAuthModal } from './AuthModalContext';

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} data-testid="theme">
      {theme}
    </button>
  );
}

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="user">{auth.user?.name ?? 'anon'}</p>
      <p data-testid="flags">
        {[auth.isAuthenticated, auth.isUser(), auth.isCompany(), auth.isAdmin()].join(',')}
      </p>
      <button
        onClick={() =>
          auth.login('token', {
            id: 7,
            name: 'Ana',
            email: 'ana@lubix.test',
            role_id: 'empresa',
          })
        }
      >
        entrar
      </button>
      <button onClick={() => auth.updateUser({ name: 'Ana Actualizada' })}>actualizar</button>
      <button onClick={auth.logout}>salir</button>
    </div>
  );
}

function ModalProbe() {
  const modal = useAuthModal();
  return (
    <div>
      <p data-testid="modal-state">{`${modal.isOpen}:${modal.initialTab}`}</p>
      <button onClick={modal.openLogin}>login</button>
      <button onClick={modal.openRegister}>registro</button>
      <button onClick={modal.close}>cerrar</button>
    </div>
  );
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('ThemeProvider y useTheme', () => {
  it('lanza error si useTheme se usa fuera del provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeProbe />)).toThrow('useTheme debe usarse dentro de ThemeProvider');
    spy.mockRestore();
  });

  it('parte en claro si el sistema no pide oscuro', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('parte en oscuro si el sistema lo prefiere', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respeta el tema guardado y alterna entre ambos', async () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    await userEvent.click(screen.getByTestId('theme'));

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('AuthProvider y useAuth', () => {
  it('lanza error si useAuth se usa fuera del provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthProbe />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });

  it('inicia sesión, actualiza el usuario y cierra sesión', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user')).toHaveTextContent('anon');
    expect(screen.getByTestId('flags')).toHaveTextContent('false,false,false,false');

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    expect(screen.getByTestId('user')).toHaveTextContent('Ana');
    expect(screen.getByTestId('flags')).toHaveTextContent('true,false,true,false');
    expect(JSON.parse(localStorage.getItem('user') as string).name).toBe('Ana');

    await userEvent.click(screen.getByRole('button', { name: 'actualizar' }));
    expect(screen.getByTestId('user')).toHaveTextContent('Ana Actualizada');

    await userEvent.click(screen.getByRole('button', { name: 'salir' }));
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('expone el rol admin', async () => {
    localStorage.setItem('access_token', 't');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, name: 'Root', email: 'root@lubix.test', role_id: 'admin' }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('flags')).toHaveTextContent('true,false,false,true');
  });

  it('ignora un usuario corrupto en localStorage', () => {
    localStorage.setItem('access_token', 't');
    localStorage.setItem('user', '{no-json');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user')).toHaveTextContent('anon');
  });
});

describe('AuthModalProvider y useAuthModal', () => {
  it('lanza error si useAuthModal se usa fuera del provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ModalProbe />)).toThrow('useAuthModal must be used within AuthModalProvider');
    spy.mockRestore();
  });

  it('abre login, abre registro y cierra', async () => {
    render(
      <AuthModalProvider>
        <ModalProbe />
      </AuthModalProvider>,
    );

    expect(screen.getByTestId('modal-state')).toHaveTextContent('false:login');

    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('true:login');

    await userEvent.click(screen.getByRole('button', { name: 'registro' }));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('true:register');

    await userEvent.click(screen.getByRole('button', { name: 'cerrar' }));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('false:register');
  });
});
