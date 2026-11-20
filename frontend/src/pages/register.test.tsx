import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

    it('registra una empresa con los datos y el certificado', async () => {
      post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      renderRegister()

      await user.click(screen.getByRole('button', { name: 'Empresa' }))
      await user.type(
        screen.getByPlaceholderText('Nombre de contacto'),
        'Ana',
      )
      await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@lubix.test')
      await user.type(screen.getByPlaceholderText('+57 300 123 4567'), '3001234567')
      const [password, confirmacion] = screen.getAllByPlaceholderText('••••••••')
      await user.type(password, 'Prueba123')
      await user.type(confirmacion, 'Prueba123')
      await user.type(screen.getByPlaceholderText('Lubix S.A.S'), 'Lubix SAS')
      await user.type(screen.getByPlaceholderText('900123456'), '900123456')
      await user.type(screen.getByPlaceholderText('7'), '1')
      await user.type(
        screen.getByPlaceholderText('Calle 123 #45-67'),
        'Calle 1 #2-3',
      )

      await user.click(
        screen.getByRole('button', { name: 'Registrar empresa' }),
      )

      expect(
        await screen.findByText(
          'Empresa registrada. Recibirás un correo de verificación.',
        ),
      ).toBeInTheDocument()

      const [url, body, config] = post.mock.calls[0]
      expect(url).toBe('/auth/register-company')
      expect(body).toBeInstanceOf(FormData)
      const formData = body as FormData
      expect(formData.get('companyName')).toBe('Lubix SAS')
      expect(formData.get('companyNIT')).toBe('900123456')
      expect(formData.get('companyNITDV')).toBe('1')
      expect(formData.get('companyAddress')).toBe('Calle 1 #2-3')
      expect(formData.get('certificate')).toBeInstanceOf(File)
      expect(config).toEqual({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    })
  })

  describe('validaciones adicionales', () => {
    it('rechaza un correo con formato inválido sin llamar a la API', async () => {
      const user = userEvent.setup()
      renderRegister()

      await user.type(screen.getByPlaceholderText('Su Nombre'), 'Ana')
      await user.type(screen.getByPlaceholderText('Su Apellido'), 'Pérez')
      await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@example')
      await user.type(
        screen.getByPlaceholderText('+57 300 123 4567'),
        '3001234567',
      )
      const [password, confirmacion] = screen.getAllByPlaceholderText('••••••••')
      await user.type(password, 'Prueba123')
      await user.type(confirmacion, 'Prueba123')
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(
        (await screen.findAllByText('Ingresa un correo electrónico válido')).length,
      ).toBeGreaterThan(0)
      expect(post).not.toHaveBeenCalled()
    })

    it('muestra los errores de validación que devuelve el backend por campo', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: {
          data: {
            detail: [
              { loc: ['body', 'email'], msg: 'El email ya está registrado' },
              { loc: ['body', 'tell'], msg: 'El teléfono no es válido' },
            ],
          },
        },
      })
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(
        await screen.findByText('El email ya está registrado'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('El teléfono no es válido'),
      ).toBeInTheDocument()
    })

    it('muestra un error genérico ante una falla desconocida', async () => {
      post.mockRejectedValue(new Error('boom'))
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(
        await screen.findByText('Error desconocido. Intenta de nuevo.'),
      ).toBeInTheDocument()
    })

    it('muestra el error por defecto del backend cuando no trae detalle', async () => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { data: {} },
      })
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(await screen.findByText('Error al registrar')).toBeInTheDocument()
    })
  })

  describe('controles de la interfaz', () => {
    it('alterna la visibilidad de contraseña y confirmación', async () => {
      const user = userEvent.setup()
      renderRegister()

      const [password, confirmacion] = screen.getAllByPlaceholderText('••••••••')
      expect(password).toHaveAttribute('type', 'password')
      expect(confirmacion).toHaveAttribute('type', 'password')

      const botonPassword = password.parentElement?.querySelector(
        'button',
      ) as HTMLElement
      const botonConfirmacion = confirmacion.parentElement?.querySelector(
        'button',
      ) as HTMLElement

      await user.click(botonPassword)
      await user.click(botonConfirmacion)

      expect(password).toHaveAttribute('type', 'text')
      expect(confirmacion).toHaveAttribute('type', 'text')
    })

    it('navega a la verificación de correo tras registrar un usuario', async () => {
      post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      renderRegister()

      await llenarUsuario(user)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      await screen.findByText('Usuario registrado correctamente')

      await waitFor(
        () => {
          expect(mocks.navigate).toHaveBeenCalledWith(
            '/register/VerifyEmailPage',
          )
        },
        { timeout: 3000 },
      )
    })
  })
})
