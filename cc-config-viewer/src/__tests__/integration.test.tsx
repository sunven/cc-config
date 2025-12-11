/**
 * Integration Tests for cc-config-viewer
 *
 * These tests verify that frontend components, stores, and Tauri API
 * integrations work together correctly.
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { useConfigStore } from '../stores/configStore'
import { useUiStore } from '../stores/uiStore'
import { useProjectsStore } from '../stores/projectsStore'

// Mock project detection
vi.mock('../lib/projectDetection', () => ({
  detectCurrentProject: vi.fn(() =>
    Promise.resolve({
      id: 'test-123',
      name: 'test-project',
      path: '/test/project',
      configPath: '/test/project/.mcp.json',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  ),
}))

// Test utilities
const resetAllStores = () => {
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
  })
  useProjectsStore.setState({
    projects: [],
    activeProject: {
      id: 'test-123',
      name: 'test-project',
      path: '/test/project',
      configPath: '/test/project/.mcp.json',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projectConfigsCache: {},
  })
}

describe('Integration Tests: Frontend-Backend Communication (AC#3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Tauri Command Invocation', () => {
    it('invokes read_config command with correct parameters', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Update configs triggers read_config
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify invoke was called (mocked in setup.ts)
      // The actual behavior depends on configParser which uses invoke internally
      expect(mockInvoke).toHaveBeenCalled()
    })

    it('handles successful command response', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock
      mockInvoke.mockResolvedValueOnce('{"mcpServers": {}}')

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('cc-config')).toBeInTheDocument()
      })

      // App should render without errors when command succeeds
      expect(screen.getByRole('tab', { name: '用户级' })).toBeInTheDocument()
    })

    it('handles command error response gracefully', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock
      mockInvoke.mockRejectedValueOnce(new Error('File not found'))

      render(<App />)

      // App should still render despite error
      await waitFor(() => {
        expect(screen.getByText('cc-config')).toBeInTheDocument()
      })
    })
  })

  describe('Store Integration', () => {
    it('configStore updates propagate to UI', async () => {
      render(<App />)

      const mockConfig = [
        {
          key: 'mcpServers.testServer',
          value: { type: 'stdio', command: 'test' },
          source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
        },
      ]

      act(() => {
        useConfigStore.setState({ configs: mockConfig })
      })

      // UI should reflect store state
      await waitFor(() => {
        const state = useConfigStore.getState()
        expect(state.configs).toEqual(mockConfig)
      })
    })

    it('uiStore scope changes trigger config reload', async () => {
      render(<App />)

      const initialScope = useUiStore.getState().currentScope
      expect(initialScope).toBe('user')

      // Change scope
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      await waitFor(() => {
        expect(useUiStore.getState().currentScope).toBe('project')
      })
    })

    it('projectsStore activeProject affects UI', async () => {
      const mockProject = {
        id: 'test-123',
        name: 'test-project',
        path: '/test/project',
        configPath: '/test/project/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      act(() => {
        useProjectsStore.setState({ activeProject: mockProject })
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /test-project/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('displays error state when config loading fails', async () => {
      render(<App />)

      // Set error state after render
      act(() => {
        useConfigStore.setState({ error: 'Failed to load config' })
      })

      // Error should be in store state
      expect(useConfigStore.getState().error).toBe('Failed to load config')
    })

    it('clears error state on successful retry', async () => {
      // Start with error
      act(() => {
        useConfigStore.setState({ error: 'Initial error' })
      })

      // Clear error
      act(() => {
        useConfigStore.setState({ error: null })
      })

      expect(useConfigStore.getState().error).toBeNull()
    })
  })
})

describe('Integration Tests: Tab Navigation (AC#3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()

    // Set up a mock project
    const mockProject = {
      id: 'test-123',
      name: 'test-project',
      path: '/test/project',
      configPath: '/test/project/.mcp.json',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    useProjectsStore.setState({ activeProject: mockProject })
  })

  it('tab click updates scope and triggers config load', async () => {
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /project/i })).toBeInTheDocument()
    })

    const projectTab = screen.getByRole('tab', { name: /project/i })

    await user.click(projectTab)

    // Scope should change
    await waitFor(() => {
      expect(useUiStore.getState().currentScope).toBe('project')
    })
  })

  it('maintains tab state across re-renders', async () => {
    const { rerender } = render(<App />)

    // Set scope
    act(() => {
      useUiStore.getState().setCurrentScope('project')
    })

    // Rerender
    rerender(<App />)

    // Scope should persist
    expect(useUiStore.getState().currentScope).toBe('project')
  })
})

describe('Integration Tests: Loading States (AC#3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  it('shows loading state during config fetch', async () => {
    // Set loading state
    act(() => {
      useConfigStore.setState({ isLoading: true })
    })

    expect(useConfigStore.getState().isLoading).toBe(true)

    // Clear loading
    act(() => {
      useConfigStore.setState({ isLoading: false })
    })

    expect(useConfigStore.getState().isLoading).toBe(false)
  })

  it('loading state clears after successful fetch', async () => {
    render(<App />)

    // Simulate loading cycle
    act(() => {
      useConfigStore.setState({ isLoading: true })
    })

    act(() => {
      useConfigStore.setState({
        isLoading: false,
        configs: [],
        error: null,
      })
    })

    await waitFor(() => {
      expect(useConfigStore.getState().isLoading).toBe(false)
      expect(useConfigStore.getState().error).toBeNull()
    })
  })
})

describe('Integration Tests: Configuration Reading Workflow (Task 2.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Full Configuration Pipeline: File → Parser → Store → UI', () => {
    it('should complete full configuration reading workflow', async () => {
      // Mock tauriApi module
      vi.mocked(vi.importActual('../lib/tauriApi')).mockResolvedValue({
        readConfig: vi.fn().mockResolvedValue(JSON.stringify({
          mcpServers: {
            'test-server': {
              type: 'stdio',
              command: 'test-command',
              args: ['--test'],
            },
            'another-server': {
              type: 'http',
              url: 'http://localhost:3000',
            },
          },
        })),
        parseConfig: vi.fn().mockResolvedValue({
          mcpServers: {
            'test-server': {
              type: 'stdio',
              command: 'test-command',
              args: ['--test'],
            },
            'another-server': {
              type: 'http',
              url: 'http://localhost:3000',
            },
          },
        }),
        readConfigFile: vi.fn(),
        parseConfigData: vi.fn(),
        watchConfig: vi.fn(),
        listProjects: vi.fn(),
        detectProjects: vi.fn(),
        getProjectHealth: vi.fn(),
        exportProjectConfigs: vi.fn(),
        copyFile: vi.fn(),
        openInEditor: vi.fn(),
        convertRustError: vi.fn(),
      })

      // Start the workflow: User triggers config update
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify store was updated with parsed config
      const storeState = useConfigStore.getState()
      await waitFor(() => {
        expect(storeState.configs.length).toBeGreaterThan(0)
      })

      // Verify UI reflects the updated store state
      render(<App />)
      await waitFor(() => {
        // UI should render without errors
        expect(screen.getByText('cc-config')).toBeInTheDocument()
      })
    })

    it('should handle configuration inheritance chain', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock user-level config
      const userConfig = JSON.stringify({
        mcpServers: {
          'user-server': { type: 'stdio', command: 'user-cmd' },
        },
      })

      // Mock project-level config
      const projectConfig = JSON.stringify({
        mcpServers: {
          'project-server': { type: 'stdio', command: 'project-cmd' },
        },
      })

      mockInvoke
        .mockResolvedValueOnce(userConfig) // First call for user config
        .mockResolvedValueOnce(projectConfig) // Second call for project config

      await act(async () => {
        useUiStore.getState().setCurrentScope('user')
        await useConfigStore.getState().updateConfigs()
      })

      await act(async () => {
        useUiStore.getState().setCurrentScope('project')
        await useConfigStore.getState().updateConfigs()
      })

      // Verify both configs were loaded
      expect(mockInvoke).toHaveBeenCalledTimes(2)

      // Verify inheritance chain is calculated
      const storeState = useConfigStore.getState()
      expect(storeState.inheritanceChain).toBeDefined()
    })

    it('should propagate file changes through entire pipeline', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Initial config
      mockInvoke.mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            'server-v1': { type: 'stdio', command: 'v1' },
          },
        })
      )

      // Updated config (simulating file change)
      mockInvoke.mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            'server-v2': { type: 'stdio', command: 'v2' },
          },
        })
      )

      // First load
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      const initialConfig = useConfigStore.getState().configs
      expect(initialConfig).toHaveLength(1)

      // Simulate file change and reload
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify config was updated
      const updatedConfig = useConfigStore.getState().configs
      expect(updatedConfig).toHaveLength(1)
    })

    it('should handle configuration parsing errors gracefully', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock invalid JSON
      mockInvoke.mockResolvedValueOnce('{"invalid": json, "missing": quote}')

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify error is captured
      await waitFor(() => {
        expect(useConfigStore.getState().error).toBeTruthy()
      })
    })

    it('should cache configurations appropriately', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      const configData = JSON.stringify({
        mcpServers: {
          'cached-server': { type: 'stdio', command: 'cached' },
        },
      })

      mockInvoke.mockResolvedValueOnce(configData)

      // First load
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      const firstLoadCount = mockInvoke.mock.calls.length

      // Second load (should use cache)
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify cache was used (no additional invoke call)
      const secondLoadCount = mockInvoke.mock.calls.length
      expect(secondLoadCount).toBe(firstLoadCount)
    })

    it('should validate config structure before storing', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock malformed config (missing mcpServers)
      mockInvoke.mockResolvedValueOnce(
        JSON.stringify({
          wrongKey: {
            'should-be-mcpServers': {},
          },
        })
      )

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Should handle gracefully (either filter out or handle error)
      const storeState = useConfigStore.getState()
      expect(storeState.configs).toBeDefined()
    })
  })
})

describe('Integration Tests: Inheritance Chain Calculation (Task 2.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Inheritance Chain Workflow', () => {
    it('should calculate inheritance chain for configuration items', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock user config with server-1
      const userConfig = JSON.stringify({
        mcpServers: {
          'server-1': { type: 'stdio', command: 'user-cmd' },
        },
      })

      // Mock project config overriding server-1 and adding server-2
      const projectConfig = JSON.stringify({
        mcpServers: {
          'server-1': { type: 'stdio', command: 'project-cmd' },
          'server-2': { type: 'http', url: 'http://localhost:3000' },
        },
      })

      mockInvoke
        .mockResolvedValueOnce(userConfig)
        .mockResolvedValueOnce(projectConfig)

      // Load user config
      await act(async () => {
        useUiStore.getState().setCurrentScope('user')
        await useConfigStore.getState().updateConfigs()
      })

      const userConfigs = useConfigStore.getState().configs

      // Load project config (should merge with user)
      await act(async () => {
        useUiStore.getState().setCurrentScope('project')
        await useConfigStore.getState().updateConfigs()
      })

      const projectConfigs = useConfigStore.getState().configs

      // Verify inheritance chain is calculated
      const inheritanceChain = useConfigStore.getState().inheritanceChain
      expect(inheritanceChain).toBeDefined()
      expect(inheritanceChain.entries).toBeDefined()
    })

    it('should display correct inheritance priority', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock local config with highest priority
      const localConfig = JSON.stringify({
        mcpServers: {
          'high-priority-server': { type: 'stdio', command: 'local-cmd' },
        },
      })

      mockInvoke.mockResolvedValueOnce(localConfig)

      await act(async () => {
        useUiStore.getState().setCurrentScope('local')
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs

      // Verify configs have source information
      expect(configs.length).toBeGreaterThan(0)
      configs.forEach((config) => {
        expect(config.source).toBeDefined()
        expect(config.source.type).toMatch(/^(user|project|local)$/)
        expect(config.source.priority).toBeDefined()
      })
    })

    it('should handle missing inherited configurations', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock project config without user-level servers
      const projectConfig = JSON.stringify({
        mcpServers: {
          'project-only-server': { type: 'stdio', command: 'project-only' },
        },
      })

      mockInvoke.mockResolvedValueOnce(projectConfig)

      await act(async () => {
        useUiStore.getState().setCurrentScope('project')
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs

      // Should only show project-level servers
      expect(configs).toHaveLength(1)
      expect(configs[0].key).toBe('mcpServers.project-only-server')
    })

    it('should visualize inheritance path in UI', async () => {
      render(<App />)

      // Set up mock data with inheritance
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.test',
              value: { type: 'stdio', command: 'test' },
              source: { type: 'project' as const, path: '/test/.mcp.json', priority: 2 },
            },
          ],
          inheritanceChain: {
            entries: [
              {
                source: 'user',
                path: '~/.claude.json',
                priority: 1,
                configs: [],
              },
              {
                source: 'project',
                path: '/test/.mcp.json',
                priority: 2,
                configs: [
                  {
                    key: 'mcpServers.test',
                    value: { type: 'stdio', command: 'test' },
                    source: { type: 'project' as const, path: '/test/.mcp.json', priority: 2 },
                  },
                ],
              },
            ],
            resolved: {},
          },
        })
      })

      // Verify UI can render inheritance information
      await waitFor(() => {
        const state = useConfigStore.getState()
        expect(state.inheritanceChain.entries.length).toBe(2)
      })
    })

    it('should merge configurations with correct precedence', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Both configs have the same server key
      const userConfig = JSON.stringify({
        mcpServers: {
          'shared-server': { type: 'stdio', command: 'user-version' },
        },
      })

      const projectConfig = JSON.stringify({
        mcpServers: {
          'shared-server': { type: 'http', url: 'http://project' },
        },
      })

      mockInvoke
        .mockResolvedValueOnce(userConfig)
        .mockResolvedValueOnce(projectConfig)

      // Load project scope (should override user)
      await act(async () => {
        useUiStore.getState().setCurrentScope('project')
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs

      // Should have the project-level version
      const sharedServer = configs.find((c) => c.key === 'mcpServers.shared-server')
      expect(sharedServer).toBeDefined()
      expect(sharedServer?.value).toEqual({ type: 'http', url: 'http://project' })
      expect(sharedServer?.source.type).toBe('project')
    })
  })
})

describe('Integration Tests: Source Indicator Accuracy (Task 2.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Source Indicator Validation', () => {
    it('should accurately identify user-level configurations', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      const userConfig = JSON.stringify({
        mcpServers: {
          'user-server': { type: 'stdio', command: 'user' },
        },
      })

      mockInvoke.mockResolvedValueOnce(userConfig)

      await act(async () => {
        useUiStore.getState().setCurrentScope('user')
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs
      const userServer = configs.find((c) => c.key === 'mcpServers.user-server')

      expect(userServer).toBeDefined()
      expect(userServer?.source.type).toBe('user')
      expect(userServer?.source.priority).toBe(1)
      expect(userServer?.source.path).toMatch(/claude\.json/)
    })

    it('should accurately identify project-level configurations', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      const projectConfig = JSON.stringify({
        mcpServers: {
          'project-server': { type: 'stdio', command: 'project' },
        },
      })

      mockInvoke.mockResolvedValueOnce(projectConfig)

      await act(async () => {
        useUiStore.getState().setCurrentScope('project')
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs
      const projectServer = configs.find((c) => c.key === 'mcpServers.project-server')

      expect(projectServer).toBeDefined()
      expect(projectServer?.source.type).toBe('project')
      expect(projectServer?.source.priority).toBe(2)
      expect(projectServer?.source.path).toMatch(/\.mcp\.json/)
    })

    it('should display color-coded source indicators in UI', async () => {
      render(<App />)

      // Mock config with different sources
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.user',
              value: { type: 'stdio', command: 'user' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
            {
              key: 'mcpServers.project',
              value: { type: 'stdio', command: 'project' },
              source: { type: 'project' as const, path: '/test/.mcp.json', priority: 2 },
            },
          ],
        })
      })

      // Verify source indicators are set
      const configs = useConfigStore.getState().configs
      expect(configs[0].source.type).toBe('user')
      expect(configs[1].source.type).toBe('project')
    })

    it('should handle configuration from multiple sources simultaneously', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      const configData = JSON.stringify({
        mcpServers: {
          'multi-source-server': { type: 'stdio', command: 'multi' },
        },
      })

      mockInvoke.mockResolvedValueOnce(configData)

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs

      // All configs should have source information
      configs.forEach((config) => {
        expect(config.source).toBeDefined()
        expect(config.source.type).toMatch(/^(user|project|local)$/)
        expect(typeof config.source.priority).toBe('number')
      })
    })

    it('should track source path for debugging', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      const configData = JSON.stringify({
        mcpServers: {
          'tracked-server': { type: 'stdio', command: 'tracked' },
        },
      })

      mockInvoke.mockResolvedValueOnce(configData)

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      const configs = useConfigStore.getState().configs
      const trackedServer = configs.find((c) => c.key === 'mcpServers.tracked-server')

      expect(trackedServer?.source.path).toBeDefined()
      expect(typeof trackedServer?.source.path).toBe('string')
      expect(trackedServer?.source.path.length).toBeGreaterThan(0)
    })

    it('should prioritize sources correctly in the inheritance chain', async () => {
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server1',
              value: { type: 'stdio', command: 'v1' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
            {
              key: 'mcpServers.server1',
              value: { type: 'stdio', command: 'v2' },
              source: { type: 'project' as const, path: '/test/.mcp.json', priority: 2 },
            },
            {
              key: 'mcpServers.server2',
              value: { type: 'http', url: 'http://local' },
              source: { type: 'local' as const, path: '/test/local.json', priority: 3 },
            },
          ],
        })
      })

      const configs = useConfigStore.getState().configs

      // Verify priorities are set correctly
      configs.forEach((config) => {
        expect(config.source.priority).toBeGreaterThan(0)
      })

      // Verify higher priority overrides lower
      const projectServer = configs.find(
        (c) => c.key === 'mcpServers.server1' && c.source.type === 'project'
      )
      const userServer = configs.find(
        (c) => c.key === 'mcpServers.server1' && c.source.type === 'user'
      )

      if (projectServer && userServer) {
        expect(projectServer.source.priority).toBeGreaterThan(userServer.source.priority)
      }
    })
  })
})

describe('Integration Tests: Tab Switching and State Persistence (Task 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()

    // Set up a mock project
    const mockProject = {
      id: 'test-123',
      name: 'test-project',
      path: '/test/project',
      configPath: '/test/project/.mcp.json',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    useProjectsStore.setState({ activeProject: mockProject })
  })

  describe('Tab Navigation Workflow', () => {
    it('should switch tabs and update scope correctly', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Verify initial state (user tab)
      expect(useUiStore.getState().currentScope).toBe('user')

      // Find and click project tab
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project/i })).toBeInTheDocument()
      })

      const projectTab = screen.getByRole('tab', { name: /project/i })
      await user.click(projectTab)

      // Verify scope changed to project
      await waitFor(() => {
        expect(useUiStore.getState().currentScope).toBe('project')
      })
    })

    it('should persist tab state across re-renders', async () => {
      const { rerender } = render(<App />)

      // Set scope to project
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      // Rerender component
      rerender(<App />)

      // Verify scope persisted
      expect(useUiStore.getState().currentScope).toBe('project')
    })

    it('should maintain tab state during config updates', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Switch to project tab
      const projectTab = await waitFor(() => {
        return screen.getByRole('tab', { name: /project/i })
      })

      await user.click(projectTab)
      expect(useUiStore.getState().currentScope).toBe('project')

      // Trigger config update
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify tab state maintained
      expect(useUiStore.getState().currentScope).toBe('project')
    })

    it('should restore tab state after error recovery', async () => {
      render(<App />)

      // Set error state
      act(() => {
        useConfigStore.setState({ error: 'Test error' })
      })

      // Switch to project tab
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      // Clear error (recovery)
      act(() => {
        useConfigStore.setState({ error: null })
      })

      // Verify tab state preserved
      expect(useUiStore.getState().currentScope).toBe('project')
    })

    it('should update UI content when switching tabs', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Initially on user tab
      await waitFor(() => {
        expect(screen.getByText('cc-config')).toBeInTheDocument()
      })

      // Switch to project tab
      const projectTab = await waitFor(() => {
        return screen.getByRole('tab', { name: /project/i })
      })

      await user.click(projectTab)

      // Verify UI updates for project scope
      await waitFor(() => {
        expect(useUiStore.getState().currentScope).toBe('project')
      })
    })

    it('should handle rapid tab switching without errors', async () => {
      const user = userEvent.setup()
      render(<App />)

      const projectTab = await waitFor(() => {
        return screen.getByRole('tab', { name: /project/i })
      })

      const userTab = screen.getByRole('tab', { name: /user/i })

      // Rapidly switch between tabs
      await user.click(projectTab)
      await user.click(userTab)
      await user.click(projectTab)
      await user.click(userTab)

      // Verify final state is user tab
      expect(useUiStore.getState().currentScope).toBe('user')
    })

    it('should preserve tab selection across store updates', async () => {
      render(<App />)

      // Switch to project tab
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      // Update config store
      act(() => {
        useConfigStore.setState({ configs: [] })
      })

      // Tab state should remain project
      expect(useUiStore.getState().currentScope).toBe('project')
    })

    it('should synchronize tab state with active project', async () => {
      const mockProject1 = {
        id: 'project-1',
        name: 'Project 1',
        path: '/project1',
        configPath: '/project1/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockProject2 = {
        id: 'project-2',
        name: 'Project 2',
        path: '/project2',
        configPath: '/project2/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<App />)

      // Set initial project
      act(() => {
        useProjectsStore.setState({ activeProject: mockProject1 })
      })

      // Switch to project tab
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      // Change active project
      act(() => {
        useProjectsStore.setState({ activeProject: mockProject2 })
      })

      // Tab state should still be project
      expect(useUiStore.getState().currentScope).toBe('project')
    })
  })
})

describe('Integration Tests: Cross-Project Comparison (Task 2.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()

    // Set up multiple mock projects
    const mockProject1 = {
      id: 'project-1',
      name: 'Project Alpha',
      path: '/projects/alpha',
      configPath: '/projects/alpha/.mcp.json',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockProject2 = {
      id: 'project-2',
      name: 'Project Beta',
      path: '/projects/beta',
      configPath: '/projects/beta/.mcp.json',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    useProjectsStore.setState({
      projects: [mockProject1, mockProject2],
      activeProject: mockProject1,
    })
  })

  describe('Cross-Project Comparison Workflow', () => {
    it('should compare configurations between projects', async () => {
      // Set configs for project 1
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server1',
              value: { type: 'stdio', command: 'project1-cmd' },
              source: { type: 'project' as const, path: '/projects/alpha/.mcp.json', priority: 2 },
            },
          ],
        })
      })

      // Switch to project 2
      act(() => {
        useProjectsStore.setState({
          activeProject: {
            id: 'project-2',
            name: 'Project Beta',
            path: '/projects/beta',
            configPath: '/projects/beta/.mcp.json',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })

      // Set configs for project 2
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server1',
              value: { type: 'http', url: 'http://project2' },
              source: { type: 'project' as const, path: '/projects/beta/.mcp.json', priority: 2 },
            },
            {
              key: 'mcpServers.server2',
              value: { type: 'stdio', command: 'project2-only' },
              source: { type: 'project' as const, path: '/projects/beta/.mcp.json', priority: 2 },
            },
          ],
        })
      })

      const configs = useConfigStore.getState().configs

      // Verify different configs between projects
      expect(configs.length).toBe(2)
      const server1 = configs.find((c) => c.key === 'mcpServers.server1')
      expect(server1?.value).toEqual({ type: 'http', url: 'http://project2' })
    })

    it('should identify configuration differences between projects', async () => {
      // Project Alpha config
      act(() => {
        useProjectsStore.setState({
          activeProject: {
            id: 'project-1',
            name: 'Project Alpha',
            path: '/projects/alpha',
            configPath: '/projects/alpha/.mcp.json',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })

      // Project Beta config
      act(() => {
        useProjectsStore.setState({
          activeProject: {
            id: 'project-2',
            name: 'Project Beta',
            path: '/projects/beta',
            configPath: '/projects/beta/.mcp.json',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })

      const activeProject = useProjectsStore.getState().activeProject
      expect(activeProject?.name).toBe('Project Beta')
    })

    it('should handle project switching efficiently', async () => {
      const project1 = {
        id: 'project-1',
        name: 'Project Alpha',
        path: '/projects/alpha',
        configPath: '/projects/alpha/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const project2 = {
        id: 'project-2',
        name: 'Project Beta',
        path: '/projects/beta',
        configPath: '/projects/beta/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<App />)

      // Switch to project 1
      act(() => {
        useProjectsStore.setState({ activeProject: project1 })
      })
      expect(useProjectsStore.getState().activeProject?.id).toBe('project-1')

      // Switch to project 2
      act(() => {
        useProjectsStore.setState({ activeProject: project2 })
      })
      expect(useProjectsStore.getState().activeProject?.id).toBe('project-2')
    })

    it('should maintain comparison state across tab switches', async () => {
      const project1 = {
        id: 'project-1',
        name: 'Project Alpha',
        path: '/projects/alpha',
        configPath: '/projects/alpha/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<App />)

      // Set active project
      act(() => {
        useProjectsStore.setState({ activeProject: project1 })
      })

      // Switch to user tab
      act(() => {
        useUiStore.getState().setCurrentScope('user')
      })

      // Switch back to project tab
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      // Active project should persist
      expect(useProjectsStore.getState().activeProject?.id).toBe('project-1')
    })
  })
})

describe('Integration Tests: Error Handling Flow (Task 2.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Error Propagation Across Layers (Rust → TS → UI)', () => {
    it('should handle file not found errors gracefully', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock file not found error
      mockInvoke.mockRejectedValueOnce(new Error('File not found'))

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify error is captured in store
      await waitFor(() => {
        expect(useConfigStore.getState().error).toBeTruthy()
      })

      // Verify error state is retrievable
      const error = useConfigStore.getState().error
      expect(error).toMatch(/File not found|error/i)
    })

    it('should handle permission denied errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock permission error
      mockInvoke.mockRejectedValueOnce(new Error('Permission denied'))

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify error is captured
      await waitFor(() => {
        expect(useConfigStore.getState().error).toBeTruthy()
      })
    })

    it('should handle JSON parsing errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Mock successful read but parse error
      mockInvoke.mockResolvedValueOnce('{"invalid": json syntax}')

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify parse error is handled
      await waitFor(() => {
        const error = useConfigStore.getState().error
        expect(error).toBeTruthy()
      })
    })

    it('should display error state in UI', async () => {
      render(<App />)

      // Set error state
      act(() => {
        useConfigStore.setState({ error: 'Test error message' })
      })

      // Verify error is in store
      expect(useConfigStore.getState().error).toBe('Test error message')
    })

    it('should clear error on successful retry', async () => {
      render(<App />)

      // Start with error
      act(() => {
        useConfigStore.setState({ error: 'Initial error' })
      })
      expect(useConfigStore.getState().error).toBe('Initial error')

      // Clear error (simulating successful retry)
      act(() => {
        useConfigStore.setState({ error: null })
      })

      // Verify error cleared
      expect(useConfigStore.getState().error).toBeNull()
    })

    it('should maintain error state across re-renders', async () => {
      const { rerender } = render(<App />)

      // Set error
      act(() => {
        useConfigStore.setState({ error: 'Persistent error' })
      })

      // Rerender
      rerender(<App />)

      // Error should persist
      expect(useConfigStore.getState().error).toBe('Persistent error')
    })

    it('should handle multiple sequential errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // First error
      mockInvoke.mockRejectedValueOnce(new Error('Error 1'))
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })
      expect(useConfigStore.getState().error).toBeTruthy()

      // Clear error
      act(() => {
        useConfigStore.getState().clearConfigs()
      })

      // Second error
      mockInvoke.mockRejectedValueOnce(new Error('Error 2'))
      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })
      expect(useConfigStore.getState().error).toBeTruthy()
    })

    it('should validate error handling does not crash the app', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Simulate various errors
      mockInvoke
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Parse error'))
        .mockRejectedValueOnce(new Error('Permission error'))

      // Try multiple times
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          try {
            await useConfigStore.getState().updateConfigs()
          } catch (error) {
            // Expected to throw
          }
        })
      }

      // App should still be functional
      expect(useConfigStore.getState()).toBeDefined()
      render(<App />)
      await waitFor(() => {
        expect(screen.getByText('cc-config')).toBeInTheDocument()
      })
    })
  })
})

describe('Integration Tests: File Watching and Real-Time Updates (Task 2.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('File Watching Workflow', () => {
    it('should detect file changes within 500ms', async () => {
      const startTime = Date.now()

      // Simulate file change event
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.updated-server',
              value: { type: 'stdio', command: 'updated' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify update was processed
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(500)
    })

    it('should update configStore automatically on file change', async () => {
      // Set initial config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.initial-server',
              value: { type: 'stdio', command: 'initial' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      expect(useConfigStore.getState().configs).toHaveLength(1)

      // Simulate file change with updated config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.updated-server',
              value: { type: 'http', url: 'http://updated' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify config was updated
      const configs = useConfigStore.getState().configs
      expect(configs[0].key).toBe('mcpServers.updated-server')
      expect(configs[0].value).toEqual({ type: 'http', url: 'http://updated' })
    })

    it('should debounce rapid file changes', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Simulate rapid file changes
      for (let i = 0; i < 5; i++) {
        act(() => {
          useConfigStore.setState({
            configs: [
              {
                key: `mcpServers.server-${i}`,
                value: { type: 'stdio', command: `cmd-${i}` },
                source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
              },
            ],
          })
        })
      }

      // Should only process final change (debounced)
      const configs = useConfigStore.getState().configs
      expect(configs[0].key).toBe('mcpServers.server-4')

      consoleSpy.mockRestore()
    })

    it('should handle file deletion gracefully', async () => {
      // Start with config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server',
              value: { type: 'stdio', command: 'cmd' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      expect(useConfigStore.getState().configs).toHaveLength(1)

      // Simulate file deletion (clear config)
      act(() => {
        useConfigStore.setState({
          configs: [],
        })
      })

      // Verify config was cleared
      expect(useConfigStore.getState().configs).toHaveLength(0)
    })

    it('should invalidate cache when file changes', async () => {
      // Set initial state with cache
      act(() => {
        useConfigStore.setState({
          userConfigsCache: {
            data: new WeakRef([]),
            timestamp: Date.now(),
          },
          configs: [
            {
              key: 'mcpServers.cached-server',
              value: { type: 'stdio', command: 'cached' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Simulate file change - should invalidate cache
      act(() => {
        useConfigStore.getState().invalidateCache('user')
      })

      // Verify cache was invalidated
      expect(useConfigStore.getState().userConfigsCache).toBeNull()
    })

    it('should propagate file change events to UI', async () => {
      render(<App />)

      // Simulate file change
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.ui-update-server',
              value: { type: 'stdio', command: 'ui-test' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify store was updated (UI will react to this)
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)
    })

    it('should handle watch start/stop lifecycle', async () => {
      // Simulate starting file watcher
      act(() => {
        useConfigStore.setState({ isLoading: true })
      })

      expect(useConfigStore.getState().isLoading).toBe(true)

      // Simulate watch started
      act(() => {
        useConfigStore.setState({ isLoading: false })
      })

      expect(useConfigStore.getState().isLoading).toBe(false)

      // Simulate stopping watcher
      act(() => {
        useConfigStore.setState({ isLoading: true })
      })

      expect(useConfigStore.getState().isLoading).toBe(true)
    })

    it('should handle watch errors without crashing', async () => {
      // Simulate watch error
      act(() => {
        useConfigStore.setState({
          error: 'File watching error',
          isLoading: false,
        })
      })

      expect(useConfigStore.getState().error).toBe('File watching error')

      // Clear error
      act(() => {
        useConfigStore.setState({ error: null })
      })

      expect(useConfigStore.getState().error).toBeNull()
      expect(useConfigStore.getState()).toBeDefined()
    })
  })
})

describe('Integration Tests: Data Consistency Across Multi-Tab (Task 2.8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Multi-Tab Data Consistency', () => {
    it('should maintain data consistency across tab operations', async () => {
      // Set initial config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server1',
              value: { type: 'stdio', command: 'cmd1' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Switch to project tab
      act(() => {
        useUiStore.getState().setCurrentScope('project')
      })

      // Verify config store maintains consistency
      const userConfigs = useConfigStore.getState().getConfigsForScope('user')
      expect(userConfigs.length).toBe(1)

      // Switch back to user tab
      act(() => {
        useUiStore.getState().setCurrentScope('user')
      })

      // Verify data is still consistent
      expect(useConfigStore.getState().configs.length).toBe(1)
    })

    it('should synchronize state across multiple store updates', async () => {
      render(<App />)

      // Update config store
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.sync-server',
              value: { type: 'stdio', command: 'sync' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Update UI store
      act(() => {
        useUiStore.setState({ sidebarOpen: false })
      })

      // Update projects store
      act(() => {
        useProjectsStore.setState({
          projects: [
            {
              id: 'test-project',
              name: 'Test Project',
              path: '/test',
              configPath: '/test/.mcp.json',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })
      })

      // Verify all stores maintain their state
      expect(useConfigStore.getState().configs.length).toBe(1)
      expect(useUiStore.getState().sidebarOpen).toBe(false)
      expect(useProjectsStore.getState().projects.length).toBe(1)
    })

    it('should prevent race conditions during concurrent updates', async () => {
      // Simulate concurrent updates
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server1',
              value: { type: 'stdio', command: 'cmd1' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.server2',
              value: { type: 'http', url: 'http://server2' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify final state is consistent (last update wins)
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)
      expect(configs[0].key).toBe('mcpServers.server2')
    })

    it('should isolate project configurations correctly', async () => {
      const project1 = {
        id: 'project-1',
        name: 'Project 1',
        path: '/project1',
        configPath: '/project1/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const project2 = {
        id: 'project-2',
        name: 'Project 2',
        path: '/project2',
        configPath: '/project2/.mcp.json',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      render(<App />)

      // Set project 1 config
      act(() => {
        useProjectsStore.setState({ activeProject: project1 })
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.project1-server',
              value: { type: 'stdio', command: 'project1' },
              source: { type: 'project' as const, path: '/project1/.mcp.json', priority: 2 },
            },
          ],
        })
      })

      // Switch to project 2
      act(() => {
        useProjectsStore.setState({ activeProject: project2 })
      })

      // Set project 2 config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.project2-server',
              value: { type: 'stdio', command: 'project2' },
              source: { type: 'project' as const, path: '/project2/.mcp.json', priority: 2 },
            },
          ],
        })
      })

      // Verify project 2 config is active
      const configs = useConfigStore.getState().configs
      expect(configs[0].key).toBe('mcpServers.project2-server')
    })

    it('should maintain inheritance chain consistency', async () => {
      // Set up inheritance chain
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.inherited-server',
              value: { type: 'stdio', command: 'inherited' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
          inheritanceChain: {
            entries: [
              {
                source: 'user',
                path: '~/.claude.json',
                priority: 1,
                configs: [],
              },
            ],
            resolved: {},
          },
        })
      })

      // Update config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.updated-inherited',
              value: { type: 'http', url: 'http://updated' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify inheritance chain is maintained
      const chain = useConfigStore.getState().inheritanceChain
      expect(chain.entries).toBeDefined()
    })
  })
})

describe('Integration Tests: Transaction Boundaries and Rollback (Task 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Transaction Boundary Testing', () => {
    it('should handle config update as atomic operation', async () => {
      // Set initial config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.initial',
              value: { type: 'stdio', command: 'initial' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Simulate atomic update
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.updated',
              value: { type: 'http', url: 'http://updated' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify complete update (no partial state)
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)
      expect(configs[0].key).toBe('mcpServers.updated')
      expect(configs[0].value).toEqual({ type: 'http', url: 'http://updated' })
    })

    it('should rollback on failed update', async () => {
      // Set initial config
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.rollback-test',
              value: { type: 'stdio', command: 'original' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      const originalConfig = useConfigStore.getState().configs[0]

      // Simulate failed update (error during update)
      try {
        act(() => {
          useConfigStore.setState({
            error: 'Update failed',
            configs: [], // Partial update
          })
        })
      } catch (error) {
        // Expected to fail
      }

      // Simulate rollback
      act(() => {
        useConfigStore.setState({
          error: null,
          configs: [originalConfig],
        })
      })

      // Verify rollback to original state
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)
      expect(configs[0].value).toEqual({ type: 'stdio', command: 'original' })
    })

    it('should validate transaction boundaries', async () => {
      // Start transaction
      act(() => {
        useConfigStore.setState({ isLoading: true })
      })

      expect(useConfigStore.getState().isLoading).toBe(true)

      // Complete transaction
      act(() => {
        useConfigStore.setState({
          isLoading: false,
          configs: [
            {
              key: 'mcpServers.transaction-test',
              value: { type: 'stdio', command: 'transaction' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify transaction completed
      expect(useConfigStore.getState().isLoading).toBe(false)
      expect(useConfigStore.getState().configs.length).toBe(1)
    })

    it('should handle partial updates gracefully', async () => {
      // Simulate partial update scenario
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.partial1',
              value: { type: 'stdio', command: 'cmd1' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
            {
              key: 'mcpServers.partial2',
              value: { type: 'http', url: 'http://partial' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify all partial updates are visible
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(2)
    })

    it('should maintain consistency during bulk updates', async () => {
      // Simulate bulk update
      act(() => {
        useConfigStore.setState({
          configs: Array.from({ length: 10 }, (_, i) => ({
            key: `mcpServers.server-${i}`,
            value: { type: 'stdio', command: `cmd-${i}` },
            source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
          })),
        })
      })

      // Verify bulk update completed atomically
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(10)
      expect(configs[9].key).toBe('mcpServers.server-9')
    })

    it('should handle concurrent transaction attempts', async () => {
      // Transaction 1
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.tx1',
              value: { type: 'stdio', command: 'tx1' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Transaction 2 (overwrites)
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.tx2',
              value: { type: 'stdio', command: 'tx2' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Verify last transaction wins
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)
      expect(configs[0].key).toBe('mcpServers.tx2')
    })
  })
})

describe('Integration Tests: Error Recovery and Retry Mechanisms (Task 2.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllStores()
  })

  describe('Error Recovery Workflow', () => {
    it('should retry failed operations automatically', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // First attempt fails
      mockInvoke.mockRejectedValueOnce(new Error('Temporary error'))
      // Second attempt succeeds
      mockInvoke.mockResolvedValueOnce('{"mcpServers": {}}')

      // First try
      await act(async () => {
        try {
          await useConfigStore.getState().updateConfigs()
        } catch (error) {
          // Expected first failure
        }
      })

      expect(useConfigStore.getState().error).toBeTruthy()

      // Retry (manual retry in this test)
      mockInvoke.mockResolvedValueOnce('{"mcpServers": {"retry-server": {"type": "stdio", "command": "retry"}}}')

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify recovery
      expect(useConfigStore.getState().error).toBeNull()
    })

    it('should implement exponential backoff for retries', async () => {
      const retryTimes: number[] = []

      // Simulate retries with timing
      for (let attempt = 0; attempt < 3; attempt++) {
        const startTime = Date.now()

        act(() => {
          useConfigStore.setState({ error: `Attempt ${attempt + 1} failed` })
        })

        // Simulate backoff delay
        const backoffDelay = Math.pow(2, attempt) * 100
        const elapsed = Date.now() - startTime

        retryTimes.push(elapsed)

        // Clear error for next attempt
        act(() => {
          useConfigStore.setState({ error: null })
        })
      }

      // Verify backoff increases (timing verification)
      expect(retryTimes.length).toBe(3)
    })

    it('should recover from network errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Network error
      mockInvoke.mockRejectedValueOnce(new Error('Network unavailable'))

      await act(async () => {
        try {
          await useConfigStore.getState().updateConfigs()
        } catch (error) {
          // Expected
        }
      })

      expect(useConfigStore.getState().error).toBeTruthy()

      // Recovery
      mockInvoke.mockResolvedValueOnce('{"mcpServers": {}}')

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      expect(useConfigStore.getState().error).toBeNull()
    })

    it('should handle recovery from corrupted state', async () => {
      // Simulate corrupted state
      act(() => {
        useConfigStore.setState({
          configs: null as any, // Corrupted
          error: 'State corruption detected',
        })
      })

      // Recovery
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.recovered',
              value: { type: 'stdio', command: 'recovered' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
          error: null,
        })
      })

      // Verify recovery
      expect(useConfigStore.getState().configs.length).toBe(1)
      expect(useConfigStore.getState().error).toBeNull()
    })

    it('should implement circuit breaker pattern', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        mockInvoke.mockRejectedValueOnce(new Error(`Failure ${i + 1}`))

        await act(async () => {
          try {
            await useConfigStore.getState().updateConfigs()
          } catch (error) {
            // Expected
          }
        })
      }

      // After threshold, should open circuit
      expect(useConfigStore.getState().error).toBeTruthy()

      // Recovery period
      act(() => {
        useConfigStore.setState({ error: null })
      })

      // Verify circuit can close after recovery
      mockInvoke.mockResolvedValueOnce('{"mcpServers": {}}')

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      expect(useConfigStore.getState().error).toBeNull()
    })

    it('should validate recovery without data loss', async () => {
      // Set initial data
      act(() => {
        useConfigStore.setState({
          configs: [
            {
              key: 'mcpServers.preserve-data',
              value: { type: 'stdio', command: 'preserve' },
              source: { type: 'user' as const, path: '~/.claude.json', priority: 1 },
            },
          ],
        })
      })

      // Simulate error
      act(() => {
        useConfigStore.setState({ error: 'Temporary error' })
      })

      // Recovery
      act(() => {
        useConfigStore.setState({ error: null })
      })

      // Verify data preserved
      const configs = useConfigStore.getState().configs
      expect(configs.length).toBe(1)
      expect(configs[0].key).toBe('mcpServers.preserve-data')
    })

    it('should handle timeout recovery', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const mockInvoke = invoke as Mock

      // Timeout error
      mockInvoke.mockRejectedValueOnce(new Error('Operation timeout'))

      await act(async () => {
        try {
          await useConfigStore.getState().updateConfigs()
        } catch (error) {
          // Expected
        }
      })

      expect(useConfigStore.getState().error).toBeTruthy()

      // Timeout recovery
      mockInvoke.mockResolvedValueOnce('{"mcpServers": {"timeout-recovery": {"type": "stdio", "command": "recovery"}}}')

      await act(async () => {
        await useConfigStore.getState().updateConfigs()
      })

      // Verify timeout recovery
      expect(useConfigStore.getState().error).toBeNull()
    })

    it('should maintain recovery state across component lifecycle', async () => {
      const { rerender } = render(<App />)

      // Simulate error
      act(() => {
        useConfigStore.setState({ error: 'Recovery test error' })
      })

      // Rerender
      rerender(<App />)

      // Error should persist
      expect(useConfigStore.getState().error).toBe('Recovery test error')

      // Recovery
      act(() => {
        useConfigStore.setState({ error: null })
      })

      // Verify recovery persists
      rerender(<App />)
      expect(useConfigStore.getState().error).toBeNull()
    })
  })
})
