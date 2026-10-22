import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import api from '../api/axios'
import Register from './register'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mocks.navigate }
})

const post = vi.mocked(api.post)

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )
}

async function llenarUsuario(
  user: ReturnType<typeof userEvent.setup>,
  password = 'Prueba123',
  confirmacion = 'Prueba123'
) {
  await user.type(screen.getByPlaceholderText('Su Nombre'), 'Ana')
  await user.type(screen.getByPlaceholderText('Su Apellido'), 'Pérez')
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example.com')
  await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567')
  const [campoPassword, campoConfirmacion] = screen.getAllByPlaceholderText('••••••••')
  await user.type(campoPassword, password)
  await user.type(campoConfirmacion, confirmacion)
}

describe('Register', () => {
  beforeEach(() => {
    post.mockReset()
    mocks.navigate.mockReset()
  })

  describe('se renderiza', () => {
    it('muestra los campos del registro de usuario y el botón deshabilitado', () => {
      renderRegister()

      expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument()
      expect(screen.getByText('Crea tu cuenta gratis')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Su Nombre')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Su Apellido')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+57 300 123 4567')).toBeInTheDocument()
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
      expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute('href', '/login')
    })

    it('muestra los campos de la empresa al elegir Empresa', async () => {
      const user = userEvent.setup()
      renderRegister()

      await user.click(screen.getByRole('button', { name: 'Empresa' }))

      expect(screen.getByText('Registra tu empresa')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Lubix S.A.S')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('900123456')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrar empresa' })).toBeInTheDocument()
    })
  })

  describe('error de validación visible', () => {
    it('avisa cuando las contraseñas no coinciden y no llama a la API', async () => {
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user, 'Prueba123', 'Prueba124')
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
      expect(post).not.toHaveBeenCalled()
    })

    it('muestra los requisitos y mantiene el botón deshabilitado con una contraseña débil', async () => {
      const user = userEvent.setup()
      renderRegister()

      const [campoPassword] = screen.getAllByPlaceholderText('••••••••')
      await user.type(campoPassword, 'abc')

      expect(screen.getByText('8+ chars')).toBeInTheDocument()
      expect(screen.getByText('Mayús')).toBeInTheDocument()
      expect(screen.getByText('Número')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
    })

    it('muestra el mensaje del servidor cuando el registro es rechazado', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { detail: 'El correo ya está registrado' } },
      })
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
    })
  })

  describe('el envío funciona', () => {
    it('registra al usuario con los datos escritos', async () => {
      post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(await screen.findByText('Usuario registrado correctamente')).toBeInTheDocument()
      expect(post).toHaveBeenCalledWith('/auth/register-user', {
        fullName: 'Ana Pérez',
        email: 'ana@example.com',
        tell: '3001234567',
        password: 'Prueba123',
      })
    })

    it('limpia el formulario después de registrar', async () => {
      post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      await screen.findByText('Usuario registrado correctamente')

      expect(screen.getByPlaceholderText('Su Nombre')).toHaveValue('')
      expect(screen.getByPlaceholderText('tu@email.com')).toHaveValue('')
    })
  })
})
