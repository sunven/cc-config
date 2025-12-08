import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from './configStore'
import { useUiStore } from './uiStore'
import * as configParser from '../lib/configParser'

// Mock the configParser module
vi.mock('../lib/configParser', () => ({
  readAndParseConfig: vi.fn(),
  extractAllEntries: vi.fn(),
  mergeConfigs: vi.fn(),
  parseMcpServers: vi.fn(),
}))

describe('ConfigStore - Project Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset stores
    useConfigStore.setState({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      isLoading: false,
      isInitialLoading: false,
      isBackgroundLoading: false,
      error: null,
      userConfigsCache: null,
      projectConfigsCache: {},
    })
    useUiStore.setState({
      currentScope: 'user',
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })
  })

  it('loads project configuration when scope is project', async () => {
    const mockUserConfig = {
      mcpServers: {
        userServer: { type: 'stdio', command: 'python' },
      },
    }
    const mockProjectConfig = {
      mcpServers: {
        server1: { type: 'stdio', command: 'node' },
      },
      subAgents: {
        agent1: { type: 'coding', permissions: ['read'] },
      },
    }
    const mockMergedEntries = [
      {
        key: 'mcpServers.userServer',
        value: { type: 'stdio', command: 'python' },
        source: { type: 'user', path: '', priority: 1 },
        inherited: true,
      },
      {
        key: 'mcpServers.server1',
        value: { type: 'stdio', command: 'node' },
        source: { type: 'project', path: '', priority: 2 },
      },
      {
        key: 'subAgents.agent1',
        value: { type: 'coding', permissions: ['read'] },
        source: { type: 'project', path: '', priority: 2 },
      },
    ]

    // Mock readAndParseConfig to return different configs based on path
    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>)
      .mockResolvedValueOnce(mockUserConfig) // First call for user config
      .mockResolvedValueOnce(mockProjectConfig) // Second call for project config
    ;(configParser.mergeConfigs as MockedFunction<typeof configParser.mergeConfigs>).mockReturnValue(mockMergedEntries as any)

    // Set scope to project
    act(() => {
      useUiStore.getState().setCurrentScope('project')
    })

    const { result } = renderHook(() => useConfigStore())

    await act(async () => {
      await result.current.updateConfigs()
    })

    // Should read both user and project configs
    expect(configParser.readAndParseConfig).toHaveBeenCalledWith('~/.claude.json')
    expect(configParser.readAndParseConfig).toHaveBeenCalledWith('./.mcp.json')
    expect(configParser.mergeConfigs).toHaveBeenCalledWith(mockUserConfig, mockProjectConfig)
    expect(result.current.configs).toEqual(mockMergedEntries)
    expect(result.current.configs[0].source.type).toBe('user')
    expect(result.current.configs[1].source.type).toBe('project')
  })

  it('handles missing .mcp.json gracefully', async () => {
    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>).mockRejectedValue(
      new Error('File not found')
    )

    // Set scope to project
    act(() => {
      useUiStore.getState().setCurrentScope('project')
    })

    const { result } = renderHook(() => useConfigStore())

    await act(async () => {
      await result.current.updateConfigs()
    })

    expect(result.current.error).toBe('File not found')
    expect(result.current.configs).toEqual([])
  })

  it('loads user configuration when scope is user', async () => {
    const mockUserConfig = {
      mcpServers: {
        globalServer: { type: 'http', url: 'http://localhost' },
      },
    }
    const mockEntries = [
      {
        key: 'mcpServers.globalServer',
        value: { type: 'http', url: 'http://localhost' },
        source: { type: 'user', path: '', priority: 1 },
      },
    ]

    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>).mockResolvedValue(mockUserConfig)
    ;(configParser.extractAllEntries as MockedFunction<typeof configParser.extractAllEntries>).mockReturnValue(mockEntries as any)

    // Set scope to user
    act(() => {
      useUiStore.getState().setCurrentScope('user')
    })

    const { result } = renderHook(() => useConfigStore())

    await act(async () => {
      await result.current.updateConfigs()
    })

    expect(configParser.readAndParseConfig).toHaveBeenCalledWith('~/.claude.json')
    expect(configParser.extractAllEntries).toHaveBeenCalledWith(mockUserConfig, 'user')
    expect(result.current.configs).toEqual(mockEntries)
    expect(result.current.configs[0].source.type).toBe('user')
    expect(result.current.configs[0].source.priority).toBe(1)
  })

  it('sets loading state during async operation', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>).mockReturnValue(promise as any)
    ;(configParser.extractAllEntries as MockedFunction<typeof configParser.extractAllEntries>).mockReturnValue([])

    // Set scope to project
    act(() => {
      useUiStore.getState().setCurrentScope('project')
    })

    const { result } = renderHook(() => useConfigStore())

    // Start loading (don't await yet)
    const updatePromise = result.current.updateConfigs()

    // Wait a tick for loading state to be set
    await new Promise(resolve => setTimeout(resolve, 0))

    // Loading should be true during operation
    expect(result.current.isLoading).toBe(true)

    // Resolve and check loading is false
    resolvePromise!({})
    await act(async () => {
      await updatePromise
    })

    expect(result.current.isLoading).toBe(false)
  })
})

