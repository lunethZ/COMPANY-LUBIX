import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import HomeEmpresa from './home-empresa';
import { renderWithProviders } from '../test/utils';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

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
  apiMocks.get.mockResolvedValue({ data: { items: [], subtotal: 0, total_items: 0 } });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Home corporativa', () => {
  it('renderiza la propuesta de valor para empresas', () => {
    renderWithProviders(<HomeEmpresa />);

    expect(
      screen.getByRole('heading', {
        name: 'Impulsando el Futuro de las Empresas en Lubix',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Diferenciales que Sostienen Nuestro Éxito',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Agendar Alianza')).toBeInTheDocument();
  });

  it('permite navegar a registrar una alianza', async () => {
    renderWithProviders(
      <>
        <HomeEmpresa />
        <LocationDisplay />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Agendar Alianza/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/register');
  });

  it('navega al dashboard y al registro desde los llamados a la acción', async () => {
    renderWithProviders(
      <>
        <HomeEmpresa />
        <LocationDisplay />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Conocer Más' }));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/dashboard-empresa',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Contactar Consultor' }),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/register');
  });

  it('muestra el nombre de la empresa autenticada', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u1',
        name: 'TechStore',
        email: 'tienda@lubix.test',
        role_id: 'empresa',
      }),
    );

    renderWithProviders(<HomeEmpresa />);

    expect(screen.getAllByText('TechStore').length).toBeGreaterThan(0);
  });

  it('rota automáticamente los casos de éxito', () => {
    vi.useFakeTimers();
    renderWithProviders(<HomeEmpresa />);

    expect(
      screen.getByRole('heading', { name: 'Expansión Logística Nacional' }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      screen.getByRole('heading', {
        name: 'Transformación Tecnológica Colectiva',
      }),
    ).toBeInTheDocument();
  });
});
