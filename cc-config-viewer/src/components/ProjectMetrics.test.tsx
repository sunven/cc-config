import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectMetrics } from './ProjectMetrics'
import type { ProjectHealth } from '../types/health'

describe('ProjectMetrics', () => {
  const mockHealth: ProjectHealth = {
    projectId: 'project-1',
    status: 'good',
    score: 90,
    metrics: {
      totalCapabilities: 10,
      validConfigs: 8,
      invalidConfigs: 2,
      warnings: 3,
      errors: 1,
      lastChecked: '2025-01-01T00:00:00Z',
      lastAccessed: '2025-01-01T00:00:00Z',
    },
    issues: [],
    recommendations: [],
  }

  it('renders all metric labels', () => {
    render(<ProjectMetrics health={mockHealth} />)

    expect(screen.getByText('Total Capabilities')).toBeInTheDocument()
    expect(screen.getByText('Valid Configs')).toBeInTheDocument()
    expect(screen.getByText('Invalid Configs')).toBeInTheDocument()
    expect(screen.getByText('Warnings')).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
  })

  it('displays correct metric values', () => {
    render(<ProjectMetrics health={mockHealth} />)

    expect(screen.getByText('10')).toBeInTheDocument() // Total Capabilities
    expect(screen.getByText('8')).toBeInTheDocument() // Valid Configs
    expect(screen.getByText('2')).toBeInTheDocument() // Invalid Configs
    expect(screen.getByText('3')).toBeInTheDocument() // Warnings
    expect(screen.getByText('1')).toBeInTheDocument() // Errors
  })

  it('shows metric values with correct styling', () => {
    const { container } = render(<ProjectMetrics health={mockHealth} />)

    // Check that metrics are rendered with proper styling
    const metrics = container.querySelectorAll('.text-lg.font-medium')
    expect(metrics).toHaveLength(5)
  })

  it('formats and displays last checked timestamp', () => {
    render(<ProjectMetrics health={mockHealth} />)

    expect(screen.getByText('Last Checked:')).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument() // Should show the year
  })

  it('displays last accessed timestamp when available', () => {
    render(<ProjectMetrics health={mockHealth} />)

    expect(screen.getByText('Last Accessed:')).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it('does not show last accessed when not provided', () => {
    const healthWithoutAccessed = {
      ...mockHealth,
      metrics: {
        ...mockHealth.metrics,
        lastAccessed: undefined,
      },
    }

    render(<ProjectMetrics health={healthWithoutAccessed} />)

    expect(screen.queryByText('Last Accessed:')).not.toBeInTheDocument()
  })

  it('applies correct color styling to different metric types', () => {
    const { container } = render(<ProjectMetrics health={mockHealth} />)

    // Check for green color on valid configs
    const validConfigElement = Array.from(container.querySelectorAll('.text-green-600'))
    expect(validConfigElement.length).toBeGreaterThan(0)

    // Check for red color on errors
    const errorElement = Array.from(container.querySelectorAll('.text-red-600'))
    expect(errorElement.length).toBeGreaterThan(0)

    // Check for yellow color on warnings
    const warningElement = Array.from(container.querySelectorAll('.text-yellow-600'))
    expect(warningElement.length).toBeGreaterThan(0)
  })

  it('renders icons for each metric', () => {
    const { container } = render(<ProjectMetrics health={mockHealth} />)

    // Check for SVG icons
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(5) // One for each metric
  })

  it('displays health metrics in a grid layout', () => {
    const { container } = render(<ProjectMetrics health={mockHealth} />)

    // Check that metrics are in a grid
    const grid = container.querySelector('.grid.grid-cols-2')
    expect(grid).toBeInTheDocument()
  })

  it('renders timestamps section at the bottom', () => {
    const { container } = render(<ProjectMetrics health={mockHealth} />)

    // Check for border separator
    const border = container.querySelector('.border-t')
    expect(border).toBeInTheDocument()
  })
})