describe('ConfigStore - Cache Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useConfigStore.setState({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      isLoading: false,
      isInitialLoading: false,
      isBackgroundLoading: false,
      error: null,
      userConfigsCache: null,
      projectConfigsCache: {},
    })
  })

  it('caches user configs after loading', async () => {
    const mockUserConfig = { setting: 'value' }
    const mockEntries = [
      { key: 'setting', value: 'value', source: { type: 'user', path: '', priority: 1 } },
    ]

    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>).mockResolvedValue(mockUserConfig)
    ;(configParser.extractAllEntries as MockedFunction<typeof configParser.extractAllEntries>).mockReturnValue(mockEntries as any)

    const { result } = renderHook(() => useConfigStore())

    await act(async () => {
      await result.current.loadUserConfigs()
    })

    // Cache should be populated
    expect(result.current.userConfigsCache).not.toBeNull()
    expect(result.current.userConfigsCache?.data).toEqual(mockEntries)
  })

  it('returns cached data when cache is valid', async () => {
    const cachedEntries = [
      { key: 'cached', value: 'data', source: { type: 'user', path: '', priority: 1 } },
    ]

    // Pre-populate cache
    useConfigStore.setState({
      userConfigsCache: {
        data: cachedEntries as any,
        timestamp: Date.now(),
      },
    })

    const { result } = renderHook(() => useConfigStore())

    const data = await act(async () => {
      return await result.current.loadUserConfigs()
    })

    // Should return cached data without calling API
    expect(configParser.readAndParseConfig).not.toHaveBeenCalled()
    expect(data).toEqual(cachedEntries)
  })

  it('invalidates user cache correctly', async () => {
    // Pre-populate cache
    useConfigStore.setState({
      userConfigsCache: {
        data: [{ key: 'test', value: 'data', source: { type: 'user', path: '', priority: 1 } }] as any,
        timestamp: Date.now(),
      },
    })

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      result.current.invalidateCache('user')
    })

    expect(result.current.userConfigsCache).toBeNull()
  })

  it('invalidates project cache correctly', async () => {
    // Pre-populate cache
    useConfigStore.setState({
      projectConfigsCache: {
        'default': {
          data: [{ key: 'test', value: 'data', source: { type: 'project', path: '', priority: 2 } }] as any,
          timestamp: Date.now(),
        },
      },
    })

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      result.current.invalidateCache('project')
    })

    expect(result.current.projectConfigsCache['default']).toBeUndefined()
  })

  it('invalidates all caches when no scope specified', async () => {
    // Pre-populate both caches
    useConfigStore.setState({
      userConfigsCache: {
        data: [] as any,
        timestamp: Date.now(),
      },
      projectConfigsCache: {
        'default': {
          data: [] as any,
          timestamp: Date.now(),
        },
      },
    })

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      result.current.invalidateCache()
    })

    expect(result.current.userConfigsCache).toBeNull()
    expect(result.current.projectConfigsCache).toEqual({})
  })

  it('checks cache validity correctly', () => {
    const { result } = renderHook(() => useConfigStore())

    // No cache - should be invalid
    expect(result.current.isCacheValid('user')).toBe(false)

    // Set fresh cache
    act(() => {
      useConfigStore.setState({
        userConfigsCache: {
          data: [],
          timestamp: Date.now(),
        },
      })
    })

    expect(result.current.isCacheValid('user')).toBe(true)

    // Set stale cache (6 minutes old)
    act(() => {
      useConfigStore.setState({
        userConfigsCache: {
          data: [],
          timestamp: Date.now() - 6 * 60 * 1000,
        },
      })
    })

    expect(result.current.isCacheValid('user')).toBe(false)
  })

  it('getConfigsForScope returns cached data or empty array', () => {
    const cachedEntries = [
      { key: 'cached', value: 'data', source: { type: 'user', path: '', priority: 1 } },
    ]

    const { result } = renderHook(() => useConfigStore())

    // No cache - should return empty array
    expect(result.current.getConfigsForScope('user')).toEqual([])

    // Set cache
    act(() => {
      useConfigStore.setState({
        userConfigsCache: {
          data: cachedEntries as any,
          timestamp: Date.now(),
        },
      })
    })

    expect(result.current.getConfigsForScope('user')).toEqual(cachedEntries)
  })

  it('getLastFetchTime returns correct timestamp', () => {
    const { result } = renderHook(() => useConfigStore())
    const now = Date.now()

    // No cache - should return null
    expect(result.current.getLastFetchTime('user')).toBeNull()

    // Set cache
    act(() => {
      useConfigStore.setState({
        userConfigsCache: {
          data: [],
          timestamp: now,
        },
      })
    })

    expect(result.current.getLastFetchTime('user')).toBe(now)
  })

  it('updateConfig updates existing config', () => {
    const { result } = renderHook(() => useConfigStore())

    // Add initial config
    act(() => {
      result.current.updateConfig('testKey', 'initialValue', 'user')
    })

    expect(result.current.configs[0].value).toBe('initialValue')

    // Update same key
    act(() => {
      result.current.updateConfig('testKey', 'updatedValue', 'user')
    })

    expect(result.current.configs).toHaveLength(1)
    expect(result.current.configs[0].value).toBe('updatedValue')
  })

  it('removeConfig removes config by path', () => {
    const { result } = renderHook(() => useConfigStore())

    // Set up configs with paths
    act(() => {
      useConfigStore.setState({
        configs: [
          { key: 'key1', value: 'value1', source: { type: 'user', path: '/path/1', priority: 1 } },
          { key: 'key2', value: 'value2', source: { type: 'user', path: '/path/2', priority: 1 } },
        ] as any,
      })
    })

    act(() => {
      result.current.removeConfig('/path/1')
    })

    expect(result.current.configs).toHaveLength(1)
    expect(result.current.configs[0].key).toBe('key2')
  })
})

