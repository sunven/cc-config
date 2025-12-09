import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickActions } from './QuickActions'

describe('QuickActions', () => {
  it('renders Open button when onOpenProject is provided', () => {
    const onOpenProject = vi.fn()
    render(<QuickActions onOpenProject={onOpenProject} />)

    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('does not render Open button when onOpenProject is not provided', () => {
    render(<QuickActions />)

    expect(screen.queryByText('Open')).not.toBeInTheDocument()
  })

  it('renders Compare button when onCompare is provided', () => {
    const onCompare = vi.fn()
    render(<QuickActions onCompare={onCompare} />)

    expect(screen.getByText('Compare')).toBeInTheDocument()
  })

  it('does not render Compare button when onCompare is not provided', () => {
    render(<QuickActions />)

    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
  })

  it('renders Details button when onViewDetails is provided', () => {
    const onViewDetails = vi.fn()
    render(<QuickActions onViewDetails={onViewDetails} />)

    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('does not render Details button when onViewDetails is not provided', () => {
    render(<QuickActions />)

    expect(screen.queryByText('Details')).not.toBeInTheDocument()
  })

  it('renders Refresh button when onRefresh is provided', () => {
    const onRefresh = vi.fn()
    render(<QuickActions onRefresh={onRefresh} />)

    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })

  it('does not render Refresh button when onRefresh is not provided', () => {
    render(<QuickActions />)

    expect(screen.queryByText('Refresh')).not.toBeInTheDocument()
  })

  it('calls onOpenProject when Open button is clicked', () => {
    const onOpenProject = vi.fn()
    render(<QuickActions onOpenProject={onOpenProject} />)

    fireEvent.click(screen.getByText('Open'))
    expect(onOpenProject).toHaveBeenCalledTimes(1)
  })

  it('calls onCompare when Compare button is clicked', () => {
    const onCompare = vi.fn()
    render(<QuickActions onCompare={onCompare} />)

    fireEvent.click(screen.getByText('Compare'))
    expect(onCompare).toHaveBeenCalledTimes(1)
  })

  it('calls onViewDetails when Details button is clicked', () => {
    const onViewDetails = vi.fn()
    render(<QuickActions onViewDetails={onViewDetails} />)

    fireEvent.click(screen.getByText('Details'))
    expect(onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('calls onRefresh when Refresh button is clicked', () => {
    const onRefresh = vi.fn()
    render(<QuickActions onRefresh={onRefresh} />)

    fireEvent.click(screen.getByText('Refresh'))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('disables all buttons when disabled prop is true', () => {
    const onOpenProject = vi.fn()
    const onCompare = vi.fn()
    const onViewDetails = vi.fn()
    const onRefresh = vi.fn()

    render(
      <QuickActions
        onOpenProject={onOpenProject}
        onCompare={onCompare}
        onViewDetails={onViewDetails}
        onRefresh={onRefresh}
        disabled={true}
      />
    )

    const openButton = screen.getByText('Open')
    const compareButton = screen.getByText('Compare')
    const detailsButton = screen.getByText('Details')
    const refreshButton = screen.getByText('Refresh')

    expect(openButton).toBeDisabled()
    expect(compareButton).toBeDisabled()
    expect(detailsButton).toBeDisabled()
    expect(refreshButton).toBeDisabled()
  })

  it('shows spinning icon when isRefreshing is true', () => {
    const onRefresh = vi.fn()
    const { container } = render(
      <QuickActions onRefresh={onRefresh} isRefreshing={true} />
    )

    const refreshButton = screen.getByText('Refresh')
    expect(refreshButton).toBeDisabled()

    // Check for spin animation class on the icon
    const icon = container.querySelector('.animate-spin')
    expect(icon).toBeInTheDocument()
  })

  it('does not show spinning icon when isRefreshing is false', () => {
    const onRefresh = vi.fn()
    const { container } = render(
      <QuickActions onRefresh={onRefresh} isRefreshing={false} />
    )

    // Should not have spin animation
    const icon = container.querySelector('.animate-spin')
    expect(icon).not.toBeInTheDocument()
  })

  it('disables only Refresh button when isRefreshing is true and disabled is false', () => {
    const onRefresh = vi.fn()
    const onCompare = vi.fn()

    render(
      <QuickActions
        onRefresh={onRefresh}
        onCompare={onCompare}
        isRefreshing={true}
      />
    )

    expect(screen.getByText('Refresh')).toBeDisabled()
    expect(screen.getByText('Compare')).toBeEnabled()
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <QuickActions onOpenProject={vi.fn()} className="custom-class" />
    )

    const actionsContainer = container.firstChild
    expect(actionsContainer).toHaveClass('custom-class')
  })

  it('renders all action buttons when all handlers are provided', () => {
    render(
      <QuickActions
        onOpenProject={vi.fn()}
        onCompare={vi.fn()}
        onViewDetails={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Compare')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })

  it('arranges buttons horizontally', () => {
    const { container } = render(
      <QuickActions
        onOpenProject={vi.fn()}
        onCompare={vi.fn()}
      />
    )

    // Check for flex container with space-x-2
    const actionsContainer = container.firstChild
    expect(actionsContainer).toHaveClass('flex', 'space-x-2')
  })
})