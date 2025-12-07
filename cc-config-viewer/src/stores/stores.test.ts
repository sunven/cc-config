import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from './configStore'
import { useProjectsStore } from './projectsStore'
import { useUiStore } from './uiStore'

// Mock the configParser module
vi.mock('../lib/configParser', () => ({
  readAndParseConfig: vi.fn(),
  extractAllEntries: vi.fn(),
  mergeConfigs: vi.fn(),
}))

import { readAndParseConfig, extractAllEntries } from '../lib/configParser'

describe('Zustand Stores', () => {
  describe('ConfigStore', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // Reset ConfigStore state before each test
      useConfigStore.setState({
        configs: [],
        inheritanceChain: { entries: [], resolved: {} },
        isLoading: false,
        error: null,
      })
      // Reset UiStore state
      useUiStore.setState({
        currentScope: 'user',
        isLoading: false,
        sidebarOpen: true,
        theme: 'light',
      })
    })

    it('initializes with empty configs', () => {
      const { result } = renderHook(() => useConfigStore())
      expect(result.current.configs).toEqual([])
    })

    it('initializes with empty inheritanceChain', () => {
      const { result } = renderHook(() => useConfigStore())
      expect(result.current.inheritanceChain.entries).toEqual([])
      expect(result.current.inheritanceChain.resolved).toEqual({})
    })

    it('initializes with isLoading false and error null', () => {
      const { result } = renderHook(() => useConfigStore())
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('updates config entries', () => {
      const { result } = renderHook(() => useConfigStore())

      act(() => {
        result.current.updateConfig('testKey', 'testValue', 'user')
      })
      expect(result.current.configs).toHaveLength(1)
      expect(result.current.configs[0].key).toBe('testKey')
      expect(result.current.configs[0].value).toBe('testValue')
      expect(result.current.configs[0].source.type).toBe('user')
    })

    it('clears configs', () => {
      const { result } = renderHook(() => useConfigStore())

      act(() => {
        result.current.updateConfig('key', 'value', 'user')
      })

      act(() => {
        result.current.clearConfigs()
      })
      expect(result.current.configs).toEqual([])
      expect(result.current.inheritanceChain.entries).toEqual([])
      expect(result.current.inheritanceChain.resolved).toEqual({})
      expect(result.current.error).toBeNull()
    })
  })

  describe('ProjectsStore', () => {
    it('initializes with empty projects', () => {
      const { result } = renderHook(() => useProjectsStore())
      expect(result.current.projects).toEqual([])
    })

    it('initializes with null activeProject', () => {
      const { result } = renderHook(() => useProjectsStore())
      expect(result.current.activeProject).toBeNull()
    })

    it('adds project correctly', () => {
      const { result } = renderHook(() => useProjectsStore())
      const project = {
        id: '1',
        name: 'Test Project',
        path: '/test/path',
        configPath: '/test/config',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      act(() => {
        result.current.addProject(project)
      })
      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0]).toEqual(project)
    })

    it('sets active project', () => {
      const { result } = renderHook(() => useProjectsStore())
      const project = {
        id: '2',
        name: 'Active Project',
        path: '/active/path',
        configPath: '/active/config',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      act(() => {
        result.current.setActiveProject(project)
      })
      expect(result.current.activeProject).toEqual(project)
    })

    it('removes project by id', () => {
      const { result } = renderHook(() => useProjectsStore())

      act(() => {
        result.current.addProject({
          id: '1',
          name: 'Test',
          path: '/test',
          configPath: '/config',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      })

      act(() => {
        result.current.removeProject('1')
      })
      expect(result.current.projects).toHaveLength(0)
    })
  })

  describe('UiStore', () => {
    beforeEach(() => {
      // Reset UiStore state before each test
      useUiStore.setState({
        currentScope: 'user',
        isLoading: false,
        sidebarOpen: true,
        theme: 'light'
      })
    })

    it('initializes with default values', () => {
      const { result } = renderHook(() => useUiStore())
      expect(result.current.currentScope).toBe('user')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.sidebarOpen).toBe(true)
      expect(result.current.theme).toBe('light')
    })

    it('updates current scope', () => {
      const { result } = renderHook(() => useUiStore())

      act(() => {
        result.current.setCurrentScope('project')
      })
      expect(result.current.currentScope).toBe('project')
    })

    it('updates loading state', () => {
      const { result } = renderHook(() => useUiStore())

      act(() => {
        result.current.setLoading(true)
      })
      expect(result.current.isLoading).toBe(true)
    })

    it('updates sidebar open state', () => {
      const { result } = renderHook(() => useUiStore())

      act(() => {
        result.current.setSidebarOpen(false)
      })
      expect(result.current.sidebarOpen).toBe(false)
    })

    it('updates theme', () => {
      const { result } = renderHook(() => useUiStore())

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')
    })

    it('toggles theme', () => {
      const { result } = renderHook(() => useUiStore())

      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
    })
  })

  describe('Integration Tests', () => {
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
      })
    })

    it('loads user config successfully', async () => {
      const mockConfig = {
        mcpServers: {
          server1: { type: 'stdio', command: 'node' },
        },
      }
      const mockEntries = [
        {
          key: 'mcpServers.server1',
          value: { type: 'stdio', command: 'node' },
          source: { type: 'user', path: '~/.claude.json', priority: 1 },
        },
      ]

      ;(readAndParseConfig as MockedFunction<typeof readAndParseConfig>).mockResolvedValue(mockConfig)
      ;(extractAllEntries as MockedFunction<typeof extractAllEntries>).mockReturnValue(mockEntries as any)

      const { result } = renderHook(() => useConfigStore())

      await act(async () => {
        await result.current.updateConfigs()
      })

      expect(readAndParseConfig).toHaveBeenCalledWith('~/.claude.json')
      expect(extractAllEntries).toHaveBeenCalledWith(mockConfig, 'user')
      expect(result.current.configs).toEqual(mockEntries)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('handles config loading errors gracefully', async () => {
      ;(readAndParseConfig as MockedFunction<typeof readAndParseConfig>).mockRejectedValue(
        new Error('File not found')
      )

      const { result } = renderHook(() => useConfigStore())

      await act(async () => {
        await result.current.updateConfigs()
      })

      expect(result.current.configs).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('File not found')
    })

    it.skip('loads project config when scope changes', async () => {
      const mockConfig = {
        setting1: 'project-value',
      }
      const mockEntries = [
        {
          key: 'setting1',
          value: 'project-value',
          source: { type: 'project', path: './.mcp.json', priority: 2 },
        },
      ]

      ;(readAndParseConfig as MockedFunction<typeof readAndParseConfig>).mockResolvedValue(mockConfig)
      ;(extractAllEntries as MockedFunction<typeof extractAllEntries>).mockReturnValue(mockEntries as any)

      const { result: uiResult } = renderHook(() => useUiStore())
      const { result: configResult } = renderHook(() => useConfigStore())

      // Change scope to project
      act(() => {
        uiResult.current.setCurrentScope('project')
      })

      await act(async () => {
        await configResult.current.updateConfigs()
      })

      expect(readAndParseConfig).toHaveBeenCalledWith('./.mcp.json')
      expect(extractAllEntries).toHaveBeenCalledWith(mockConfig, 'project')
      expect(configResult.current.configs).toEqual(mockEntries)
    })

    it('maintains loading state during async operations', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(readAndParseConfig as MockedFunction<typeof readAndParseConfig>).mockReturnValue(promise as any)
      ;(extractAllEntries as MockedFunction<typeof extractAllEntries>).mockReturnValue([])

      const { result } = renderHook(() => useConfigStore())

      // Start loading (don't await yet)
      const updatePromise = result.current.updateConfigs()

      // Wait a tick for loading state to be set
      await new Promise(resolve => setTimeout(resolve, 0))

      // Check loading state is true during operation
      expect(result.current.isLoading).toBe(true)

      // Resolve the promise
      resolvePromise!({})
      await act(async () => {
        await updatePromise
      })

      // Check loading state is false after completion
      expect(result.current.isLoading).toBe(false)
    })
  })
})
