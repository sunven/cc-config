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
      error: null,
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
