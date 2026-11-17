import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import NavbarUsuario from '../navbaruser';
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

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('access_token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({
    id: 1,
    name: 'Ana',
    email: 'ana@ejemplo.com',
    role_id: 'user',
  }));
  apiMocks.get.mockReset();
  apiMocks.post.mockReset();
  apiMocks.get.mockImplementation((url: string) => {
    if (url === '/cart') {
      return Promise.resolve({ data: { items: [] } });
    }
    if (url === '/user/dashboard/me') {
      return Promise.resolve({ data: { avatar: 'users/avatar.png' } });
    }
    return Promise.resolve({ data: [] });
  });
});

describe('NavbarUsuario', () => {
  it('renderiza y resuelve el avatar relativo con la URL base de la API', async () => {
    renderWithProviders(<NavbarUsuario />);

    const avatar = await screen.findByAltText('Avatar');
    expect(avatar).toHaveAttribute('src', expect.stringContaining('/files/users/avatar.png'));
  });
});
