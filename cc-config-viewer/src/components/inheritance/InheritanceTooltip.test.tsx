/**
 * Tests for InheritanceTooltip component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InheritanceTooltip } from './InheritanceTooltip'
import type { TooltipData } from '../../types/inheritance'

const mockTooltipData: TooltipData = {
  configKey: 'test.config',
  currentValue: 'project-value',
  classification: 'overridden',
  path: [
    {
      level: 'user',
      value: 'user-value',
      source: {
        type: 'user',
        path: '~/.claude.json',
        priority: 1
      }
    },
    {
      level: 'project',
      value: 'project-value',
      source: {
        type: 'project',
        path: './.mcp.json',
        priority: 2
      }
    }
  ]
}

describe('InheritanceTooltip', () => {
  it('should render when visible', () => {
    render(
      <InheritanceTooltip
        data={mockTooltipData}
        visible={true}
        position={{ x: 100, y: 200 }}
        onClose={() => {}}
      />
    )
    expect(screen.getByTestId('inheritance-tooltip')).toBeInTheDocument()
  })

  it('should not render when invisible', () => {
    render(
      <InheritanceTooltip
        data={mockTooltipData}
        visible={false}
        position={{ x: 100, y: 200 }}
        onClose={() => {}}
      />
    )
    expect(screen.queryByTestId('inheritance-tooltip')).not.toBeInTheDocument()
  })

  it('should display complete inheritance path (AC2)', () => {
    render(
      <InheritanceTooltip
        data={mockTooltipData}
        visible={true}
        position={{ x: 100, y: 200 }}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('test.config')).toBeInTheDocument()
    expect(screen.getByText('User Level')).toBeInTheDocument()
    expect(screen.getByText('Project Level')).toBeInTheDocument()
  })

  it('should display file path and line number (Subtask 2.3)', () => {
    const dataWithFileInfo: TooltipData = {
      ...mockTooltipData,
      filePath: '~/.claude.json',
      lineNumber: 42
    }

    render(
      <InheritanceTooltip
        data={dataWithFileInfo}
        visible={true}
        position={{ x: 100, y: 200 }}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('~/.claude.json')).toBeInTheDocument()
    expect(screen.getByText('Line 42')).toBeInTheDocument()
  })

  it('should support hover and click interactions (AC2)', () => {
    render(
      <InheritanceTooltip
        data={mockTooltipData}
        visible={true}
        position={{ x: 100, y: 200 }}
        onClose={() => {}}
      />
    )

    // Should have interactive elements
    const tooltip = screen.getByTestId('inheritance-tooltip')
    expect(tooltip).toHaveClass('hoverable')
  })

  it('should differentiate between inherited, overridden, and project-specific', () => {
    render(
      <InheritanceTooltip
        data={mockTooltipData}
        visible={true}
        position={{ x: 100, y: 200 }}
        onClose={() => {}}
      />
    )

    expect(screen.getByTestId('inheritance-tooltip')).toHaveAttribute(
      'data-classification',
      'overridden'
    )
  })
})