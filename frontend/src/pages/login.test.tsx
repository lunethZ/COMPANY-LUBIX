import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import api from '../api/axios'
import Login from './login'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mocks.login, isAuthenticated: false, user: null }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mocks.navigate }
})

const post = vi.mocked(api.post)

const respuestaLogin = (role: string) => ({
  data: {
    message: 'ok',
    access_token: 'token-abc',
    refresh_token: 'refresh-xyz',
    token_type: 'bearer',
    id: 7,
    Nombre: 'Ana',
    email: 'ana@example.com',
    role,
  },
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

async function llenarCredenciales(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com')
  await user.type(screen.getByPlaceholderText('••••••••'), 'Prueba123')
}

describe('Login', () => {
  beforeEach(() => {
    post.mockReset()
    mocks.login.mockReset()
    mocks.navigate.mockReset()
    localStorage.clear()
  })

  describe('se renderiza', () => {
    it('muestra el título, los campos, el botón y los enlaces', () => {
      renderLogin()

      expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeEnabled()
      expect(screen.getByRole('link', { name: 'Regístrate' })).toHaveAttribute('href', '/register')
      expect(screen.getByRole('link', { name: 'Recuperar' })).toHaveAttribute('href', '/recover')
    })

    it('ofrece elegir entre Usuario y Empresa', () => {
      renderLogin()

      expect(screen.getByRole('button', { name: 'Usuario' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Empresa' })).toBeInTheDocument()
    })
  })

  describe('error de validación visible', () => {
    it('avisa cuando se envía con los campos vacíos y no llama a la API', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(await screen.findByText('Completa todos los campos')).toBeInTheDocument()
      expect(post).not.toHaveBeenCalled()
    })

    it('avisa cuando falta la contraseña', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com')
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(await screen.findByText('Completa todos los campos')).toBeInTheDocument()
      expect(post).not.toHaveBeenCalled()
    })

    it('muestra el mensaje que devuelve el servidor cuando las credenciales son inválidas', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { detail: 'Credenciales inválidas' } },
      })
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
      expect(mocks.login).not.toHaveBeenCalled()
    })
  })

  describe('el envío funciona', () => {
    it('inicia sesión como usuario con las credenciales escritas', async () => {
      post.mockResolvedValue(respuestaLogin('user'))
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(await screen.findByText('¡Bienvenido Ana!')).toBeInTheDocument()
      expect(post).toHaveBeenCalledWith('/auth/login-user', {
        email: 'ana@example.com',
        password: 'Prueba123',
      })
      expect(mocks.login).toHaveBeenCalledWith('token-abc', {
        id: 7,
        name: 'Ana',
        email: 'ana@example.com',
        role_id: 'user',
      })
      expect(localStorage.getItem('access_token')).toBe('token-abc')
      expect(localStorage.getItem('refresh_token')).toBe('refresh-xyz')
    })

    it('usa el endpoint de empresa cuando se elige Empresa', async () => {
      post.mockResolvedValue(respuestaLogin('company'))
      const user = userEvent.setup()
      renderLogin()

      await user.click(screen.getByRole('button', { name: 'Empresa' }))
      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(await screen.findByText('¡Bienvenido Ana!')).toBeInTheDocument()
      expect(post).toHaveBeenCalledWith('/auth/login-company', {
        email: 'ana@example.com',
        password: 'Prueba123',
      })
      expect(mocks.login).toHaveBeenCalledWith(
        'token-abc',
        expect.objectContaining({ role_id: 'empresa' })
      )
    })
  })
})
