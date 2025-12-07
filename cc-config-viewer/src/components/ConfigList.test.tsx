import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigList } from './ConfigList'
import type { ConfigEntry } from '../types'

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

  it('renders inherited flag when config is inherited', () => {
    const configsWithInherited: ConfigEntry[] = [
      {
        key: 'timeout',
        value: 30,
        source: { type: 'user', path: '/user/.claude/settings.json', priority: 1 },
        inherited: true
      }
    ]

    render(<ConfigList configs={configsWithInherited} />)

    expect(screen.getByText('(inherited)')).toBeInTheDocument()
  })

  it('renders overridden flag when config is overridden', () => {
    const configsWithOverridden: ConfigEntry[] = [
      {
        key: 'retries',
        value: 3,
        source: { type: 'project', path: '/project/.claude/settings.json', priority: 1 },
        overridden: true
      }
    ]

    render(<ConfigList configs={configsWithOverridden} />)

    expect(screen.getByText('(overridden)')).toBeInTheDocument()
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
})
