import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeEmpresa from './home-empresa';
import { renderWithProviders } from '../test/utils';

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
    renderWithProviders(<HomeEmpresa />);

    await userEvent.click(screen.getByRole('button', { name: /Agendar Alianza/ }));

    expect(screen.getByText('Agendar Alianza')).toBeInTheDocument();
  });
});
