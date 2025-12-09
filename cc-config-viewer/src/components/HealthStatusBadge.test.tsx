import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HealthStatusBadge } from './HealthStatusBadge'

describe('HealthStatusBadge', () => {
  it('renders Good status with correct styling and icon', () => {
    render(<HealthStatusBadge status="good" />)

    const badge = screen.getByText('Good')
    expect(badge).toBeInTheDocument()

    const badgeElement = badge.closest('div[role="status"]')
    expect(badgeElement).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('renders Warning status with correct styling and icon', () => {
    render(<HealthStatusBadge status="warning" />)

    const badge = screen.getByText('Warning')
    expect(badge).toBeInTheDocument()

    const badgeElement = badge.closest('div[role="status"]')
    expect(badgeElement).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('renders Error status with correct styling and icon', () => {
    render(<HealthStatusBadge status="error" />)

    const badge = screen.getByText('Error')
    expect(badge).toBeInTheDocument()

    const badgeElement = badge.closest('div[role="status"]')
    expect(badgeElement).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('displays appropriate icon for Good status', () => {
    const { container } = render(<HealthStatusBadge status="good" />)

    // Check for the CheckCircle icon (should be present for good status)
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('displays appropriate icon for Warning status', () => {
    const { container } = render(<HealthStatusBadge status="warning" />)

    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('displays appropriate icon for Error status', () => {
    const { container } = render(<HealthStatusBadge status="error" />)

    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <HealthStatusBadge status="good" className="custom-class" />
    )

    const badgeElement = container.querySelector('div')
    expect(badgeElement).toHaveClass('custom-class')
  })

  it('combines custom className with default styling', () => {
    const { container } = render(
      <HealthStatusBadge status="good" className="custom-class" />
    )

    const badgeElement = container.querySelector('div')
    expect(badgeElement).toHaveClass('custom-class', 'bg-green-100', 'text-green-800')
  })
})