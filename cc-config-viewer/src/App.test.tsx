import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock the ErrorBoundary to test it separately
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('cc-config')).toBeInTheDocument()
  })

  it('displays the header with app title', () => {
    render(<App />)
    const header = screen.getByRole('heading', { name: 'cc-config' })
    expect(header).toBeInTheDocument()
  })

  it('displays welcome message', () => {
    render(<App />)
    expect(screen.getByText('Welcome to cc-config')).toBeInTheDocument()
  })

  it('displays subtitle', () => {
    render(<App />)
    expect(screen.getByText('Your Claude Code configuration viewer')).toBeInTheDocument()
  })

  it('shows tab navigation with User Level tab', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: /user level/i })).toBeInTheDocument()
  })

  it('shows tab navigation with Project tab (disabled)', () => {
    render(<App />)
    const projectTab = screen.getByRole('tab', { name: /project/i })
    expect(projectTab).toBeInTheDocument()
    expect(projectTab).toBeDisabled()
  })

  it('has User Level tab as default active tab', () => {
    render(<App />)
    const userTab = screen.getByRole('tab', { name: /user level/i })
    expect(userTab).toHaveAttribute('data-state', 'active')
  })
})

describe('App with ErrorBoundary', () => {
  // Test with real ErrorBoundary
  beforeEach(() => {
    vi.resetModules()
  })

  it('renders with ErrorBoundary wrapper', async () => {
    // Re-import to get actual implementation
    vi.doUnmock('@/components/ErrorBoundary')
    const { default: AppWithBoundary } = await import('./App')

    render(<AppWithBoundary />)
    expect(screen.getByText('cc-config')).toBeInTheDocument()
  })
})
