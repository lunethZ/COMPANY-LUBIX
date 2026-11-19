import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forgotPassword, resetPassword } from './auts';

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('./axios', () => ({
  default: {
    post: apiMocks.post,
    defaults: { headers: { common: {} } },
  },
}));

beforeEach(() => {
  apiMocks.post.mockReset();
});

describe('API de autenticación', () => {
  it('envía la solicitud de recuperación de contraseña', async () => {
    apiMocks.post.mockResolvedValue({ data: { message: 'ok' } });

    await forgotPassword({ email: 'ana@lubix.test' });

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/forgot-password-user', {
      email: 'ana@lubix.test',
    });
  });

  it('envía la solicitud de restablecimiento de contraseña', async () => {
    apiMocks.post.mockResolvedValue({ data: { message: 'ok' } });

    await resetPassword({
      email: 'ana@lubix.test',
      code: '123456',
      new_password: 'Nueva123',
    });

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/reset-password-user', {
      email: 'ana@lubix.test',
      code: '123456',
      new_password: 'Nueva123',
    });
  });
});
