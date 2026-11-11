import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { CartProvider } from '../context/CartContext';
import { AuthModalProvider } from '../context/AuthModalContext';

/**
 * Renderiza un componente con la misma pila de providers que `main.tsx`
 * (ThemeProvider > Router > AuthProvider > CartProvider > AuthModalProvider),
 * usando MemoryRouter para poder navegar/leer params en las pruebas.
 */
interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Ruta inicial del MemoryRouter (permite probar `useParams` con `<Routes>`). */
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  options?: ProviderOptions,
) {
  const { initialEntries = ['/'], ...renderOptions } = options ?? {};

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <CartProvider>
            <AuthModalProvider>{children}</AuthModalProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
