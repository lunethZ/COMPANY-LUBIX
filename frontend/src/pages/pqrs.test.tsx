import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PQRSPage from './pqrs'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('../api/axios', () => ({
  default: { get: mocks.get, post: mocks.post },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Ana', email: 'ana@example.com', role_id: 'user' },
  }),
}))

vi.mock('../components/navbar-auto', () => ({
  default: () => null,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mocks.navigate }
})

const ASUNTO = 'Problema con mi pedido'
const MENSAJE = 'El producto llegó con la caja dañada.'

function renderPqrs() {
  return render(
    <MemoryRouter initialEntries={['/pqrs']}>
      <PQRSPage />
    </MemoryRouter>
  )
}

async function abrirFormulario(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'PQRS' })
  await user.click(screen.getByRole('button', { name: 'Nueva solicitud' }))
}

async function escribirSolicitud(
  user: ReturnType<typeof userEvent.setup>,
  asunto: string,
  mensaje: string
) {
  await user.type(screen.getByPlaceholderText('Breve descripción del motivo'), asunto)
  await user.type(
    screen.getByPlaceholderText('Describe tu petición, queja, reclamo o sugerencia en detalle...'),
    mensaje
  )
}

describe('PQRS', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.navigate.mockReset()
    mocks.get.mockResolvedValue({ data: [] })
  })

  describe('se renderiza', () => {
    it('muestra el título y que no hay solicitudes cuando la lista está vacía', async () => {
      renderPqrs()

      expect(await screen.findByRole('heading', { name: 'PQRS' })).toBeInTheDocument()
      expect(screen.getByText('No tienes solicitudes aún')).toBeInTheDocument()
      expect(screen.getByText('Mis solicitudes (0)')).toBeInTheDocument()
    })

    it('muestra las solicitudes que devuelve la API', async () => {
      mocks.get.mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'queja',
            subject: 'Pedido dañado',
            description: 'La caja llegó rota',
            status: 'pending',
            user_role: 'user',
            created_at: '2026-10-01T10:00:00',
          },
        ],
      })
      renderPqrs()

      expect(await screen.findByText('Pedido dañado')).toBeInTheDocument()
      expect(screen.getByText('Mis solicitudes (1)')).toBeInTheDocument()
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })

    it('abre el formulario con el botón de enviar deshabilitado', async () => {
      const user = userEvent.setup()
      renderPqrs()

      await abrirFormulario(user)

      expect(screen.getByRole('heading', { name: 'Nueva solicitud PQRS' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Breve descripción del motivo')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Describe tu petición, queja, reclamo o sugerencia en detalle...')
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled()
    })
  })

  describe('error de validación visible', () => {
    it('no permite enviar si falta la descripción', async () => {
      const user = userEvent.setup()
      renderPqrs()

      await abrirFormulario(user)
      await user.type(screen.getByPlaceholderText('Breve descripción del motivo'), ASUNTO)

      expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled()
      expect(mocks.post).not.toHaveBeenCalled()
    })

    it('muestra el error 422 del servidor cuando el asunto no cumple la longitud', async () => {
      mocks.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            detail: [{ msg: 'Value error, El asunto debe tener entre 3 y 150 caracteres' }],
          },
        },
      })
      const user = userEvent.setup()
      renderPqrs()

      await abrirFormulario(user)
      await escribirSolicitud(user, 'ab', MENSAJE)
      await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

      expect(
        await screen.findByText(/El asunto debe tener entre 3 y 150 caracteres/)
      ).toBeInTheDocument()
    })
  })

  describe('el envío funciona', () => {
    it('envía la solicitud, muestra la confirmación y cierra el formulario', async () => {
      mocks.post.mockResolvedValue({ data: { message: 'PQRS enviada correctamente' } })
      const user = userEvent.setup()
      renderPqrs()

      await abrirFormulario(user)
      await escribirSolicitud(user, ASUNTO, MENSAJE)
      await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

      expect(await screen.findByText(/enviada correctamente/)).toBeInTheDocument()
      expect(mocks.post).toHaveBeenCalledWith('/pqrs', {
        type: 'queja',
        subject: ASUNTO,
        description: MENSAJE,
      })
      expect(
        screen.queryByRole('heading', { name: 'Nueva solicitud PQRS' })
      ).not.toBeInTheDocument()
    })

    it('vuelve a cargar la lista después de enviar', async () => {
      mocks.post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      renderPqrs()

      await abrirFormulario(user)
      await escribirSolicitud(user, ASUNTO, MENSAJE)
      await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
      await screen.findByText(/enviada correctamente/)

      expect(mocks.get).toHaveBeenCalledTimes(2)
    })
  })
})
