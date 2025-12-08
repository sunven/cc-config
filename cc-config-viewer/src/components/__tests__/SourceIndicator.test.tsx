import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SourceIndicator } from '../SourceIndicator'

describe('SourceIndicator', () => {
  describe('Color coding (AC1-3)', () => {
    it('renders user source type with blue badge', () => {
      render(<SourceIndicator sourceType="user" />)
      const badge = screen.getByText('User Level')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200')
    })

    it('renders project source type with green badge', () => {
      render(<SourceIndicator sourceType="project" />)
      const badge = screen.getByText('Project Specific')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    })

    it('renders inherited source type with gray badge', () => {
      render(<SourceIndicator sourceType="inherited" />)
      const badge = screen.getByText('Inherited from User')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200')
    })
  })

  describe('Descriptive labels (AC4)', () => {
    it('displays "User Level" for user source type', () => {
      render(<SourceIndicator sourceType="user" />)
      expect(screen.getByText('User Level')).toBeInTheDocument()
    })

    it('displays "Project Specific" for project source type', () => {
      render(<SourceIndicator sourceType="project" />)
      expect(screen.getByText('Project Specific')).toBeInTheDocument()
    })

    it('displays "Inherited from User" for inherited source type', () => {
      render(<SourceIndicator sourceType="inherited" />)
      expect(screen.getByText('Inherited from User')).toBeInTheDocument()
    })

    it('allows custom label override', () => {
      render(<SourceIndicator sourceType="user" label="Custom Label" />)
      expect(screen.getByText('Custom Label')).toBeInTheDocument()
      expect(screen.queryByText('User Level')).not.toBeInTheDocument()
    })
  })

  describe('Styling and variants', () => {
    it('applies custom className', () => {
      render(<SourceIndicator sourceType="user" className="custom-class" />)
      const badge = screen.getByTestId('source-indicator-user')
      expect(badge).toHaveClass('custom-class')
    })

    it('has correct badge variant for each source type', () => {
      const { rerender } = render(<SourceIndicator sourceType="user" />)
      expect(screen.getByTestId('source-indicator-user')).toHaveAttribute('data-variant', 'default')

      rerender(<SourceIndicator sourceType="project" />)
      expect(screen.getByTestId('source-indicator-project')).toHaveAttribute('data-variant', 'secondary')

      rerender(<SourceIndicator sourceType="inherited" />)
      expect(screen.getByTestId('source-indicator-inherited')).toHaveAttribute('data-variant', 'outline')
    })
  })
})
