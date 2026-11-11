import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from './footer'

describe('Footer', () => {
  it('muestra el nombre de la marca', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Lubix' })).toBeInTheDocument()
  })

  it('enlaza "Comprar" a la búsqueda de productos', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Comprar' })).toHaveAttribute('href', '/buscar')
  })
})
