import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigList } from './ConfigList'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ConfigEntry } from '../types'

// Wrapper for components that use Tooltip
const renderWithTooltip = (component: React.ReactNode) => {
  return render(
    <TooltipProvider>
      {component}
    </TooltipProvider>
  )
}

describe('ConfigList', () => {
  const mockConfigs: ConfigEntry[] = [
    {
      key: 'api.url',
      value: 'https://api.example.com',
      source: { type: 'project', path: '/project/.claude/settings.json', priority: 1 }
    },
    {
      key: 'model.name',
      value: 'claude-3-sonnet',
      source: { type: 'user', path: '/user/.claude/settings.json', priority: 2 }
    }
  ]

  it('renders with default title', () => {
    render(<ConfigList configs={[]} />)
    expect(screen.getByText('Configuration')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(<ConfigList configs={[]} title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('displays message when no configs', () => {
    render(<ConfigList configs={[]} />)
    expect(screen.getByText('No configuration entries found')).toBeInTheDocument()
  })

  it('renders list of configs', () => {
    render(<ConfigList configs={mockConfigs} />)

    expect(screen.getByText('api.url')).toBeInTheDocument()
    expect(screen.getByText('https://api.example.com')).toBeInTheDocument()
    expect(screen.getByText('model.name')).toBeInTheDocument()
    expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument()
  })

  it('displays source type for each config', () => {
    render(<ConfigList configs={mockConfigs} />)

    const sourceElements = screen.getAllByText(/project|user/)
    expect(sourceElements).toHaveLength(2)
  })

  it('renders inherited badge when config is inherited', () => {
    const configsWithInherited: ConfigEntry[] = [
      {
        key: 'timeout',
        value: 30,
        source: { type: 'user', path: '/user/.claude/settings.json', priority: 1 },
        inherited: true
      }
    ]

    renderWithTooltip(<ConfigList configs={configsWithInherited} />)

    expect(screen.getByText('继承自用户级')).toBeInTheDocument()
  })

  it('renders overridden badge when config is overridden', () => {
    const configsWithOverridden: ConfigEntry[] = [
      {
        key: 'retries',
        value: 3,
        source: { type: 'project', path: '/project/.claude/settings.json', priority: 1 },
        overridden: true
      }
    ]

    render(<ConfigList configs={configsWithOverridden} />)

    expect(screen.getByText('Overridden')).toBeInTheDocument()
  })

  it('displays object values as JSON string', () => {
    const configsWithObject: ConfigEntry[] = [
      {
        key: 'headers',
        value: { 'Content-Type': 'application/json' },
        source: { type: 'project', path: '/project/.claude/settings.json', priority: 1 }
      }
    ]

    render(<ConfigList configs={configsWithObject} />)

    expect(screen.getByText(/Content-Type/)).toBeInTheDocument()
  })

  it('renders multiple configs with correct structure', () => {
    render(<ConfigList configs={mockConfigs} />)

    const configEntries = document.querySelectorAll('.border-b')
    expect(configEntries).toHaveLength(mockConfigs.length)
  })

  // MEDIUM #6 Fix: Test loading and error states, and default cases
  describe('Loading and Error States', () => {
    it('displays loading state', () => {
      render(<ConfigList configs={[]} isLoading={true} />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading configuration...')).toBeInTheDocument()
    })

    it('displays error state', () => {
      render(<ConfigList configs={[]} error="Failed to load config" />)
      expect(screen.getByText('Error: Failed to load config')).toBeInTheDocument()
    })

    it('shows title in loading state', () => {
      render(<ConfigList configs={[]} title="Test Config" isLoading={true} />)
      expect(screen.getByText('Test Config')).toBeInTheDocument()
    })

    it('shows title in error state', () => {
      render(<ConfigList configs={[]} title="Test Config" error="Error!" />)
      expect(screen.getByText('Test Config')).toBeInTheDocument()
    })
  })

  describe('Source Badge Variants', () => {
    it('applies blue badge for user source type', () => {
      const userConfig: ConfigEntry[] = [{
        key: 'test.key',
        value: 'test-value',
        source: { type: 'user', path: '', priority: 1 }
      }]

      render(<ConfigList configs={userConfig} />)

      const badge = screen.getByText('user')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('applies green badge for project source type', () => {
      const projectConfig: ConfigEntry[] = [{
        key: 'test.key',
        value: 'test-value',
        source: { type: 'project', path: '', priority: 2 }
      }]

      render(<ConfigList configs={projectConfig} />)

      const badge = screen.getByText('project')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('applies gray badge for local source type', () => {
      const localConfig: ConfigEntry[] = [{
        key: 'test.key',
        value: 'test-value',
        source: { type: 'local', path: '', priority: 3 }
      }]

      render(<ConfigList configs={localConfig} />)

      const badge = screen.getByText('local')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Memo Comparison', () => {
    it('re-renders when configs length changes', () => {
      const { rerender } = render(<ConfigList configs={mockConfigs} />)

      expect(screen.getAllByText(/api\.url|model\.name/)).toHaveLength(2)

      // Add another config
      const updatedConfigs = [
        ...mockConfigs,
        {
          key: 'new.key',
          value: 'new-value',
          source: { type: 'project' as const, path: '', priority: 1 }
        }
      ]

      rerender(<ConfigList configs={updatedConfigs} />)

      expect(screen.getByText('new.key')).toBeInTheDocument()
    })

    it('re-renders when config value changes', () => {
      const { rerender } = render(<ConfigList configs={mockConfigs} />)

      expect(screen.getByText('https://api.example.com')).toBeInTheDocument()

      // Change a config value
      const updatedConfigs = mockConfigs.map((c, i) =>
        i === 0 ? { ...c, value: 'https://new-api.example.com' } : c
      )

      rerender(<ConfigList configs={updatedConfigs} />)

      expect(screen.getByText('https://new-api.example.com')).toBeInTheDocument()
    })

    it('re-renders when isLoading changes', () => {
      const { rerender } = render(<ConfigList configs={mockConfigs} isLoading={false} />)

      expect(screen.getByText('api.url')).toBeInTheDocument()

      rerender(<ConfigList configs={mockConfigs} isLoading={true} />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('re-renders when error changes', () => {
      const { rerender } = render(<ConfigList configs={mockConfigs} error={null} />)

      expect(screen.getByText('api.url')).toBeInTheDocument()

      rerender(<ConfigList configs={mockConfigs} error="New error" />)

      expect(screen.getByText('Error: New error')).toBeInTheDocument()
    })

    it('re-renders when title changes', () => {
      const { rerender } = render(<ConfigList configs={[]} title="Old Title" />)

      expect(screen.getByText('Old Title')).toBeInTheDocument()

      rerender(<ConfigList configs={[]} title="New Title" />)

      expect(screen.getByText('New Title')).toBeInTheDocument()
    })
  })
})
