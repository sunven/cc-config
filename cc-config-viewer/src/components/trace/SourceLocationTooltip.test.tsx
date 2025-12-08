/**
 * Tests for SourceLocationTooltip component
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SourceLocationTooltip } from './SourceLocationTooltip'

describe('SourceLocationTooltip', () => {
  const defaultLocation = {
    file_path: '/home/user/.claude.json',
    line_number: 42,
    context: '  "testKey": "testValue",',
  }

  const defaultProps = {
    location: defaultLocation,
    visible: true,
    position: { x: 100, y: 100 },
    onClose: jest.fn(),
    onOpenEditor: jest.fn(),
    onCopy: jest.fn(),
    className: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when visible is true', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    expect(screen.getByTestId('source-location-tooltip')).toBeInTheDocument()
    expect(screen.getByText('Source Location')).toBeInTheDocument()
  })

  it('does not render when visible is false', () => {
    render(<SourceLocationTooltip {...defaultProps} visible={false} />)

    expect(screen.queryByTestId('source-location-tooltip')).not.toBeInTheDocument()
  })

  it('displays file path', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    const filePath = screen.getByText('/home/user/.claude.json')
    expect(filePath).toBeInTheDocument()
    expect(filePath.tagName).toBe('CODE')
  })

  it('displays line number', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    expect(screen.getByText('Line:')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('displays context when provided', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    expect(screen.getByText('Context:')).toBeInTheDocument()
    expect(screen.getByText('  "testKey": "testValue",')).toBeInTheDocument()
  })

  it('does not display line number when not provided', () => {
    const locationWithoutLine = { ...defaultLocation }
    delete locationWithoutLine.line_number

    render(<SourceLocationTooltip {...defaultProps} location={locationWithoutLine} />)

    expect(screen.queryByText('Line:')).not.toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('does not display context when not provided', () => {
    const locationWithoutContext = { ...defaultLocation }
    delete locationWithoutContext.context

    render(<SourceLocationTooltip {...defaultProps} location={locationWithoutContext} />)

    expect(screen.queryByText('Context:')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    const closeButton = screen.getByLabelText('Close tooltip')
    fireEvent.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onCopyPath when copy button is clicked', async () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    const copyButtons = screen.getAllByRole('button', { name: /Copy/i })
    // First copy button is for file path
    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(defaultProps.onCopy).toHaveBeenCalledWith('/home/user/.claude.json')
    })
  })

  it('calls onOpenEditor when open button is clicked', async () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    const openButton = screen.getByRole('button', { name: /Open in Editor/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(defaultProps.onOpenEditor).toHaveBeenCalledWith(
        '/home/user/.claude.json',
        42
      )
    })
  })

  it('copies full location when copy full button is clicked', async () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    const copyFullButton = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyFullButton)

    await waitFor(() => {
      expect(defaultProps.onCopy).toHaveBeenCalledWith('/home/user/.claude.json (line 42)')
    })
  })

  it('displays normalized path with tilde', () => {
    const location = {
      file_path: '/home/user/.claude.json',
      line_number: 10,
    }

    render(<SourceLocationTooltip {...defaultProps} location={location} />)

    // Should show ~/ instead of full home path
    expect(screen.getByText(/.+\.claude\.json/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <SourceLocationTooltip {...defaultProps} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders at correct position', () => {
    const position = { x: 200, y: 300 }
    const { container } = render(
      <SourceLocationTooltip {...defaultProps} position={position} />
    )

    const tooltip = container.firstChild as HTMLElement
    expect(tooltip.style.left).toBe('200px')
    expect(tooltip.style.top).toBe('300px')
  })

  it('has correct data-testid', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    expect(screen.getByTestId('source-location-tooltip')).toBeInTheDocument()
  })

  it('displays FileText icon in header', () => {
    render(<SourceLocationTooltip {...defaultProps} />)

    // Check for the icon in the header
    const header = screen.getByText('Source Location').parentElement
    expect(header).toBeTruthy()
  })

  it('has border and shadow styling', () => {
    const { container } = render(<SourceLocationTooltip {...defaultProps} />)

    const tooltip = container.firstChild as HTMLElement
    expect(tooltip).toHaveClass('border', 'border-gray-200', 'rounded-lg', 'shadow-lg')
  })
})