/**
 * Test suite for InheritanceChart component (Story 3.5)
 *
 * Tests the chart visualization for inheritance distribution using Nivo.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { InheritanceChart } from './InheritanceChart'
import type { InheritanceStats } from '../../utils/statsCalculator'

// Mock Nivo components
vi.mock('@nivo/pie', () => ({
  ResponsivePie: ({ data }: any) => (
    <div data-testid="nivo-pie-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )
}))

vi.mock('@nivo/bar', () => ({
  ResponsiveBar: ({ data }: any) => (
    <div data-testid="nivo-bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )
}))

describe('InheritanceChart', () => {
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

  it('should render pie chart by default', () => {
    render(<InheritanceChart stats={mockStats} />)

    expect(screen.getByTestId('nivo-pie-chart')).toBeInTheDocument()
  })

  it('should render bar chart when chartType="bar"', () => {
    render(<InheritanceChart stats={mockStats} chartType="bar" />)

    expect(screen.getByTestId('nivo-bar-chart')).toBeInTheDocument()
  })

  it('should transform stats to pie chart data format', () => {
    render(<InheritanceChart stats={mockStats} />)

    const chartData = screen.getByTestId('chart-data')
    const data = JSON.parse(chartData.textContent || '[]')

    expect(data).toHaveLength(2)
    expect(data[0]).toEqual({
      id: 'Inherited',
      label: 'Inherited',
      value: 6,
      color: '#3B82F6' // Blue
    })
    expect(data[1]).toEqual({
      id: 'Project-specific',
      label: 'Project-specific',
      value: 4,
      color: '#10B981' // Green
    })
  })

  it('should transform stats to bar chart data format', () => {
    render(<InheritanceChart stats={mockStats} chartType="bar" />)

    const chartData = screen.getByTestId('chart-data')
    const data = JSON.parse(chartData.textContent || '[]')

    expect(data).toHaveLength(2)
    expect(data[0]).toEqual({
      category: 'Inherited',
      count: 6,
      percentage: 60
    })
    expect(data[1]).toEqual({
      category: 'Project-specific',
      count: 4,
      percentage: 40
    })
  })

  it('should apply inherited color scheme for pie chart', () => {
    render(<InheritanceChart stats={mockStats} />)

    const chartData = screen.getByTestId('chart-data')
    const data = JSON.parse(chartData.textContent || '[]')

    // Check that colors match the established color palette
    expect(data[0].color).toBe('#3B82F6') // Blue for inherited
    expect(data[1].color).toBe('#10B981') // Green for project-specific
  })

  it('should handle zero values gracefully', () => {
    const emptyStats: InheritanceStats = {
      totalCount: 0,
      inherited: { count: 0, percentage: 0 },
      projectSpecific: { count: 0, percentage: 0 },
      new: { count: 0, percentage: 0 }
    }

    render(<InheritanceChart stats={emptyStats} />)

    const chartData = screen.getByTestId('chart-data')
    const data = JSON.parse(chartData.textContent || '[]')

    // Should still render with zero values
    expect(data).toHaveLength(2)
    expect(data[0].value).toBe(0)
    expect(data[1].value).toBe(0)
  })

  it('should handle missing stats gracefully', () => {
    render(<InheritanceChart stats={null} />)

    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('should render with proper height', () => {
    render(<InheritanceChart stats={mockStats} />)

    const chartContainer = screen.getByTestId('chart-container')
    expect(chartContainer).toHaveClass('h-64')
  })

  it('should support custom height', () => {
    render(<InheritanceChart stats={mockStats} height={400} />)

    const chartContainer = screen.getByTestId('chart-container')
    expect(chartContainer).toHaveClass('h-96')
  })

  it('should apply theme classes for dark mode', () => {
    render(<InheritanceChart stats={mockStats} theme="dark" />)

    const chartContainer = screen.getByTestId('chart-container')
    expect(chartContainer).toHaveClass('dark')
  })

  it('should animate when enabled', () => {
    render(<InheritanceChart stats={mockStats} animate={true} />)

    const chart = screen.getByTestId('nivo-pie-chart')
    expect(chart).toBeInTheDocument()
  })

  it('should render legend when showLegend is true', () => {
    render(<InheritanceChart stats={mockStats} showLegend={true} />)

    // Legend is rendered as part of the Nivo chart (SVG)
    // Just verify the chart renders with legend enabled
    expect(screen.getByTestId('nivo-pie-chart')).toBeInTheDocument()
  })

  it('should handle only inherited configs (100%)', () => {
    const allInheritedStats: InheritanceStats = {
      totalCount: 5,
      inherited: { count: 5, percentage: 100 },
      projectSpecific: { count: 0, percentage: 0 },
      new: { count: 0, percentage: 0 }
    }

    render(<InheritanceChart stats={allInheritedStats} />)

    const chartData = screen.getByTestId('chart-data')
    const data = JSON.parse(chartData.textContent || '[]')

    // Should still render both categories, one with 0 value
    expect(data).toHaveLength(2)
    expect(data[0].value).toBe(5)
    expect(data[0].id).toBe('Inherited')
    expect(data[1].value).toBe(0)
    expect(data[1].id).toBe('Project-specific')
  })

  it('should handle only project-specific configs (100%)', () => {
    const allProjectStats: InheritanceStats = {
      totalCount: 3,
      inherited: { count: 0, percentage: 0 },
      projectSpecific: { count: 3, percentage: 100 },
      new: { count: 0, percentage: 0 }
    }

    render(<InheritanceChart stats={allProjectStats} />)

    const chartData = screen.getByTestId('chart-data')
    const data = JSON.parse(chartData.textContent || '[]')

    // Should still render both categories, one with 0 value
    expect(data).toHaveLength(2)
    expect(data[0].value).toBe(0)
    expect(data[0].id).toBe('Inherited')
    expect(data[1].value).toBe(3)
    expect(data[1].id).toBe('Project-specific')
  })

  it('should render pie chart in less than 100ms (AC9 requirement)', () => {
    const start = performance.now()
    render(<InheritanceChart stats={mockStats} />)
    const duration = performance.now() - start

    // AC9 requirement: Calculate and render summary < 100ms
    expect(duration).toBeLessThan(100)
  })

  it('should render bar chart in less than 100ms', () => {
    const start = performance.now()
    render(<InheritanceChart stats={mockStats} chartType="bar" />)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
  })

  it('should render with large dataset and animations quickly', () => {
    const largeStats: InheritanceStats = {
      totalCount: 1000,
      inherited: { count: 700, percentage: 70 },
      projectSpecific: { count: 300, percentage: 30 },
      new: { count: 0, percentage: 0 },
      quickStats: {
        mostInheritedMcp: 'filesystem',
        mostAddedAgent: 'claude-code'
      }
    }

    const start = performance.now()
    render(<InheritanceChart stats={largeStats} animate={true} showLegend={true} />)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
  })
})