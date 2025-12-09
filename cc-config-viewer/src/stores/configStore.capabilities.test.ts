import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from './configStore'
import type { UnifiedCapability } from '../types/capability'

// Mock the external dependencies
vi.mock('../lib/capabilityUnifier', () => ({
  unifyCapabilities: vi.fn(),
  filterCapabilities: vi.fn((capabilities, filters) => capabilities),
  sortCapabilities: vi.fn((capabilities, sort) => capabilities)
}))

vi.mock('../lib/configParser', () => ({
  readAndParseConfig: vi.fn(),
  extractAllEntries: vi.fn(() => []),
  mergeConfigs: vi.fn(() => ({})),
  parseMcpServers: vi.fn(() => ({
    userMcpServers: [],
    projectMcpServers: [],
    inheritedMcpServers: []
  }))
}))

vi.mock('../lib/agentParser', () => ({
  parseAgents: vi.fn(() => Promise.resolve({
    userAgents: [],
    projectAgents: [],
    inheritedAgents: []
  }))
}))

describe('ConfigStore - Capabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useConfigStore.setState({
      capabilities: [],
      mcpServers: [],
      agents: [],
      mcpServersByScope: { user: [], project: [], local: [] },
      agentsByScope: { user: [], project: [], local: [] },
      error: null
    })
  })

  describe('updateCapabilities', () => {
    it('should update capabilities by unifying MCP servers and agents', async () => {
      const mockMcpServers = [
        {
          name: 'test-mcp',
          type: 'stdio' as const,
          config: {},
          status: 'active' as const,
          sourcePath: '/test/.claude.json'
        }
      ]
      const mockAgents = [
        {
          id: 'test-agent',
          name: 'Test Agent',
          description: 'Test',
          model: { name: 'test' },
          permissions: { type: 'read' as const, scopes: [] },
          status: 'active' as const,
          sourcePath: '/test/.claude/agents/test.md'
        }
      ]

      const mockCapabilities: UnifiedCapability[] = [
        {
          id: 'mcp-test-mcp',
          type: 'mcp',
          name: 'test-mcp',
          status: 'active',
          source: 'user',
          sourcePath: '/test/.claude.json',
          mcpData: mockMcpServers[0]
        }
      ]

      const { unifyCapabilities } = await import('../lib/capabilityUnifier')
      vi.mocked(unifyCapabilities).mockReturnValue({
        capabilities: mockCapabilities,
        totalCount: 1,
        mcpCount: 1,
        agentCount: 0
      })

      useConfigStore.setState({
        mcpServers: mockMcpServers,
        agents: mockAgents
      })

      const { result } = renderHook(() => useConfigStore())

      await act(async () => {
        await result.current.updateCapabilities()
      })

      expect(unifyCapabilities).toHaveBeenCalledWith(mockMcpServers, mockAgents)
      expect(result.current.capabilities).toEqual(mockCapabilities)
    })

    it('should handle errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { parseAgents } = await import('../lib/agentParser')
      vi.mocked(parseAgents).mockRejectedValue(new Error('Parse error'))

      const { result } = renderHook(() => useConfigStore())

      await act(async () => {
        await result.current.updateCapabilities()
      })

      expect(result.current.error).toContain('Failed to update capabilities')
      consoleError.mockRestore()
    })
  })

  describe('getCapabilities', () => {
    beforeEach(() => {
      useConfigStore.setState({
        capabilities: [
          {
            id: 'mcp-1',
            type: 'mcp',
            name: 'MCP 1',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude.json',
            mcpData: { name: 'MCP 1', type: 'stdio', config: {}, status: 'active', sourcePath: '/test/.claude.json' }
          },
          {
            id: 'agent-1',
            type: 'agent',
            name: 'Agent 1',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude/agents/1.md',
            agentData: { id: 'agent-1', name: 'Agent 1', description: '', model: { name: 'test' }, permissions: { type: 'read', scopes: [] }, status: 'active', sourcePath: '/test/.claude/agents/1.md' }
          }
        ]
      })
    })

    it('should return all capabilities when no type filter is specified', () => {
      const { result } = renderHook(() => useConfigStore())
      const capabilities = result.current.getCapabilities()
      expect(capabilities).toHaveLength(2)
    })

    it('should filter by type "all"', () => {
      const { result } = renderHook(() => useConfigStore())
      const capabilities = result.current.getCapabilities('all')
      expect(capabilities).toHaveLength(2)
    })

    it('should filter by type "mcp"', () => {
      const { result } = renderHook(() => useConfigStore())
      const capabilities = result.current.getCapabilities('mcp')
      expect(capabilities).toHaveLength(1)
      expect(capabilities[0].type).toBe('mcp')
    })

    it('should filter by type "agent"', () => {
      const { result } = renderHook(() => useConfigStore())
      const capabilities = result.current.getCapabilities('agent')
      expect(capabilities).toHaveLength(1)
      expect(capabilities[0].type).toBe('agent')
    })
  })

  describe('filterCapabilities', () => {
    beforeEach(() => {
      useConfigStore.setState({
        capabilities: [
          {
            id: 'mcp-1',
            type: 'mcp',
            name: 'MCP 1',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude.json',
            mcpData: { name: 'MCP 1', type: 'stdio', config: {}, status: 'active', sourcePath: '/test/.claude.json' }
          },
          {
            id: 'agent-1',
            type: 'agent',
            name: 'Agent 1',
            status: 'active',
            source: 'project',
            sourcePath: './.claude/agents/1.md',
            agentData: { id: 'agent-1', name: 'Agent 1', description: 'Test agent', model: { name: 'test' }, permissions: { type: 'read', scopes: [] }, status: 'active', sourcePath: './.claude/agents/1.md' }
          }
        ]
      })
    })

    it('should return all capabilities when no filters are applied', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.filterCapabilities({})
      expect(filtered).toHaveLength(2)
    })

    it('should filter by type', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.filterCapabilities({ type: 'mcp' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('mcp')
    })

    it('should filter by source', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.filterCapabilities({ source: 'user' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].source).toBe('user')
    })

    it('should filter by status', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.filterCapabilities({ status: 'active' })
      expect(filtered).toHaveLength(2)
    })

    it('should filter by search query', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.filterCapabilities({ searchQuery: 'test' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('agent')
    })

    it('should combine multiple filters', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.filterCapabilities({
        type: 'agent',
        source: 'project'
      })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('agent')
      expect(filtered[0].source).toBe('project')
    })
  })

  describe('searchCapabilities', () => {
    beforeEach(() => {
      useConfigStore.setState({
        capabilities: [
          {
            id: 'mcp-1',
            type: 'mcp',
            name: 'Filesystem',
            description: 'File system access',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude.json',
            mcpData: { name: 'Filesystem', type: 'stdio', config: {}, status: 'active', sourcePath: '/test/.claude.json' }
          },
          {
            id: 'agent-1',
            type: 'agent',
            name: 'Code Reviewer',
            description: 'Reviews code',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude/agents/1.md',
            agentData: { id: 'agent-1', name: 'Code Reviewer', description: 'Reviews code', model: { name: 'test' }, permissions: { type: 'read', scopes: [] }, status: 'active', sourcePath: '/test/.claude/agents/1.md' }
          }
        ]
      })
    })

    it('should search by name', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.searchCapabilities('Filesystem')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Filesystem')
    })

    it('should search by description', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.searchCapabilities('code')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Code Reviewer')
    })

    it('should return empty array for no matches', () => {
      const { result } = renderHook(() => useConfigStore())
      const filtered = result.current.searchCapabilities('nonexistent')
      expect(filtered).toHaveLength(0)
    })
  })

  describe('sortCapabilities', () => {
    beforeEach(() => {
      useConfigStore.setState({
        capabilities: [
          {
            id: 'mcp-1',
            type: 'mcp',
            name: 'Zebra',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude.json',
            mcpData: { name: 'Zebra', type: 'stdio', config: {}, status: 'active', sourcePath: '/test/.claude.json' }
          },
          {
            id: 'agent-1',
            type: 'agent',
            name: 'Alpha',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude/agents/1.md',
            agentData: { id: 'agent-1', name: 'Alpha', description: '', model: { name: 'test' }, permissions: { type: 'read', scopes: [] }, status: 'active', sourcePath: '/test/.claude/agents/1.md' }
          }
        ]
      })
    })

    it('should sort by name in ascending order', () => {
      const { result } = renderHook(() => useConfigStore())
      const sorted = result.current.sortCapabilities(result.current.capabilities, { field: 'name', direction: 'asc' })
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Zebra')
    })

    it('should sort by name in descending order', () => {
      const { result } = renderHook(() => useConfigStore())
      const sorted = result.current.sortCapabilities(result.current.capabilities, { field: 'name', direction: 'desc' })
      expect(sorted[0].name).toBe('Zebra')
      expect(sorted[1].name).toBe('Alpha')
    })

    it('should sort by type', () => {
      const { result } = renderHook(() => useConfigStore())
      const sorted = result.current.sortCapabilities(result.current.capabilities, { field: 'type', direction: 'asc' })
      // Agents come before MCPs alphabetically
      expect(sorted[0].type).toBe('agent')
      expect(sorted[1].type).toBe('mcp')
    })

    it('should return a new array', () => {
      const { result } = renderHook(() => useConfigStore())
      const sorted = result.current.sortCapabilities(result.current.capabilities, { field: 'name', direction: 'asc' })
      expect(sorted).not.toBe(result.current.capabilities)
    })
  })

  describe('capabilities state management', () => {
    it('should initialize with empty capabilities array', () => {
      const { result } = renderHook(() => useConfigStore())
      expect(result.current.capabilities).toEqual([])
    })

    it('should clear capabilities in clearConfigs', () => {
      useConfigStore.setState({
        capabilities: [
          {
            id: 'test',
            type: 'mcp',
            name: 'Test',
            status: 'active',
            source: 'user',
            sourcePath: '/test/.claude.json',
            mcpData: { name: 'Test', type: 'stdio', config: {}, status: 'active', sourcePath: '/test/.claude.json' }
          }
        ]
      })

      const { result } = renderHook(() => useConfigStore())

      act(() => {
        result.current.clearConfigs()
      })

      expect(result.current.capabilities).toEqual([])
    })
  })
})