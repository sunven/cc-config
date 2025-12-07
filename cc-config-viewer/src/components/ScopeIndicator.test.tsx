import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScopeIndicator } from './ScopeIndicator'

describe('ScopeIndicator (Story 2.3 - AC#4)', () => {
  describe('User scope indicator', () => {
    it('renders user scope with 用户级配置 label', () => {
      render(<ScopeIndicator scope="user" />)
      expect(screen.getByText('用户级配置')).toBeInTheDocument()
    })

    it('renders user scope with 🏠 icon', () => {
      render(<ScopeIndicator scope="user" />)
      expect(screen.getByText('🏠')).toBeInTheDocument()
    })

    it('applies blue styling for user scope', () => {
      render(<ScopeIndicator scope="user" />)
      const indicator = screen.getByText('用户级配置')
      const container = indicator.closest('div')
      expect(container).toHaveClass('bg-blue-100')
      expect(container).toHaveClass('text-blue-800')
    })
  })

  describe('Project scope indicator', () => {
    it('renders project scope with 项目级配置 label', () => {
      render(<ScopeIndicator scope="project" />)
      expect(screen.getByText('项目级配置')).toBeInTheDocument()
    })

    it('renders project scope with project name when provided', () => {
      render(<ScopeIndicator scope="project" projectName="my-app" />)
      expect(screen.getByText('项目: my-app')).toBeInTheDocument()
    })

    it('renders project scope with 📁 icon', () => {
      render(<ScopeIndicator scope="project" />)
      expect(screen.getByText('📁')).toBeInTheDocument()
    })

    it('applies green styling for project scope', () => {
      render(<ScopeIndicator scope="project" />)
      const indicator = screen.getByText('项目级配置')
      const container = indicator.closest('div')
      expect(container).toHaveClass('bg-green-100')
      expect(container).toHaveClass('text-green-800')
    })
  })

  describe('Accessibility', () => {
    it('renders with semantic structure', () => {
      render(<ScopeIndicator scope="user" />)
      // The indicator should be readable by screen readers
      expect(screen.getByText('用户级配置')).toBeInTheDocument()
    })

    it('icon is accessible with aria-hidden', () => {
      render(<ScopeIndicator scope="user" />)
      const icon = screen.getByText('🏠')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('has role="status" for screen reader announcements', () => {
      render(<ScopeIndicator scope="user" />)
      const statusElement = screen.getByRole('status')
      expect(statusElement).toBeInTheDocument()
    })

    it('has aria-live="polite" for non-intrusive updates', () => {
      render(<ScopeIndicator scope="user" />)
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')
    })

    it('has descriptive aria-label for user scope', () => {
      render(<ScopeIndicator scope="user" />)
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-label', '当前作用域: 用户级配置')
    })

    it('has descriptive aria-label for project scope with name', () => {
      render(<ScopeIndicator scope="project" projectName="my-app" />)
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-label', '当前作用域: 项目: my-app')
    })
  })
})
