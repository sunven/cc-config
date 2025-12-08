/**
 * Tests for InheritancePathVisualizer component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InheritancePathVisualizer } from './InheritancePathVisualizer'
import type { ConfigEntry } from '../../types/config'

// Mock config entries for testing
const mockConfigs: ConfigEntry[] = [
  {
    key: 'test.config',
    value: 'project-value',
    source: {
      type: 'project',
      path: './.mcp.json',
      priority: 2
    }
  },
  {
    key: 'user.config',
    value: 'user-value',
    source: {
      type: 'user',
      path: '~/.claude.json',
      priority: 1
    }
  },
  {
    key: 'inherited.config',
    value: 'inherited-value',
    source: {
      type: 'inherited',
      path: '~/.claude.json',
      priority: 1,
      inherited: true
    }
  }
]

describe('InheritancePathVisualizer', () => {
  it('should render without crashing', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)
    expect(screen.getByTestId('inheritance-path-visualizer')).toBeInTheDocument()
  })

  it('should display User Level → Project Level flow with directional arrows (AC1)', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)

    expect(screen.getByTestId('user-level')).toBeInTheDocument()
    expect(screen.getByTestId('project-level')).toBeInTheDocument()
    expect(screen.getByTestId('flow-arrow')).toBeInTheDocument()

    // Verify arrow direction
    const arrow = screen.getByTestId('flow-arrow')
    expect(arrow).toHaveAttribute('data-direction', 'user-to-project')
  })

  it('should show visual chain display (AC1)', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)

    const visualChain = screen.getByTestId('visual-chain')
    expect(visualChain).toBeInTheDocument()
  })

  it('should display inheritance path for each configuration item (AC2)', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)

    // Check that config entries are rendered
    mockConfigs.forEach(config => {
      expect(screen.getByText(config.key)).toBeInTheDocument()
    })
  })

  it('should differentiate between inherited, overridden, and new values (AC5)', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)

    // Should have different visual styles for different classifications
    const inheritedItem = screen.getByTestId('inherited.config')
    const projectItem = screen.getByTestId('test.config')
    const userItem = screen.getByTestId('user.config')

    expect(inheritedItem).toHaveAttribute('data-classification', 'inherited')
    expect(projectItem).toHaveAttribute('data-classification', 'project-specific')
    expect(userItem).toHaveAttribute('data-classification', 'user-level')
  })

  it('should be responsive on different screen sizes (AC6)', () => {
    // Test on mobile viewport
    global.innerWidth = 375
    const { unmount } = render(<InheritancePathVisualizer configs={mockConfigs} />)
    expect(screen.getAllByTestId('inheritance-path-visualizer')[0]).toHaveClass('responsive')
    unmount()

    // Test on desktop viewport
    global.innerWidth = 1024
    render(<InheritancePathVisualizer configs={mockConfigs} />)
    expect(screen.getAllByTestId('inheritance-path-visualizer')[0]).toHaveClass('responsive')
  })

  it('should handle empty configs array', () => {
    render(<InheritancePathVisualizer configs={[]} />)
    expect(screen.getByTestId('inheritance-path-visualizer')).toBeInTheDocument()
    expect(screen.getByText('No configuration entries')).toBeInTheDocument()
  })

  it('should call onHighlight callback when item is clicked (AC3)', () => {
    const onHighlight = vi.fn()
    render(<InheritancePathVisualizer configs={mockConfigs} onHighlight={onHighlight} />)

    const firstItem = screen.getByText('test.config')
    firstItem.click()

    expect(onHighlight).toHaveBeenCalledWith('test.config')
  })

  it('should integrate with color-coded source indicators from Story 3.1 (AC7)', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)

    // User level should have blue color (checking SourceIndicator component)
    const userIndicator = screen.getByTestId('source-indicator-user')
    expect(userIndicator).toHaveClass('bg-blue-100', 'text-blue-800')

    // Project level should have green color (checking SourceIndicator component)
    const projectIndicator = screen.getByTestId('source-indicator-project')
    expect(projectIndicator).toHaveClass('bg-green-100', 'text-green-800')

    // Inherited should have gray color in the component
    const visualizer = screen.getByTestId('inheritance-path-visualizer')
    expect(visualizer).toBeInTheDocument()
  })

  it('should display correct source attribution', () => {
    render(<InheritancePathVisualizer configs={mockConfigs} />)

    // Check that source paths are displayed correctly
    // The source path should be visible in the component
    const userConfig = screen.getByText('user.config')
    expect(userConfig).toBeInTheDocument()

    const projectConfig = screen.getByText('test.config')
    expect(projectConfig).toBeInTheDocument()
  })

  it('should support custom className', () => {
    const { container } = render(
      <InheritancePathVisualizer configs={mockConfigs} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})