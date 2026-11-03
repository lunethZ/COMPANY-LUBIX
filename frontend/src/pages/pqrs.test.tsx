import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PQRSPage from './pqrs';
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

const openForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Nueva solicitud' }));
  expect(
    screen.getByRole('heading', { name: 'Nueva solicitud PQRS' }),
  ).toBeInTheDocument();
};

describe('Página de PQRS', () => {
  it('renderiza el encabezado y la lista de solicitudes del usuario', async () => {
    apiMocks.get.mockResolvedValue({
      data: [
        {
          id: 'pqr-1',
          type: 'queja',
          subject: 'Producto defectuoso',
          description: 'Llegó con la pantalla rayada',
          status: 'pending',
          user_role: 'user',
          created_at: '2026-01-15T10:00:00',
        },
      ],
    });
    renderWithProviders(<PQRSPage />);

    expect(await screen.findByRole('heading', { name: 'PQRS' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Mis solicitudes/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Producto defectuoso')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/pqrs');
  });

  it('muestra el estado vacío cuando no hay solicitudes', async () => {
    apiMocks.get.mockResolvedValue({ data: [] });
    renderWithProviders(<PQRSPage />);

    expect(await screen.findByText(/No tienes solicitudes/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Mis solicitudes (0)' }),
    ).toBeInTheDocument();
  });

  it('mantiene el envío bloqueado y muestra errores si el formulario es inválido', async () => {
    apiMocks.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderWithProviders(<PQRSPage />);
    await screen.findByRole('heading', { name: 'PQRS' });

    await openForm(user);

    const submit = screen.getByRole('button', { name: /Enviar solicitud/ });
    // Formulario vacío: el botón queda deshabilitado.
    expect(submit).toBeDisabled();

    // Con asunto válido pero descripción vacía sigue bloqueado.
    await user.type(
      screen.getByPlaceholderText(/Breve descripci/),
      'Consulta sobre mi pedido',
    );
    expect(submit).toBeDisabled();

    // Simula el envío del formulario (Enter) con descripción pendiente:
    // los errores de campo deben hacerse visibles.
    fireEvent.submit(submit.closest('form') as HTMLFormElement);

    expect(screen.getAllByText(/La descripci/).length).toBeGreaterThan(0);
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('envía una solicitud válida y recarga la lista', async () => {
    apiMocks.get.mockResolvedValue({ data: [] });
    apiMocks.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<PQRSPage />);
    await screen.findByRole('heading', { name: 'PQRS' });

    await openForm(user);

    await user.type(
      screen.getByPlaceholderText(/Breve descripci/),
      'Producto con falla',
    );
    await user.type(
      screen.getByPlaceholderText(/Describe tu petici/),
      'El producto llegó con defectos de fábrica.',
    );

    const submit = screen.getByRole('button', { name: /Enviar solicitud/ });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(
      await screen.findByText(/enviada correctamente/),
    ).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith('/pqrs', {
      type: 'queja',
      subject: 'Producto con falla',
      description: 'El producto llegó con defectos de fábrica.',
    });
    // El formulario se cierra y la lista se vuelve a cargar.
    expect(
      screen.queryByRole('button', { name: /Enviar solicitud/ }),
    ).not.toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledTimes(2);
  });
});
