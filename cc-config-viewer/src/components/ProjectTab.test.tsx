import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectTab } from './ProjectTab'

describe('ProjectTab', () => {
  it('renders with label', () => {
    const mockClick = vi.fn()
    render(<ProjectTab label="User Level" isActive={false} onClick={mockClick} />)

    expect(screen.getByRole('button', { name: 'User Level' })).toBeInTheDocument()
  })

  it('applies active styling when isActive is true', () => {
    const mockClick = vi.fn()
    render(<ProjectTab label="Project Level" isActive={true} onClick={mockClick} />)

    const button = screen.getByRole('button', { name: 'Project Level' })
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies inactive styling when isActive is false', () => {
    const mockClick = vi.fn()
    render(<ProjectTab label="Local Level" isActive={false} onClick={mockClick} />)

    const button = screen.getByRole('button', { name: 'Local Level' })
    expect(button).toHaveClass('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300')
  })

  it('calls onClick when clicked', () => {
    const mockClick = vi.fn()
    render(<ProjectTab label="Test Tab" isActive={false} onClick={mockClick} />)

    const button = screen.getByRole('button', { name: 'Test Tab' })
    fireEvent.click(button)

    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('renders with different labels', () => {
    const mockClick = vi.fn()

    const { rerender } = render(
      <ProjectTab label="Tab 1" isActive={false} onClick={mockClick} />
    )
    expect(screen.getByRole('button', { name: 'Tab 1' })).toBeInTheDocument()

    rerender(<ProjectTab label="Tab 2" isActive={false} onClick={mockClick} />)
    expect(screen.getByRole('button', { name: 'Tab 2' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tab 1' })).not.toBeInTheDocument()
  })
})
