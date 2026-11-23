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

    it('inicia sesión como administrador y guarda el rol', async () => {
      post.mockResolvedValue(respuestaLogin('admin'))
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      await screen.findByText('¡Bienvenido Ana!')
      expect(mocks.login).toHaveBeenCalledWith(
        'token-abc',
        expect.objectContaining({ role_id: 'admin' })
      )
    })
  })

  describe('validaciones y errores del servidor', () => {
    it('rechaza un correo con formato inválido sin llamar a la API', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example')
      await user.type(screen.getByPlaceholderText('••••••••'), 'Prueba123')
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText('Ingresa un correo electrónico válido')
      ).toBeInTheDocument()
      expect(post).not.toHaveBeenCalled()
    })

    it('avisa cuando la cuenta no está verificada', async () => {
      post.mockResolvedValue({
        data: { message: 'Tu correo no ha sido verificado' },
      })
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText('Tu correo no ha sido verificado')
      ).toBeInTheDocument()
      expect(mocks.login).not.toHaveBeenCalled()
    })

    it('indica que la cuenta es de empresa si se intentó como usuario', async () => {
      post.mockResolvedValue(respuestaLogin('company'))
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText(
          "Esta cuenta es de tipo empresa. Selecciona 'Empresa' para iniciar sesión."
        )
      ).toBeInTheDocument()
      expect(mocks.login).not.toHaveBeenCalled()
    })

    it('indica que la cuenta es de usuario si se intentó como empresa', async () => {
      post.mockResolvedValue(respuestaLogin('user'))
      const user = userEvent.setup()
      renderLogin()

      await user.click(screen.getByRole('button', { name: 'Empresa' }))
      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText(
          "Esta cuenta es de tipo usuario. Selecciona 'Usuario' para iniciar sesión."
        )
      ).toBeInTheDocument()
      expect(mocks.login).not.toHaveBeenCalled()
    })

    it('traduce el error 400 de credenciales incorrectas', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { detail: 'Correo o contraseña incorrectos' } },
      })
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText(
          'El correo o la contraseña son incorrectos. Verifica tus datos.'
        )
      ).toBeInTheDocument()
    })

    it('traduce el error 403 según el tipo de cuenta', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 403, data: { detail: 'Esta cuenta es de empresa' } },
      })
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText(
          'Esta cuenta es de tipo empresa. Cambia a la pestaña de Empresa para iniciar sesión.'
        )
      ).toBeInTheDocument()
    })

    it('muestra un mensaje genérico ante un error 500', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 500, data: { detail: 'boom' } },
      })
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText('Error del servidor. Intenta de nuevo más tarde.')
      ).toBeInTheDocument()
    })

    it('avisa de un error de conexión cuando no hay respuesta HTTP', async () => {
      post.mockRejectedValue(new Error('network'))
      const user = userEvent.setup()
      renderLogin()

      await llenarCredenciales(user)
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

      expect(
        await screen.findByText(
          'Error de conexión. Verifica tu internet e intenta de nuevo.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('controles de la interfaz', () => {
    it('alterna la visibilidad de la contraseña', async () => {
      const user = userEvent.setup()
      renderLogin()

      const input = screen.getByPlaceholderText('••••••••')
      expect(input).toHaveAttribute('type', 'password')

      const boton = input.parentElement?.querySelector('button') as HTMLElement
      await user.click(boton)
      expect(input).toHaveAttribute('type', 'text')

      await user.click(boton)
      expect(input).toHaveAttribute('type', 'password')
    })

    it('vuelve al inicio con el botón Volver', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.click(screen.getByRole('button', { name: 'Volver al inicio' }))
      expect(mocks.navigate).toHaveBeenCalledWith('/')
    })
  })
})
