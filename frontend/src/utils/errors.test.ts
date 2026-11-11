import { describe, expect, it } from 'vitest'
import { errorDetailMessage } from './errors'

const fallback = 'Ocurrió un error'

describe('errorDetailMessage', () => {
  it('devuelve el mensaje por defecto cuando el error no es un objeto', () => {
    expect(errorDetailMessage('algo falló', fallback)).toBe(fallback)
    expect(errorDetailMessage(null, fallback)).toBe(fallback)
    expect(errorDetailMessage(undefined, fallback)).toBe(fallback)
  })

  it('devuelve el mensaje por defecto cuando no hay response.data', () => {
    expect(errorDetailMessage({}, fallback)).toBe(fallback)
    expect(errorDetailMessage({ response: { data: null } }, fallback)).toBe(fallback)
  })

  it('devuelve el detail cuando es un texto', () => {
    const error = { response: { data: { detail: 'Token inválido' } } }
    expect(errorDetailMessage(error, fallback)).toBe('Token inválido')
  })

  it('usa el mensaje por defecto cuando el detail es un texto vacío', () => {
    const error = { response: { data: { detail: '   ' } } }
    expect(errorDetailMessage(error, fallback)).toBe(fallback)
  })

  it('une los mensajes cuando el detail es una lista de errores de validación', () => {
    const error = {
      response: {
        data: { detail: [{ msg: 'Campo requerido' }, { msg: 'Longitud mínima de 3' }] }
      }
    }
    expect(errorDetailMessage(error, fallback)).toBe('Campo requerido · Longitud mínima de 3')
  })

  it('convierte a texto los elementos de la lista que no tienen msg', () => {
    const error = { response: { data: { detail: [{ msg: 'Campo requerido' }, 'otro error'] } } }
    expect(errorDetailMessage(error, fallback)).toBe('Campo requerido · otro error')
  })
})
