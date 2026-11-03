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
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <AuthModalProvider>{children}</AuthModalProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
