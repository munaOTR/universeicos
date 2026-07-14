import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders as a child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: /link/i })).toBeInTheDocument()
  })
})
