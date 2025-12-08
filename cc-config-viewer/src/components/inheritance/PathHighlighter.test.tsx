/**
 * Tests for PathHighlighter component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PathHighlighter } from './PathHighlighter'
import type { ConfigEntry } from '../../types/config'

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
  }
]

describe('PathHighlighter', () => {
  it('should render without crashing', () => {
    render(<PathHighlighter configKey={null} configs={mockConfigs} />)
    expect(screen.getByTestId('path-highlighter')).toBeInTheDocument()
  })

  it('should highlight a specific config when configKey is provided (AC3)', () => {
    render(<PathHighlighter configKey="test.config" configs={mockConfigs} />)

    const highlightedItem = screen.getByTestId('highlight-test.config')
    expect(highlightedItem).toHaveAttribute('data-highlighted', 'true')
    expect(highlightedItem).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('should clear highlight when configKey is null', () => {
    render(<PathHighlighter configKey={null} configs={mockConfigs} />)

    const container = screen.getByTestId('path-highlighter')
    expect(container).not.toHaveClass('has-highlight')
  })

  it('should emphasize inheritance paths (AC3)', () => {
    render(<PathHighlighter configKey="test.config" configs={mockConfigs} />)

    const highlightedItem = screen.getByTestId('highlight-test.config')
    expect(highlightedItem).toHaveClass('path-emphasis')
  })

  it('should highlight source values and propagation (Subtask 3.2)', () => {
    render(<PathHighlighter configKey="test.config" configs={mockConfigs} />)

    // Should show both source and propagated values
    const highlightedItem = screen.getByTestId('highlight-test.config')
    expect(highlightedItem).toBeInTheDocument()
  })

  it('should support multiple paths simultaneously (Subtask 3.3)', () => {
    render(
      <PathHighlighter
        configKey="test.config"
        configs={[
          ...mockConfigs,
          {
            key: 'another.config',
            value: 'another-value',
            source: {
              type: 'project',
              path: './.mcp.json',
              priority: 2
            }
          }
        ]}
      />
    )

    // Should handle multiple configs correctly
    expect(screen.getByTestId('highlight-test.config')).toBeInTheDocument()
    expect(screen.getByTestId('highlight-another.config')).toBeInTheDocument()
  })

  it('should use smooth animations for path highlighting (300ms)', () => {
    render(<PathHighlighter configKey="test.config" configs={mockConfigs} />)

    const highlightedItem = screen.getByTestId('highlight-test.config')
    expect(highlightedItem).toHaveClass('transition-all', 'duration-300')
  })

  it('should work with different classification types', () => {
    const overriddenConfig: ConfigEntry = {
      key: 'overridden.config',
      value: 'project-value',
      source: {
        type: 'project',
        path: './.mcp.json',
        priority: 2
      },
      overridden: true
    }

    render(<PathHighlighter configKey="overridden.config" configs={[overriddenConfig]} />)

    const highlightedItem = screen.getByTestId('highlight-overridden.config')
    expect(highlightedItem).toHaveAttribute('data-classification', 'override')
  })
})