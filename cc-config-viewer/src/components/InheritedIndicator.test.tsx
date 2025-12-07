import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InheritedIndicator } from './InheritedIndicator'
import { TooltipProvider } from '@/components/ui/tooltip'

// Wrapper component for tooltip provider
const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <TooltipProvider>
      {component}
    </TooltipProvider>
  )
}

describe('InheritedIndicator (Story 2.3 - AC#5)', () => {
  describe('User source indicator', () => {
    it('displays 继承自用户级 label for user source', () => {
      renderWithProvider(<InheritedIndicator source="user" showTooltip={false} />)
      expect(screen.getByText('继承自用户级')).toBeInTheDocument()
    })

    it('renders with inheritance icon', () => {
      renderWithProvider(<InheritedIndicator source="user" showTooltip={false} />)
      // SVG icon should be present
      const indicator = screen.getByText('继承自用户级').closest('span')
      expect(indicator?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Project source indicator', () => {
    it('displays 继承自项目级 label for project source', () => {
      renderWithProvider(<InheritedIndicator source="project" showTooltip={false} />)
      expect(screen.getByText('继承自项目级')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies muted/lighter styling for inherited items', () => {
      renderWithProvider(<InheritedIndicator source="user" showTooltip={false} />)
      const indicator = screen.getByText('继承自用户级').closest('span')
      expect(indicator).toHaveClass('text-muted-foreground')
    })

    it('uses small text size', () => {
      renderWithProvider(<InheritedIndicator source="user" showTooltip={false} />)
      const indicator = screen.getByText('继承自用户级').closest('span')
      expect(indicator).toHaveClass('text-xs')
    })
  })

  describe('Tooltip functionality', () => {
    it('renders without tooltip when showTooltip is false', () => {
      renderWithProvider(<InheritedIndicator source="user" showTooltip={false} />)
      // Without tooltip, just the indicator should render
      expect(screen.getByText('继承自用户级')).toBeInTheDocument()
    })

    it('renders with tooltip wrapper when showTooltip is true', () => {
      renderWithProvider(<InheritedIndicator source="user" showTooltip={true} />)
      // The indicator should still be visible
      expect(screen.getByText('继承自用户级')).toBeInTheDocument()
    })

    it('shows tooltip content on hover for user source', async () => {
      const user = userEvent.setup()
      renderWithProvider(<InheritedIndicator source="user" showTooltip={true} />)

      const trigger = screen.getByText('继承自用户级')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
      // Tooltip renders content, use getAllByText since Radix may render multiple instances
      const tooltipTexts = screen.getAllByText('此配置从 用户级 继承')
      expect(tooltipTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('shows tooltip content on hover for project source', async () => {
      const user = userEvent.setup()
      renderWithProvider(<InheritedIndicator source="project" showTooltip={true} />)

      const trigger = screen.getByText('继承自项目级')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
      // Tooltip renders content, use getAllByText since Radix may render multiple instances
      const tooltipTexts = screen.getAllByText('此配置从 项目级 继承')
      expect(tooltipTexts.length).toBeGreaterThanOrEqual(1)
    })
  })
})
