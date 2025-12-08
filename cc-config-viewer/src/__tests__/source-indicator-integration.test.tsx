import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConfigList } from '@/components/ConfigList'
import type { ConfigEntry } from '../types'

describe('SourceIndicator Integration Tests', () => {
  const mockUserConfigs: ConfigEntry[] = [
    {
      key: 'user.config1',
      value: 'user-value-1',
      source: { type: 'user', path: '/user/.claude.json', priority: 1 }
    },
    {
      key: 'user.config2',
      value: 'user-value-2',
      source: { type: 'user', path: '/user/.claude.json', priority: 1 }
    }
  ]

  const mockProjectConfigs: ConfigEntry[] = [
    {
      key: 'project.config1',
      value: 'project-value-1',
      source: { type: 'project', path: '/project/.mcp.json', priority: 2 }
    }
  ]

  const mockInheritedConfigs: ConfigEntry[] = [
    {
      key: 'inherited.config1',
      value: 'inherited-value-1',
      source: { type: 'inherited', path: '/inherited/config.json', priority: 3 }
    }
  ]

  const renderWithTooltip = (component: React.ReactNode) => {
    return render(
      <TooltipProvider>
        {component}
      </TooltipProvider>
    )
  }

  describe('Source determination accuracy', () => {
    it('correctly identifies user-level configurations', () => {
      renderWithTooltip(<ConfigList configs={mockUserConfigs} />)

      const userBadges = screen.getAllByText('User Level')
      expect(userBadges).toHaveLength(2)
      userBadges.forEach(badge => {
        expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
      })
    })

    it('correctly identifies project-level configurations', () => {
      renderWithTooltip(<ConfigList configs={mockProjectConfigs} />)

      const projectBadge = screen.getByText('Project Specific')
      expect(projectBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('correctly identifies inherited configurations', () => {
      renderWithTooltip(<ConfigList configs={mockInheritedConfigs} />)

      const inheritedBadge = screen.getByText('Inherited from User')
      expect(inheritedBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('handles mixed source types correctly', () => {
      const mixedConfigs = [...mockUserConfigs, ...mockProjectConfigs, ...mockInheritedConfigs]
      renderWithTooltip(<ConfigList configs={mixedConfigs} />)

      expect(screen.getAllByText('User Level')).toHaveLength(2)
      expect(screen.getByText('Project Specific')).toBeInTheDocument()
      expect(screen.getByText('Inherited from User')).toBeInTheDocument()
    })
  })

  describe('Color consistency across views (AC5)', () => {
    it('applies consistent blue styling for all user configs', () => {
      renderWithTooltip(<ConfigList configs={mockUserConfigs} />)

      const userBadges = screen.getAllByText('User Level')
      userBadges.forEach(badge => {
        expect(badge).toHaveClass('bg-blue-100')
        expect(badge).toHaveClass('text-blue-800')
        expect(badge).toHaveClass('border-blue-200')
      })
    })

    it('applies consistent green styling for all project configs', () => {
      renderWithTooltip(<ConfigList configs={mockProjectConfigs} />)

      const projectBadge = screen.getByText('Project Specific')
      expect(projectBadge).toHaveClass('bg-green-100')
      expect(projectBadge).toHaveClass('text-green-800')
      expect(projectBadge).toHaveClass('border-green-200')
    })

    it('applies consistent gray styling for all inherited configs', () => {
      renderWithTooltip(<ConfigList configs={mockInheritedConfigs} />)

      const inheritedBadge = screen.getByText('Inherited from User')
      expect(inheritedBadge).toHaveClass('bg-gray-100')
      expect(inheritedBadge).toHaveClass('text-gray-800')
      expect(inheritedBadge).toHaveClass('border-gray-200')
    })
  })

  describe('Accessibility - Color contrast', () => {
    it('user badge has sufficient contrast (blue on light blue)', () => {
      renderWithTooltip(<ConfigList configs={mockUserConfigs} />)

      const userBadge = screen.getAllByText('User Level')[0]
      // bg-blue-100 (#DBEAFE) with text-blue-800 (#1E40AF) meets WCAG AA
      expect(userBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('project badge has sufficient contrast (green on light green)', () => {
      renderWithTooltip(<ConfigList configs={mockProjectConfigs} />)

      const projectBadge = screen.getByText('Project Specific')
      // bg-green-100 (#DCFCE7) with text-green-800 (#166534) meets WCAG AA
      expect(projectBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('inherited badge has sufficient contrast (gray on light gray)', () => {
      renderWithTooltip(<ConfigList configs={mockInheritedConfigs} />)

      const inheritedBadge = screen.getByText('Inherited from User')
      // bg-gray-100 (#F3F4F6) with text-gray-800 (#1F2937) meets WCAG AA
      expect(inheritedBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Performance - Source determination', () => {
    it('renders large config lists with consistent source indicators', () => {
      const largeConfigList: ConfigEntry[] = Array.from({ length: 50 }, (_, i) => ({
        key: `config.${i}`,
        value: `value-${i}`,
        source: {
          type: i % 3 === 0 ? 'user' : i % 3 === 1 ? 'project' : 'inherited',
          path: `/path/config-${i}.json`,
          priority: i % 3 + 1
        }
      }))

      renderWithTooltip(<ConfigList configs={largeConfigList} />)

      // Verify all source indicators are rendered correctly
      const userBadges = screen.getAllByText('User Level')
      const projectBadges = screen.getAllByText('Project Specific')
      const inheritedBadges = screen.getAllByText('Inherited from User')

      // Should have roughly equal distribution (17, 17, 16)
      expect(userBadges.length).toBeGreaterThan(15)
      expect(projectBadges.length).toBeGreaterThan(15)
      expect(inheritedBadges.length).toBeGreaterThan(15)
    })
  })
})
