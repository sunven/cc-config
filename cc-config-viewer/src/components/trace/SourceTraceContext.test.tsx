/**
 * Tests for SourceTraceContext component
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SourceTraceContext } from './SourceTraceContext'

// Mock the sourceTracker and externalEditorLauncher
jest.mock('../../utils/sourceTracker', () => ({
  sourceTracker: {
    traceSource: jest.fn(),
  },
  formatSourceLocation: jest.fn((location) => ({
    displayPath: location.file_path,
    displayLine: location.line_number ? `line ${location.line_number}` : null,
  })),
}))

jest.mock('../../utils/externalEditorLauncher', () => ({
  openFileInEditor: jest.fn(),
}))

describe('SourceTraceContext', () => {
  const defaultProps = {
    configKey: 'testKey',
    configValue: 'testValue',
    projectPath: '/test/project',
    className: '',
    children: <div>Test Content</div>,
  }

  const mockSourceLocation = {
    file_path: '/home/user/.claude.json',
    line_number: 42,
    context: '  "testKey": "testValue",',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockTraceSource = require('../../utils/sourceTracker').sourceTracker.traceSource
    mockTraceSource.mockResolvedValue(mockSourceLocation)
  })

  it('renders children', () => {
    render(<SourceTraceContext {...defaultProps} />)

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('shows context menu on right click', () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    expect(screen.getByTestId('source-trace-context-menu')).toBeInTheDocument()
    expect(screen.getByText('Trace Source')).toBeInTheDocument()
  })

  it('hides context menu when clicking outside', () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    expect(screen.getByTestId('source-trace-context-menu')).toBeInTheDocument()

    // Click outside
    fireEvent.click(document.body)

    expect(screen.queryByTestId('source-trace-context-menu')).not.toBeInTheDocument()
  })

  it('calls traceSource when Trace Source is clicked', async () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    const mockTraceSource = require('../../utils/sourceTracker').sourceTracker.traceSource
    await waitFor(() => {
      expect(mockTraceSource).toHaveBeenCalledWith(defaultProps.configKey, [])
    })
  })

  it('shows loading state while tracing', async () => {
    const mockTraceSource = require('../../utils/sourceTracker').sourceTracker.traceSource
    mockTraceSource.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      expect(screen.getByText('Tracing...')).toBeInTheDocument()
    })
  })

  it('shows error when traceSource fails', async () => {
    const mockTraceSource = require('../../utils/sourceTracker').sourceTracker.traceSource
    mockTraceSource.mockRejectedValue(new Error('Test error'))

    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })

  it('shows error when source not found', async () => {
    const mockTraceSource = require('../../utils/sourceTracker').sourceTracker.traceSource
    mockTraceSource.mockResolvedValue(null)

    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      expect(screen.getByText('Source location not found')).toBeInTheDocument()
    })
  })

  it('enables Copy File Path button after successful trace', async () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      const copyButton = screen.getByText('Copy File Path').closest('button')
      expect(copyButton).not.toBeDisabled()
    })
  })

  it('disables Copy File Path button when not traced', () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const copyButton = screen.getByText('Copy File Path').closest('button')
    expect(copyButton).toBeDisabled()
  })

  it('calls openFileInEditor when Open in Editor is clicked', async () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      const openButton = screen.getByText('Open in Editor').closest('button')
      expect(openButton).not.toBeDisabled()
    })

    const openEditorButton = screen.getByText('Open in Editor')
    fireEvent.click(openEditorButton)

    const mockOpenFile = require('../../utils/externalEditorLauncher').openFileInEditor
    await waitFor(() => {
      expect(mockOpenFile).toHaveBeenCalledWith('/home/user/.claude.json', 42)
    })
  })

  it('enables Open in Editor button after successful trace', async () => {
    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      const openButton = screen.getByText('Open in Editor').closest('button')
      expect(openButton).not.toBeDisabled()
    })
  })

  it('shows Show details link after successful trace', async () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      expect(screen.getByText('Show details...')).toBeInTheDocument()
    })
  })

  it('copies file path to clipboard when Copy File Path is clicked', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(),
      },
      writable: true,
    })

    render(<SourceTraceContext {...defaultProps} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    const traceButton = screen.getByText('Trace Source')
    fireEvent.click(traceButton)

    await waitFor(() => {
      const copyButton = screen.getByText('Copy File Path')
      fireEvent.click(copyButton)
    })

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/home/user/.claude.json')
    })
  })

  it('has correct data-testid', () => {
    render(<SourceTraceContext {...defaultProps} />)

    expect(screen.getByTestId('source-trace-context')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <SourceTraceContext {...defaultProps} className="custom-class" />
    )

    const contextDiv = container.firstChild as HTMLElement
    expect(contextDiv).toHaveClass('custom-class')
  })

  it('handles missing projectPath gracefully', () => {
    const propsWithoutProject = {
      ...defaultProps,
      projectPath: undefined,
    }

    render(<SourceTraceContext {...propsWithoutProject} />)

    const content = screen.getByText('Test Content')
    fireEvent.contextMenu(content)

    expect(screen.getByTestId('source-trace-context-menu')).toBeInTheDocument()
  })
})

// Import SourceLocationTooltip for the test above
import { SourceLocationTooltip } from './SourceLocationTooltip'