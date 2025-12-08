import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { McpList } from './McpList'
import type { McpServer } from '../types/mcp'

// Mock configStore
vi.mock('../../stores/configStore', () => ({
  useConfigStore: vi.fn(() => ({
    mcpServers: [],
    mcpServersByScope: {
      user: [],
      project: [],
      local: []
    },
    updateMcpServers: vi.fn(),
    filterMcpServers: vi.fn((servers) => servers),
    sortMcpServers: vi.fn((servers) => servers)
  }))
}))

describe('McpList', () => {
  const mockServers: McpServer[] = [
    {
      name: 'filesystem',
      type: 'stdio',
      description: 'File system operations',
      config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
      status: 'active',
      sourcePath: '/home/user/.claude.json'
    },
    {
      name: 'postgres',
      type: 'http',
      description: 'PostgreSQL database',
      config: { url: 'http://localhost:5432' },
      status: 'inactive',
      sourcePath: './.mcp.json'
    },
    {
      name: 'git',
      type: 'stdio',
      description: 'Git operations',
      config: { command: 'python', args: ['mcp-git-server.py'] },
      status: 'error',
      sourcePath: '/home/user/.claude.json'
    }
  ]

  it('renders list of MCP servers', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: mockServers,
      mcpServersByScope: {
        user: [mockServers[0], mockServers[2]],
        project: [mockServers[1]],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)
    expect(screen.getByText('filesystem')).toBeInTheDocument()
    expect(screen.getByText('postgres')).toBeInTheDocument()
    expect(screen.getByText('git')).toBeInTheDocument()
  })

  it('displays empty state when no servers found', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: [],
      mcpServersByScope: {
        user: [],
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)
    expect(screen.getByText(/no mcp servers found/i)).toBeInTheDocument()
  })

  it('sorts servers by name', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: mockServers,
      mcpServersByScope: {
        user: mockServers,
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => {
        // Sort by name ascending
        return [...servers].sort((a, b) => a.name.localeCompare(b.name))
      })
    })

    render(<McpList scope="user" />)

    // Check if sort button is present
    const sortButton = screen.getByText(/sort by/i)
    expect(sortButton).toBeInTheDocument()
  })

  it('filters servers by search query', () => {
    const { useConfigStore } = require('../../stores/configStore')
    const filterSpy = vi.fn((servers) => {
      return servers.filter(s => s.name.includes('fs'))
    })
    useConfigStore.mockReturnValue({
      mcpServers: mockServers,
      mcpServersByScope: {
        user: mockServers,
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: filterSpy,
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)

    const searchInput = screen.getByPlaceholderText(/search servers/i)
    fireEvent.change(searchInput, { target: { value: 'fs' } })

    expect(filterSpy).toHaveBeenCalled()
  })

  it('filters servers by source', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: mockServers,
      mcpServersByScope: {
        user: [mockServers[0], mockServers[2]],
        project: [mockServers[1]],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)

    const sourceFilter = screen.getByText(/source:/i)
    expect(sourceFilter).toBeInTheDocument()
  })

  it('filters servers by type', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: mockServers,
      mcpServersByScope: {
        user: mockServers,
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)

    const typeFilter = screen.getByText(/type:/i)
    expect(typeFilter).toBeInTheDocument()
  })

  it('filters servers by status', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: mockServers,
      mcpServersByScope: {
        user: mockServers,
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)

    const statusFilter = screen.getByText(/status:/i)
    expect(statusFilter).toBeInTheDocument()
  })

  it('displays pagination controls for large lists', () => {
    const { useConfigStore } = require('../../stores/configStore')
    const largeServerList = Array.from({ length: 25 }, (_, i) => ({
      name: `server-${i}`,
      type: 'http' as const,
      config: {},
      status: 'active' as const,
      sourcePath: './.mcp.json'
    }))

    useConfigStore.mockReturnValue({
      mcpServers: largeServerList,
      mcpServersByScope: {
        user: largeServerList,
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)

    const pagination = screen.getByText(/previous/i)
    expect(pagination).toBeInTheDocument()
  })

  it('shows correct scope label', () => {
    const { useConfigStore } = require('../../stores/configStore')
    useConfigStore.mockReturnValue({
      mcpServers: [],
      mcpServersByScope: {
        user: [],
        project: [],
        local: []
      },
      updateMcpServers: vi.fn(),
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)
    expect(screen.getByText(/user scope/i)).toBeInTheDocument()
  })

  it('calls updateMcpServers on mount', () => {
    const { useConfigStore } = require('../../stores/configStore')
    const updateSpy = vi.fn()

    useConfigStore.mockReturnValue({
      mcpServers: [],
      mcpServersByScope: {
        user: [],
        project: [],
        local: []
      },
      updateMcpServers: updateSpy,
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    render(<McpList scope="user" />)
    expect(updateSpy).toHaveBeenCalled()
  })

  it('updates when scope changes', () => {
    const { useConfigStore } = require('../../stores/configStore')
    const updateSpy = vi.fn()

    useConfigStore.mockReturnValue({
      mcpServers: [],
      mcpServersByScope: {
        user: [],
        project: [],
        local: []
      },
      updateMcpServers: updateSpy,
      filterMcpServers: vi.fn((servers) => servers),
      sortMcpServers: vi.fn((servers) => servers)
    })

    const { rerender } = render(<McpList scope="user" />)
    expect(updateSpy).toHaveBeenCalledTimes(1)

    rerender(<McpList scope="project" />)
    expect(updateSpy).toHaveBeenCalledTimes(2)
  })
})
