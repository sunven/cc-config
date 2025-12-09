import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentList } from './AgentList'
import type { Agent } from '../types/agent'

// Mock configStore
vi.mock('../stores/configStore', () => ({
  useConfigStore: vi.fn(() => ({
    agents: [],
    agentsByScope: {
      user: [],
      project: [],
      local: []
    },
    updateAgents: vi.fn(),
    filterAgents: vi.fn((agents) => agents),
    sortAgents: vi.fn((agents) => agents),
    error: null
  }))
}))

describe('AgentList', () => {
  const mockAgents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Code Assistant',
      description: 'Helps with code completion and refactoring',
      model: {
        name: 'claude-3-sonnet',
        provider: 'anthropic',
        config: { temperature: 0.7, max_tokens: 4096 }
      },
      permissions: {
        type: 'write',
        scopes: ['files:read', 'files:write', 'shell:execute']
      },
      status: 'active',
      sourcePath: '/home/user/.claude/agents/code-assistant.md'
    },
    {
      id: 'agent-2',
      name: 'Data Analyst',
      description: 'Analyzes data and generates reports',
      model: {
        name: 'claude-3-haiku',
        provider: 'anthropic'
      },
      permissions: {
        type: 'read',
        scopes: ['files:read']
      },
      status: 'inactive',
      sourcePath: './.claude/agents/data-analyst.md'
    },
    {
      id: 'agent-3',
      name: 'System Admin',
      description: 'Manages system configuration',
      model: {
        name: 'claude-3-opus',
        provider: 'anthropic'
      },
      permissions: {
        type: 'admin',
        scopes: ['files:read', 'files:write', 'shell:execute', 'system:admin']
      },
      status: 'active',
      sourcePath: '/home/user/.claude/agents/system-admin.md'
    }
  ]

  it('renders list of agents', () => {
    vi.mocked(require('../stores/configStore').useConfigStore).mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: [mockAgents[0], mockAgents[2]],
        project: [mockAgents[1]],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
    expect(screen.getByText('Data Analyst')).toBeInTheDocument()
    expect(screen.getByText('System Admin')).toBeInTheDocument()
  })

  it('displays empty state when no agents found', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/no agents found/i)).toBeInTheDocument()
  })

  it('sorts agents by name', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: mockAgents,
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => {
        // Sort by name ascending
        return [...agents].sort((a, b) => a.name.localeCompare(b.name))
      }),
      error: null
    })

    render(<AgentList scope="user" />)
    // Should show sorted agents
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
  })

  it('filters agents by source', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: [mockAgents[0], mockAgents[2]],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => {
        // Filter by user source
        return agents.filter(agent => agent.sourcePath.includes('/home/user/'))
      }),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
    expect(screen.getByText('System Admin')).toBeInTheDocument()
  })

  it('filters agents by permissions type', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: [mockAgents[0], mockAgents[1], mockAgents[2]],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => {
        // Filter by write permissions
        return agents.filter(agent => agent.permissions.type === 'write')
      }),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
  })

  it('filters agents by status', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: [mockAgents[0], mockAgents[2]],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => {
        // Filter by active status
        return agents.filter(agent => agent.status === 'active')
      }),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
    expect(screen.getByText('System Admin')).toBeInTheDocument()
    expect(screen.queryByText('Data Analyst')).not.toBeInTheDocument()
  })

  it('searches agents by name', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: [mockAgents[0]],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => {
        // Search for "Code"
        return agents.filter(agent => agent.name.toLowerCase().includes('code'))
      }),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
  })

  it('shows results count', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: mockAgents,
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/showing \d+ of \d+ agents/i)).toBeInTheDocument()
  })

  it('has clear filters button', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: mockAgents,
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    // Clear filters button should appear when filters are active
    const searchInput = screen.getByPlaceholderText(/search agents/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument()
  })

  it('displays error state', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: 'Failed to load agents'
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/error loading agents/i)).toBeInTheDocument()
    expect(screen.getByText('Failed to load agents')).toBeInTheDocument()
  })

  it('has retry button in error state', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: 'Failed to load agents'
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/retry/i)).toBeInTheDocument()
  })

  it('calls updateAgents on mount', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    const mockUpdateAgents = vi.fn()
    mockUseConfigStore.mockReturnValue({
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      updateAgents: mockUpdateAgents,
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(mockUpdateAgents).toHaveBeenCalledTimes(1)
  })

  it('has sort controls', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: mockAgents,
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/sort by/i)).toBeInTheDocument()
    expect(screen.getByText(/name/i)).toBeInTheDocument()
    expect(screen.getByText(/permissions/i)).toBeInTheDocument()
    expect(screen.getByText(/status/i)).toBeInTheDocument()
    expect(screen.getByText(/source/i)).toBeInTheDocument()
  })

  it('has filter controls', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: mockAgents,
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/source:/i)).toBeInTheDocument()
    expect(screen.getByText(/user/i)).toBeInTheDocument()
    expect(screen.getByText(/project/i)).toBeInTheDocument()
    expect(screen.getByText(/local/i)).toBeInTheDocument()
  })

  it('has refresh button', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/refresh/i)).toBeInTheDocument()
  })

  it('displays scope in header', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    expect(screen.getByText(/sub agents/i)).toBeInTheDocument()
    expect(screen.getByText(/\(user scope\)/i)).toBeInTheDocument()
  })

  it('handles pagination', () => {
    const mockUseConfigStore = vi.mocked(require('../stores/configStore').useConfigStore)
    mockUseConfigStore.mockReturnValue({
      agents: mockAgents,
      agentsByScope: {
        user: mockAgents,
        project: [],
        local: []
      },
      updateAgents: vi.fn(),
      filterAgents: vi.fn((agents) => agents),
      sortAgents: vi.fn((agents) => agents),
      error: null
    })

    render(<AgentList scope="user" />)
    // Pagination controls should appear for lists with multiple items
    // Test pagination functionality
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
  })
})
