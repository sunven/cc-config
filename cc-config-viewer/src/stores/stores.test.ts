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
        isInitialLoading: false,
        isBackgroundLoading: false,
        error: null,
        userConfigsCache: null,
        projectConfigsCache: {},
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

    // HIGH #1 Fix: Additional tests for projectsStore cache functions
    describe('ProjectsStore - Cache Functions', () => {
      beforeEach(() => {
        useProjectsStore.setState({
          projects: [],
          activeProject: null,
          projectConfigsCache: {},
        })
      })

      it('caches project configs correctly', () => {
        const { result } = renderHook(() => useProjectsStore())
        const mockConfigs = [
          { key: 'test', value: 'data', source: { type: 'project' as const, path: '', priority: 2 } },
        ]

        act(() => {
          result.current.cacheProjectConfigs('/test/path', mockConfigs as any)
        })

        expect(result.current.projectConfigsCache['/test/path']).toBeDefined()
        expect(result.current.projectConfigsCache['/test/path'].data).toEqual(mockConfigs)
      })

      it('getProjectConfigs returns cached data', () => {
        const mockConfigs = [
          { key: 'cached', value: 'data', source: { type: 'project' as const, path: '', priority: 2 } },
        ]

        useProjectsStore.setState({
          projectConfigsCache: {
            '/test/path': {
              data: mockConfigs as any,
              timestamp: Date.now(),
            },
          },
        })

        const { result } = renderHook(() => useProjectsStore())
        const cached = result.current.getProjectConfigs('/test/path')

        expect(cached).toEqual(mockConfigs)
      })

      it('getProjectConfigs returns null for non-cached path', () => {
        const { result } = renderHook(() => useProjectsStore())
        const cached = result.current.getProjectConfigs('/non-existent')

        expect(cached).toBeNull()
      })

      it('isProjectCacheValid returns false for non-cached path', () => {
        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.isProjectCacheValid('/non-existent')).toBe(false)
      })

      it('isProjectCacheValid returns true for fresh cache', () => {
        useProjectsStore.setState({
          projectConfigsCache: {
            '/test/path': {
              data: [],
              timestamp: Date.now(),
            },
          },
        })

        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.isProjectCacheValid('/test/path')).toBe(true)
      })

      it('isProjectCacheValid returns false for stale cache', () => {
        useProjectsStore.setState({
          projectConfigsCache: {
            '/test/path': {
              data: [],
              timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes old
            },
          },
        })

        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.isProjectCacheValid('/test/path')).toBe(false)
      })

      it('invalidateProjectCache removes specific project cache', () => {
        useProjectsStore.setState({
          projectConfigsCache: {
            '/path1': { data: [], timestamp: Date.now() },
            '/path2': { data: [], timestamp: Date.now() },
          },
        })

        const { result } = renderHook(() => useProjectsStore())

        act(() => {
          result.current.invalidateProjectCache('/path1')
        })

        expect(result.current.projectConfigsCache['/path1']).toBeUndefined()
        expect(result.current.projectConfigsCache['/path2']).toBeDefined()
      })

      it('invalidateProjectCache clears all project caches when no path specified', () => {
        useProjectsStore.setState({
          projectConfigsCache: {
            '/path1': { data: [], timestamp: Date.now() },
            '/path2': { data: [], timestamp: Date.now() },
          },
        })

        const { result } = renderHook(() => useProjectsStore())

        act(() => {
          result.current.invalidateProjectCache()
        })

        expect(result.current.projectConfigsCache).toEqual({})
      })
    })

    // Story 2.5 - Multi-Project Navigation store tests
    describe('ProjectsStore - Multi-Project Navigation (Story 2.5)', () => {
      beforeEach(() => {
        useProjectsStore.setState({
          projects: [],
          activeProject: null,
          projectConfigsCache: {},
          isLoadingProjects: false,
          projectsError: null,
          sortOrder: 'recency',
        })
      })

      it('has isLoadingProjects state initialized to false', () => {
        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.isLoadingProjects).toBe(false)
      })

      it('has projectsError state initialized to null', () => {
        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.projectsError).toBeNull()
      })

      it('has sortOrder state initialized to recency', () => {
        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.sortOrder).toBe('recency')
      })

      it('loadProjects populates projects array', async () => {
        const { result } = renderHook(() => useProjectsStore())

        await act(async () => {
          await result.current.loadProjects()
        })

        // Should have loaded projects (may be empty if no user config)
        expect(Array.isArray(result.current.projects)).toBe(true)
        expect(result.current.isLoadingProjects).toBe(false)
      })

      it('updateProjectLastAccessed updates project lastAccessed field', () => {
        const testProject = {
          id: 'test-1',
          name: 'Test Project',
          path: '/test/path',
          configPath: '/test/config',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: null,
        }

        useProjectsStore.setState({
          projects: [testProject],
        })

        const { result } = renderHook(() => useProjectsStore())

        act(() => {
          result.current.updateProjectLastAccessed('test-1')
        })

        const updatedProject = result.current.projects.find((p) => p.id === 'test-1')
        expect(updatedProject?.lastAccessed).toBeDefined()
        expect(updatedProject?.lastAccessed).not.toBeNull()
      })

      it('setSortOrder updates sort order', () => {
        const { result } = renderHook(() => useProjectsStore())

        act(() => {
          result.current.setSortOrder('name')
        })

        expect(result.current.sortOrder).toBe('name')

        act(() => {
          result.current.setSortOrder('recency')
        })

        expect(result.current.sortOrder).toBe('recency')
      })

      it('getProjectSummary returns project summary', () => {
        const testProject = {
          id: 'test-1',
          name: 'Test Project',
          path: '/test/path',
          configPath: '/test/config',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: new Date(),
          mcpCount: 3,
          agentCount: 2,
        }

        useProjectsStore.setState({
          projects: [testProject],
        })

        const { result } = renderHook(() => useProjectsStore())
        const summary = result.current.getProjectSummary('test-1')

        expect(summary).not.toBeNull()
        expect(summary?.project.id).toBe('test-1')
        expect(summary?.mcpCount).toBe(3)
        expect(summary?.agentCount).toBe(2)
      })

      it('getProjectSummary returns null for non-existent project', () => {
        const { result } = renderHook(() => useProjectsStore())
        const summary = result.current.getProjectSummary('non-existent')

        expect(summary).toBeNull()
      })

      it('persists lastAccessed to localStorage', () => {
        const testProject = {
          id: 'test-1',
          name: 'Test Project',
          path: '/test/path',
          configPath: '/test/config',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: null,
        }

        useProjectsStore.setState({
          projects: [testProject],
        })

        const { result } = renderHook(() => useProjectsStore())

        act(() => {
          result.current.updateProjectLastAccessed('test-1')
        })

        // Check localStorage was updated
        const stored = localStorage.getItem('cc-config-project-last-accessed')
        expect(stored).toBeDefined()
        const parsed = JSON.parse(stored || '{}')
        expect(parsed['test-1']).toBeDefined()
      })
    })

    // Story 5.2 - Comparison store tests
    describe('ProjectsStore - Comparison (Story 5.2)', () => {
      beforeEach(() => {
        useProjectsStore.setState({
          projects: [],
          activeProject: null,
          projectConfigsCache: {},
          isLoadingProjects: false,
          projectsError: null,
          sortOrder: 'recency',
          comparison: {
            leftProject: null,
            rightProject: null,
            isComparing: false,
            diffResults: [],
            comparisonMode: 'capabilities',
          },
        })
      })

      it('has comparison state initialized correctly', () => {
        const { result } = renderHook(() => useProjectsStore())
        expect(result.current.comparison.leftProject).toBeNull()
        expect(result.current.comparison.rightProject).toBeNull()
        expect(result.current.comparison.isComparing).toBe(false)
        expect(result.current.comparison.diffResults).toEqual([])
        expect(result.current.comparison.comparisonMode).toBe('capabilities')
      })

      it('setComparisonProjects updates comparison state', () => {
        const { result } = renderHook(() => useProjectsStore())
        const leftProject = {
          id: 'left-1',
          name: 'Left Project',
          path: '/left',
          configFileCount: 1,
          lastModified: new Date(),
          configSources: { user: false, project: true, local: false },
        }
        const rightProject = {
          id: 'right-1',
          name: 'Right Project',
          path: '/right',
          configFileCount: 1,
          lastModified: new Date(),
          configSources: { user: false, project: true, local: false },
        }

        act(() => {
          result.current.setComparisonProjects(leftProject, rightProject)
        })

        expect(result.current.comparison.leftProject).toEqual(leftProject)
        expect(result.current.comparison.rightProject).toEqual(rightProject)
        expect(result.current.comparison.isComparing).toBe(true)
        expect(result.current.comparison.diffResults).toEqual([])
      })

      it('clearComparison resets comparison state', () => {
        useProjectsStore.setState({
          comparison: {
            leftProject: { id: 'left' } as any,
            rightProject: { id: 'right' } as any,
            isComparing: true,
            diffResults: [{ capabilityId: 'test', status: 'match', severity: 'low' }],
            comparisonMode: 'capabilities',
          },
        })

        const { result } = renderHook(() => useProjectsStore())

        act(() => {
          result.current.clearComparison()
        })

        expect(result.current.comparison.leftProject).toBeNull()
        expect(result.current.comparison.rightProject).toBeNull()
        expect(result.current.comparison.isComparing).toBe(false)
        expect(result.current.comparison.diffResults).toEqual([])
        expect(result.current.comparison.comparisonMode).toBe('capabilities')
      })

      it('calculateDiff handles missing projects gracefully', async () => {
        const { result } = renderHook(() => useProjectsStore())

        // Don't set any projects
        await act(async () => {
          await result.current.calculateDiff()
        })

        // Should not crash, just log warning
        expect(result.current.comparison.diffResults).toEqual([])
      })
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
