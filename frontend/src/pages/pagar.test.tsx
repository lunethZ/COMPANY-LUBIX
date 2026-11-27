import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PagarPage from './pagar';
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

const cartItem = {
  id: 'p1',
  product_id: 'p1',
  name: 'Mouse Gamer',
  price: 85000,
  discount_enable: false,
  discount_value: 0,
  unit_price: 85000,
  image: '',
  stock: 5,
  quantity: 1,
  line_total: 85000,
};

const seedCart = () => {
  localStorage.setItem('cart', JSON.stringify([cartItem]));
};

const mockPrefill = () => {
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/user/addresses') return Promise.resolve({ data: [] });
    return Promise.resolve({ data: {} });
  });
};

const setValue = (placeholder: string, value: string) => {
  fireEvent.change(screen.getByPlaceholderText(placeholder), {
    target: { value },
  });
};

const completarEnvio = () => {
  setValue('Juan Pérez', 'Juan Pérez');
  setValue('CC / NIT', '1020304050');
  setValue('tu@email.com', 'juan@x.com');
  setValue('300 123 4567', '3001234567');
  setValue('Calle 123 #45-67', 'Calle 1 #2-3');
  setValue('Bogotá', 'Bogotá');
  setValue('Cundinamarca', 'Cundinamarca');
  setValue('110111', '110111');
};

const completarTarjeta = () => {
  setValue('4111 1111 1111 1111', '4111111111111111');
  setValue('Como aparece en la tarjeta', 'Juan Pérez');
  setValue('MM/AA', '1230');
  setValue('123', '123');
};

beforeEach(() => {
  localStorage.clear();
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
});

