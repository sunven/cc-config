/**
 * Test suite for InheritanceSummary component (Story 3.5)
 *
 * Tests the inheritance statistics summary display component,
 * including counts, percentages, and quick stats visualization.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InheritanceSummary } from './InheritanceSummary'
import type { InheritanceStats } from '../../utils/statsCalculator'

// Mock the statsCalculator
vi.mock('../../utils/statsCalculator', () => ({
  calculateStats: vi.fn()
}))

describe('InheritanceSummary', () => {
  const mockStats: InheritanceStats = {
    totalCount: 10,
    inherited: { count: 6, percentage: 60 },
    projectSpecific: { count: 4, percentage: 40 },
    new: { count: 0, percentage: 0 },
    quickStats: {
      mostInheritedMcp: 'filesystem',
      mostAddedAgent: 'claude-code'
    }
  }

  it('should display total count of configurations', () => {
    render(<InheritanceSummary stats={mockStats} />)

    expect(screen.getByText(/Total: 10/)).toBeInTheDocument()
  })

  it('should display inherited configuration count and percentage', () => {
    render(<InheritanceSummary stats={mockStats} />)

    const inheritedSection = screen.getByText('Inherited').closest('[data-testid="stat-card"]')
    expect(inheritedSection).toBeInTheDocument()

    const inheritedCount = within(inheritedSection!).getByText('6')
    const inheritedPercentage = within(inheritedSection!).getByText('60%')
    expect(inheritedCount).toBeInTheDocument()
    expect(inheritedPercentage).toBeInTheDocument()
  })

  it('should display project-specific configuration count and percentage', () => {
    render(<InheritanceSummary stats={mockStats} />)

    const projectSection = screen.getByText('Project-specific').closest('[data-testid="stat-card"]')
    expect(projectSection).toBeInTheDocument()

    const projectCount = within(projectSection!).getByText('4')
    const projectPercentage = within(projectSection!).getByText('40%')
    expect(projectCount).toBeInTheDocument()
    expect(projectPercentage).toBeInTheDocument()
  })

  it('should display quick stats (Most inherited MCP)', () => {
    render(<InheritanceSummary stats={mockStats} />)

    expect(screen.getByText('filesystem')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Quick Stats/i })).toBeInTheDocument()
  })

  it('should display quick stats (Most added Agent)', () => {
    render(<InheritanceSummary stats={mockStats} />)

    expect(screen.getByText('claude-code')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Quick Stats/i })).toBeInTheDocument()
  })

  it('should handle undefined quick stats gracefully', () => {
    const statsWithoutQuickStats: InheritanceStats = {
      totalCount: 5,
      inherited: { count: 3, percentage: 60 },
      projectSpecific: { count: 2, percentage: 40 },
      new: { count: 0, percentage: 0 }
    }

    render(<InheritanceSummary stats={statsWithoutQuickStats} />)

    expect(screen.getByText(/Total: 5/)).toBeInTheDocument()
    expect(screen.queryByText(/Most inherited MCP:/)).not.toBeInTheDocument()
  })

  it('should display zero counts correctly', () => {
    const emptyStats: InheritanceStats = {
      totalCount: 0,
      inherited: { count: 0, percentage: 0 },
      projectSpecific: { count: 0, percentage: 0 },
      new: { count: 0, percentage: 0 }
    }

    render(<InheritanceSummary stats={emptyStats} />)

    expect(screen.getByText(/Total: 0/)).toBeInTheDocument()
  })

  it('should render with proper accessibility attributes', () => {
    render(<InheritanceSummary stats={mockStats} />)

    const summary = screen.getByRole('region', { name: /inheritance summary/i })
    expect(summary).toBeInTheDocument()
  })

  it('should apply correct color coding to stat cards', () => {
    render(<InheritanceSummary stats={mockStats} />)

    const inheritedCard = screen.getByText('Inherited').closest('[data-testid="stat-card"]')
    const projectCard = screen.getByText('Project-specific').closest('[data-testid="stat-card"]')

    // Check for color classes (blue for inherited, green for project-specific)
    expect(inheritedCard).toHaveClass('border-blue-500')
    expect(projectCard).toHaveClass('border-green-500')
  })

  it('should handle loading state', () => {
    render(<InheritanceSummary stats={null} isLoading={true} />)

    expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument()
  })

  it('should handle error state', () => {
    render(<InheritanceSummary stats={null} error="Failed to calculate statistics" />)

    expect(screen.getByText(/Failed to calculate statistics/)).toBeInTheDocument()
  })

  it('should render in compact mode when specified', () => {
    render(<InheritanceSummary stats={mockStats} compact={true} />)

    const summary = screen.getByRole('region')
    expect(summary).toHaveClass('text-sm')
  })

  it('should support dark theme', () => {
    render(<InheritanceSummary stats={mockStats} theme="dark" />)

    const summary = screen.getByRole('region')
    expect(summary).toHaveClass('dark')
  })

  it('should render summary in less than 100ms (AC9 requirement)', () => {
    const start = performance.now()
    render(<InheritanceSummary stats={mockStats} />)
    const duration = performance.now() - start

    // AC9 requirement: Calculate and render summary < 100ms
    expect(duration).toBeLessThan(100)
  })

  it('should render with large dataset quickly', () => {
    // Create a large stats object
    const largeStats: InheritanceStats = {
      totalCount: 1000,
      inherited: { count: 600, percentage: 60 },
      projectSpecific: { count: 400, percentage: 40 },
      new: { count: 0, percentage: 0 },
      quickStats: {
        mostInheritedMcp: 'filesystem',
        mostAddedAgent: 'claude-code'
      }
    }

    const start = performance.now()
    render(<InheritanceSummary stats={largeStats} />)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
  })
})