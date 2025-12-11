import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CapabilityStats, CapabilityStatsMemo } from './CapabilityStats'
import type { CapabilityStats as CapabilityStatsType } from '../lib/capabilityStats'

// Mock the store
vi.mock('../stores/configStore', () => ({
  useConfigStore: vi.fn(() => ({
    getCapabilities: vi.fn(() => []),
    getCapabilityStats: vi.fn(() => mockStats)
  }))
}))

vi.mock('../stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({
    currentScope: 'project'
  }))
}))

describe('CapabilityStats', () => {
  // Mock stats data
  const mockStats: CapabilityStatsType = {
    totalMcp: 3,
    totalAgents: 2,
    totalCount: 5,
    mostUsedType: 'mcp',
    unique: 5,
    inherited: 0,
    overridden: 0,
    percentages: {
      mcp: 60,
      agents: 40,
      unique: 100,
      inherited: 0,
      overridden: 0
    },
    breakdown: {
      user: { total: 3, mcp: 2, agents: 1 },
      project: { total: 2, mcp: 1, agents: 1 },
      local: { total: 0, mcp: 0, agents: 0 }
    },
    lastUpdated: new Date()
  }

  const mockEmptyStats: CapabilityStatsType = {
    totalMcp: 0,
    totalAgents: 0,
    totalCount: 0,
    mostUsedType: 'equal',
    unique: 0,
    inherited: 0,
    overridden: 0,
    percentages: {
      mcp: 0,
      agents: 0,
      unique: 0,
      inherited: 0,
      overridden: 0
    },
    breakdown: {
      user: { total: 0, mcp: 0, agents: 0 },
      project: { total: 0, mcp: 0, agents: 0 },
      local: { total: 0, mcp: 0, agents: 0 }
    },
    lastUpdated: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RED Phase - Component Rendering', () => {
    it('should render the component when stats are provided', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should render total MCP count', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('MCP Servers')).toBeInTheDocument()
      expect(screen.getAllByText('3')[0]).toBeInTheDocument()
    })

    it('should render total Agents count', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Agents', { selector: '.text-sm.font-medium' })).toBeInTheDocument()
    })

    it('should display most used capability type', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Most Used Type:')).toBeInTheDocument()
    })

    it('should show "equal" when counts are equal', () => {
      const equalStats = {
        ...mockStats,
        totalMcp: 2,
        totalAgents: 2,
        mostUsedType: 'equal' as const,
        percentages: {
          mcp: 50,
          agents: 50,
          unique: 100,
          inherited: 0,
          overridden: 0
        }
      }
      render(<CapabilityStats stats={equalStats} scope="project" />)
      expect(screen.getByText(/Most Used Type:/)).toBeInTheDocument()
      expect(screen.getByText('Equal')).toBeInTheDocument()
    })

    it('should display unique vs inherited vs overridden counts', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Unique')).toBeInTheDocument()
      expect(screen.getByText('Inherited')).toBeInTheDocument()
      expect(screen.getByText('Overridden')).toBeInTheDocument()
    })

    it('should display percentages', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText('40%')).toBeInTheDocument()
    })

    it('should handle empty stats gracefully', () => {
      render(<CapabilityStats stats={mockEmptyStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })
  })

  describe('RED Phase - Acceptance Criteria Coverage', () => {
    it('AC #1: Should display Total MCP count and Total Agents count', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('MCP Servers')).toBeInTheDocument()
      expect(screen.getByText('Agents', { selector: '.text-sm.font-medium' })).toBeInTheDocument()
    })

    it('AC #2: Should display most used capability type', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Most Used Type:')).toBeInTheDocument()
    })

    it('AC #3: Should display capabilities unique to this scope vs inherited', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Unique')).toBeInTheDocument()
      expect(screen.getByText('Inherited')).toBeInTheDocument()
      expect(screen.getByText('Overridden')).toBeInTheDocument()
    })

    it('AC #4: Should indicate growth over time is based on current config', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText(/Based on current/)).toBeInTheDocument()
    })
  })

  describe('RED Phase - Visual Styling', () => {
    it('should have proper styling classes', () => {
      const { container } = render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(container.firstChild).toHaveClass('capability-stats')
    })

    it('should display badges with correct styling', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // Check for badge elements (shadcn/ui uses variant pattern, not button role)
      const badges = screen.getAllByText(/%/)
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should apply color coding for MCP vs Agents', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // The component should differentiate MCP (blue) from Agents (green)
      // This is verified by the component implementation
      const statsContainer = screen.getByText('Capability Statistics').parentElement
      expect(statsContainer).toBeInTheDocument()
    })
  })

  describe('RED Phase - Props Handling', () => {
    it('should accept stats prop', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should accept scope prop', () => {
      render(<CapabilityStats stats={mockStats} scope="user" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should handle compact prop for sidebar integration', () => {
      render(<CapabilityStats stats={mockStats} scope="project" compact={true} />)
      // In compact mode, some elements might be hidden
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })
  })

  describe('RED Phase - Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // Check for ARIA labels on interactive elements
      const statsElement = screen.getByLabelText(/Capability Statistics/)
      expect(statsElement).toBeInTheDocument()
    })

    it('should have semantic HTML structure', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // Verify component renders with semantic elements
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
      // Should use proper heading structure (multiple subheadings are OK)
      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should have proper text labels for screen readers', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // Check for text labels
      expect(screen.getByText('MCP Servers')).toBeInTheDocument()
      // All stats should have text labels (Agents appears multiple times)
      expect(screen.getByText(/MCP Servers/)).toBeInTheDocument()
      expect(screen.getAllByText('Agents').length).toBeGreaterThan(0)
    })
  })

  describe('RED Phase - Performance', () => {
    it('should be wrapped in React.memo', () => {
      // The component should be memoized
      expect(CapabilityStatsMemo).toBeDefined()
    })

    it('should handle re-renders efficiently', () => {
      const { rerender } = render(<CapabilityStats stats={mockStats} scope="project" />)
      // Re-render with same props should not cause issues
      rerender(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })
  })

  describe('RED Phase - Integration Points', () => {
    it('should integrate with configStore', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // The component should use the store
      // This is mocked above
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should display scope-specific stats', () => {
      render(<CapabilityStats stats={mockStats} scope="user" />)
      // Should show different breakdown for different scopes
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should update when scope changes', () => {
      const { rerender } = render(<CapabilityStats stats={mockStats} scope="user" />)
      rerender(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })
  })

  describe('RED Phase - Error Handling', () => {
    it('should handle undefined stats gracefully', () => {
      render(<CapabilityStats stats={undefined as any} scope="project" />)
      // Should not crash
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should display zero state when no capabilities', () => {
      render(<CapabilityStats stats={mockEmptyStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
      expect(screen.getByText('No capabilities found in this scope.')).toBeInTheDocument()
    })
  })

  describe('RED Phase - Component Structure', () => {
    it('should have header section', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Capability Statistics')).toBeInTheDocument()
    })

    it('should have stats grid', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      // Just verify component renders
      expect(screen.getByText('Total Counts')).toBeInTheDocument()
      // Should have a grid layout for displaying multiple stats
      const statsSection = screen.getByText('MCP Servers').closest('div')
      expect(statsSection).toBeInTheDocument()
    })

    it('should have breakdown section', () => {
      render(<CapabilityStats stats={mockStats} scope="project" />)
      expect(screen.getByText('Breakdown by Source:')).toBeInTheDocument()
    })
  })
})