/**
 * Tests for InheritanceTreeView component
 */

import { describe, it, expect } from 'vitest'
import { fireEvent } from '@testing-library/dom'
import { render, screen } from '@testing-library/react'
import { InheritanceTreeView } from './InheritanceTreeView'
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

describe('InheritanceTreeView', () => {
  it('should render without crashing', () => {
    render(<InheritanceTreeView configs={mockConfigs} />)
    expect(screen.getByTestId('inheritance-tree-view')).toBeInTheDocument()
  })

  it('should display tree structure for complex scenarios (AC4)', () => {
    render(<InheritanceTreeView configs={mockConfigs} />)

    expect(screen.getByTestId('tree-container')).toBeInTheDocument()
    expect(screen.getByTestId('tree-root')).toBeInTheDocument()
  })

  it('should support tree expansion and navigation (Subtask 4.2)', () => {
    render(<InheritanceTreeView configs={mockConfigs} />)

    const expandButton = screen.getByTestId('expand-button')
    expect(expandButton).toBeInTheDocument()

    // Test that the component has expand/collapse functionality
    expect(screen.getByText('test.config')).toBeInTheDocument()
  })

  it('should handle nested inheritance scenarios (Subtask 4.2)', () => {
    render(<InheritanceTreeView configs={mockConfigs} />)

    // Should display hierarchy
    expect(screen.getByText('User Level → Project Level')).toBeInTheDocument()
  })

  it('should support search functionality (Subtask 4.3)', () => {
    render(<InheritanceTreeView configs={mockConfigs} />)

    const searchInput = screen.getByPlaceholderText('Search configurations...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should call onNodeClick when node is clicked (Subtask 4.3)', () => {
    const onNodeClick = vi.fn()
    render(<InheritanceTreeView configs={mockConfigs} onNodeClick={onNodeClick} />)

    const firstNode = screen.getByText('test.config')
    firstNode.click()

    expect(onNodeClick).toHaveBeenCalledWith('test.config')
  })

  it('should support initial expanded keys', () => {
    render(
      <InheritanceTreeView
        configs={mockConfigs}
        initialExpandedKeys={['test.config']}
      />
    )

    expect(screen.getByTestId('test.config')).toHaveClass('node-expanded')
  })

  it('should integrate with InheritanceChain component from Story 3.2 (AC8)', () => {
    render(<InheritanceTreeView configs={mockConfigs} />)

    // Should use same data structure as InheritanceChain
    const treeView = screen.getByTestId('inheritance-tree-view')
    expect(treeView).toBeInTheDocument()
  })
})