describe('Página de pago', () => {
  it('muestra el estado vacío cuando el carrito no tiene productos', () => {
    renderWithProviders(<PagarPage />);

    expect(
      screen.getByRole('heading', { name: 'No hay productos para pagar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument();
  });

  it('valida los datos de envío antes de avanzar', async () => {
    seedCart();
    mockPrefill();
    const user = userEvent.setup();
    renderWithProviders(<PagarPage />);

    expect(
      await screen.findByRole('heading', { name: 'Finalizar compra' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Datos de envío' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El documento es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La dirección es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('La ciudad es obligatoria')).toBeInTheDocument();
    expect(
      screen.getByText('El departamento es obligatorio'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('El código postal es obligatorio'),
    ).toBeInTheDocument();
    // No avanza al paso de pago.
    expect(
      screen.queryByRole('heading', { name: 'Método de pago' }),
    ).not.toBeInTheDocument();

    // Correo con formato inválido (sin TLD): pasa el input nativo pero no la app.
    await user.type(screen.getByPlaceholderText('tu@email.com'), 'a@b');
    await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    expect(screen.getByText('Correo no válido')).toBeInTheDocument();
  });

  it('aplica envío gratis cuando el subtotal supera el mínimo', async () => {
    localStorage.setItem(
      'cart',
      JSON.stringify([
        { ...cartItem, price: 120000, unit_price: 120000, line_total: 120000 },
      ]),
    );
    mockPrefill();
    renderWithProviders(<PagarPage />);

    expect(await screen.findByRole('heading', { name: 'Finalizar compra' })).toBeInTheDocument();
    expect(screen.getByText('GRATIS')).toBeInTheDocument();
    expect(screen.getAllByText('$120.000').length).toBeGreaterThan(0);
  });

  it('precarga los datos del usuario y su dirección predeterminada', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'u1', name: 'Usuario', email: 'user@x.com', role_id: 'user' }),
    );
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/cart') return Promise.resolve({ data: { items: [cartItem] } });
      if (url === '/user/dashboard/me') {
        return Promise.resolve({
          data: { fullName: 'Ana Pérez', email: 'ana@x.com', tell: '3001234567' },
        });
      }
      if (url === '/user/addresses') {
        return Promise.resolve({
          data: [
            { address: 'Calle 1', city: 'Medellín', department: 'Antioquia', postal_code: '050001' },
            {
              address: 'Carrera 9',
              city: 'Bogotá',
              department: 'Cundinamarca',
              postal_code: '110111',
              is_default: true,
            },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });
    renderWithProviders(<PagarPage />);

    expect(await screen.findByDisplayValue('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ana@x.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3001234567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Carrera 9')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bogotá')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cundinamarca')).toBeInTheDocument();
    expect(screen.getByDisplayValue('110111')).toBeInTheDocument();
  });

  it('valida los datos de la tarjeta antes de revisar la compra', async () => {
    seedCart();
    mockPrefill();
    const user = userEvent.setup();
    renderWithProviders(<PagarPage />);

    await screen.findByRole('heading', { name: 'Finalizar compra' });
    completarEnvio();
    await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    await screen.findByRole('heading', { name: 'Método de pago' });

    setValue('4111 1111 1111 1111', '4111');
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(screen.getByText('Número incompleto')).toBeInTheDocument();

    setValue('4111 1111 1111 1111', '4111111111111112');
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(screen.getByText('Número de tarjeta inválido')).toBeInTheDocument();

    setValue('4111 1111 1111 1111', '4111111111111111');
    setValue('Como aparece en la tarjeta', 'Juan Pérez');
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(screen.getByText('Fecha de expiración obligatoria')).toBeInTheDocument();
    expect(screen.getByText('CVV obligatorio')).toBeInTheDocument();

    setValue('MM/AA', '0120');
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(screen.getByText('Fecha expirada o inválida')).toBeInTheDocument();

    setValue('MM/AA', '1230');
    setValue('123', '12');
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(screen.getByText('CVV incompleto')).toBeInTheDocument();

    setValue('123', '123');
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(
      await screen.findByRole('heading', { name: 'Revisa y confirma tu compra' }),
    ).toBeInTheDocument();
  });

  it('completa el pago con PSE eligiendo un banco', async () => {
    seedCart();
    mockPrefill();
    apiMocks.post.mockResolvedValue({ data: { id: 'PSE-456' } });
    const user = userEvent.setup();
    renderWithProviders(<PagarPage />);

    await screen.findByRole('heading', { name: 'Finalizar compra' });
    completarEnvio();
    await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    await screen.findByRole('heading', { name: 'Método de pago' });

    await user.click(screen.getByRole('button', { name: 'PSE' }));
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(screen.getByText('Selecciona tu banco')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Bancolombia' } });
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));

    expect(
      await screen.findByRole('heading', { name: 'Revisa y confirma tu compra' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/PSE · Bancolombia/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/ }));

    expect(await screen.findByText('¡Pago exitoso!')).toBeInTheDocument();
    expect(screen.getByText('PSE-456')).toBeInTheDocument();
    expect(screen.getByText('PSE · Bancolombia')).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith(
      '/user/orders',
      expect.objectContaining({ payment_method: 'pse' }),
    );
  }, 30000);

  it('muestra el pago exitoso aunque falle el registro del pedido', async () => {
    seedCart();
    mockPrefill();
    apiMocks.post.mockRejectedValue(new Error('sin conexión'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<PagarPage />);

    await screen.findByRole('heading', { name: 'Finalizar compra' });
    completarEnvio();
    await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    await screen.findByRole('heading', { name: 'Método de pago' });
    completarTarjeta();
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    await screen.findByRole('heading', { name: 'Revisa y confirma tu compra' });
    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/ }));

    expect(await screen.findByText('¡Pago exitoso!')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  }, 30000);

  it('completa el flujo de compra con tarjeta y registra el pedido', async () => {
    seedCart();
    mockPrefill();
    apiMocks.post.mockResolvedValue({ data: { id: 'LUBX-123' } });
    const user = userEvent.setup();
    renderWithProviders(<PagarPage />);

    await screen.findByRole('heading', { name: 'Finalizar compra' });
    completarEnvio();
    await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));

    // Paso 2: método de pago.
    expect(
      await screen.findByRole('heading', { name: 'Método de pago' }),
    ).toBeInTheDocument();

    // Validación propia de la tarjeta.
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));
    expect(
      screen.getByText('Ingresa el número de la tarjeta'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nombre del titular obligatorio'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Fecha de expiración obligatoria'),
    ).toBeInTheDocument();
    expect(screen.getByText('CVV obligatorio')).toBeInTheDocument();

    completarTarjeta();
    await user.click(screen.getByRole('button', { name: /Revisar compra/ }));

    // Paso 3: revisión.
    expect(
      await screen.findByRole('heading', {
        name: 'Revisa y confirma tu compra',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tarjeta Visa terminada en 1111/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Juan Pérez · juan@x\.com · 3001234567/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Confirmar y pagar \$100\.000/ }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Confirmar y pagar/ }),
    );

    expect(await screen.findByText('¡Pago exitoso!')).toBeInTheDocument();
    expect(screen.getByText('LUBX-123')).toBeInTheDocument();
    // El total pagado debe reflejar el monto de la compra, no el envío restante.
    expect(screen.getByText('$100.000')).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith(
      '/user/orders',
      expect.objectContaining({
        subtotal: 85000,
        shipping: 15000,
        total: 100000,
        payment_method: 'tarjeta',
        recipient: 'Juan Pérez',
        city: 'Bogotá',
        department: 'Cundinamarca',
      }),
    );
  }, 30000);
});
