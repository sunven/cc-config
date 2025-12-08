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