describe('ConfigStore - MCP Server Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset stores
    useConfigStore.setState({
      mcpServers: [],
      mcpServersByScope: {
        user: [],
        project: [],
        local: []
      },
      mcpStatusRefreshInterval: null,
      error: null,
    })
  })

  it('loads and categorizes MCP servers by scope', async () => {
    const mockUserConfig = {
      mcpServers: {
        userServer: { type: 'stdio', command: 'python', description: 'User server' }
      }
    }
    const mockProjectConfig = {
      servers: {
        projectServer: { type: 'http', url: 'http://localhost', description: 'Project server' }
      }
    }
    const mockParsedServers = {
      userMcpServers: [
        {
          name: 'userServer',
          type: 'stdio' as const,
          description: 'User server',
          config: { command: 'python' },
          status: 'inactive' as const,
          sourcePath: '/home/user/.claude.json'
        }
      ],
      projectMcpServers: [
        {
          name: 'projectServer',
          type: 'http' as const,
          description: 'Project server',
          config: { url: 'http://localhost' },
          status: 'inactive' as const,
          sourcePath: './.mcp.json'
        }
      ],
      inheritedMcpServers: []
    }

    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>)
      .mockResolvedValueOnce(mockUserConfig)
      .mockResolvedValueOnce(mockProjectConfig)
    ;(configParser.parseMcpServers as MockedFunction<typeof configParser.parseMcpServers>).mockReturnValue(mockParsedServers as any)

    const { result } = renderHook(() => useConfigStore())

    await act(async () => {
      await result.current.updateMcpServers()
    })

    expect(configParser.parseMcpServers).toHaveBeenCalledWith(mockUserConfig, mockProjectConfig)
    expect(result.current.mcpServers).toHaveLength(2)
    expect(result.current.mcpServersByScope.user).toHaveLength(1)
    expect(result.current.mcpServersByScope.project).toHaveLength(1)
    expect(result.current.mcpServersByScope.local).toHaveLength(0)
  })

  it('handles errors when loading MCP servers', async () => {
    ;(configParser.readAndParseConfig as MockedFunction<typeof configParser.readAndParseConfig>)
      .mockRejectedValue(new Error('Failed to read config'))

    const { result } = renderHook(() => useConfigStore())

    await act(async () => {
      await result.current.updateMcpServers()
    })

    expect(result.current.error).toContain('Failed to update MCP servers')
  })

  it('filters MCP servers by source', () => {
    const mockServers = [
      {
        name: 'user-server',
        type: 'stdio' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: '/home/user/.claude.json'
      },
      {
        name: 'project-server',
        type: 'http' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: './.mcp.json'
      },
      {
        name: 'local-server',
        type: 'sse' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: '/local/path/config.json'
      }
    ]

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      useConfigStore.setState({ mcpServers: mockServers as any })
    })

    const userServers = result.current.filterMcpServers({ source: 'user' })
    const projectServers = result.current.filterMcpServers({ source: 'project' })
    const localServers = result.current.filterMcpServers({ source: 'local' })

    expect(userServers).toHaveLength(1)
    expect(userServers[0].name).toBe('user-server')

    expect(projectServers).toHaveLength(1)
    expect(projectServers[0].name).toBe('project-server')

    expect(localServers).toHaveLength(1)
    expect(localServers[0].name).toBe('local-server')
  })

  it('filters MCP servers by type', () => {
    const mockServers = [
      {
        name: 'http-server',
        type: 'http' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: './.mcp.json'
      },
      {
        name: 'stdio-server',
        type: 'stdio' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: './.mcp.json'
      }
    ]

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      useConfigStore.setState({ mcpServers: mockServers as any })
    })

    const httpServers = result.current.filterMcpServers({ type: 'http' })
    const stdioServers = result.current.filterMcpServers({ type: 'stdio' })

    expect(httpServers).toHaveLength(1)
    expect(httpServers[0].name).toBe('http-server')

    expect(stdioServers).toHaveLength(1)
    expect(stdioServers[0].name).toBe('stdio-server')
  })

  it('filters MCP servers by status', () => {
    const mockServers = [
      {
        name: 'active-server',
        type: 'stdio' as const,
        config: {},
        status: 'active' as const,
        sourcePath: './.mcp.json'
      },
      {
        name: 'inactive-server',
        type: 'stdio' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: './.mcp.json'
      }
    ]

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      useConfigStore.setState({ mcpServers: mockServers as any })
    })

    const activeServers = result.current.filterMcpServers({ status: 'active' })
    const inactiveServers = result.current.filterMcpServers({ status: 'inactive' })

    expect(activeServers).toHaveLength(1)
    expect(activeServers[0].name).toBe('active-server')

    expect(inactiveServers).toHaveLength(1)
    expect(inactiveServers[0].name).toBe('inactive-server')
  })

  it('filters MCP servers by search query', () => {
    const mockServers = [
      {
        name: 'filesystem-server',
        type: 'stdio' as const,
        description: 'File system operations',
        config: {},
        status: 'active' as const,
        sourcePath: './.mcp.json'
      },
      {
        name: 'postgres-server',
        type: 'http' as const,
        description: 'PostgreSQL database',
        config: {},
        status: 'inactive' as const,
        sourcePath: './.mcp.json'
      }
    ]

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      useConfigStore.setState({ mcpServers: mockServers as any })
    })

    const fileServers = result.current.filterMcpServers({ search: 'file' })
    const dbServers = result.current.filterMcpServers({ search: 'postgres' })

    expect(fileServers).toHaveLength(1)
    expect(fileServers[0].name).toBe('filesystem-server')

    expect(dbServers).toHaveLength(1)
    expect(dbServers[0].name).toBe('postgres-server')
  })

  it('sorts MCP servers by field and direction', () => {
    const mockServers = [
      {
        name: 'zebra-server',
        type: 'stdio' as const,
        config: {},
        status: 'active' as const,
        sourcePath: './.mcp.json'
      },
      {
        name: 'alpha-server',
        type: 'http' as const,
        config: {},
        status: 'inactive' as const,
        sourcePath: './.mcp.json'
      }
    ]

    const { result } = renderHook(() => useConfigStore())

    act(() => {
      useConfigStore.setState({ mcpServers: mockServers as any })
    })

    const sortedAsc = result.current.sortMcpServers(mockServers as any, { field: 'name', direction: 'asc' })
    const sortedDesc = result.current.sortMcpServers(mockServers as any, { field: 'name', direction: 'desc' })

    expect(sortedAsc[0].name).toBe('alpha-server')
    expect(sortedDesc[0].name).toBe('zebra-server')
  })

  it('starts and stops MCP status refresh interval', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useConfigStore())

    // Start refresh
    act(() => {
      result.current.startMcpStatusRefresh()
    })

    expect(result.current.mcpStatusRefreshInterval).not.toBeNull()

    // Stop refresh
    act(() => {
      result.current.stopMcpStatusRefresh()
    })

    expect(result.current.mcpStatusRefreshInterval).toBeNull()

    vi.useRealTimers()
  })
})
