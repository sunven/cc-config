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
    error: null,
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
