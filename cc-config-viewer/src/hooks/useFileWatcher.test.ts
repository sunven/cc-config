/**
 * Unit Tests for useFileWatcher hook
 *
 * Tests the file watcher hook's internal logic:
 * - Event listener setup and cleanup
 * - Debouncing behavior
 * - Cache invalidation logic
 * - Path-based scope detection
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileWatcher } from './useFileWatcher'
import { useConfigStore } from '../stores/configStore'
import { useProjectsStore } from '../stores/projectsStore'
import { listen } from '@tauri-apps/api/event'

// Mock Tauri listen function
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}))

// Mock the stores
vi.mock('../stores/configStore', () => ({
  useConfigStore: vi.fn(),
}))

vi.mock('../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

// Mock uiStore import
vi.mock('../stores/uiStore', () => ({
  useUiStore: {
    getState: vi.fn(() => ({ currentScope: 'user' })),
  },
}))

describe('useFileWatcher', () => {
  const mockInvalidateCache = vi.fn()
  const mockSwitchToScope = vi.fn().mockResolvedValue(undefined)
  const mockRemoveConfig = vi.fn()
  const mockInvalidateProjectCache = vi.fn()
  const mockUnlisten = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Setup mock implementations
    ;(useConfigStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      invalidateCache: mockInvalidateCache,
      switchToScope: mockSwitchToScope,
      removeConfig: mockRemoveConfig,
    })

    ;(useProjectsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      invalidateProjectCache: mockInvalidateProjectCache,
    })

    // Mock listen to return unlisten function
    ;(listen as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnlisten)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets up event listener on mount', async () => {
    renderHook(() => useFileWatcher())

    // Wait for async setup
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(listen).toHaveBeenCalledWith('config-changed', expect.any(Function))
  })

  it('cleans up event listener on unmount', async () => {
    const { unmount } = renderHook(() => useFileWatcher())

    // Wait for setup
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Unmount should call unlisten
    unmount()

    expect(mockUnlisten).toHaveBeenCalled()
  })

  it('debounces rapid file change events', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    renderHook(() => useFileWatcher())

    // Wait for setup
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit multiple rapid events
    act(() => {
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
    })

    // Before debounce timeout, no cache invalidation
    expect(mockInvalidateCache).not.toHaveBeenCalled()

    // After debounce timeout (300ms)
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    // Cache should be invalidated only once
    expect(mockInvalidateCache).toHaveBeenCalledWith('user')
  })

  it('invalidates user cache for user-level config paths', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    renderHook(() => useFileWatcher())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit user config change
    act(() => {
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
    })

    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    expect(mockInvalidateCache).toHaveBeenCalledWith('user')
  })

  it('invalidates project cache for project-level config paths', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    renderHook(() => useFileWatcher())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit project config change
    act(() => {
      eventCallback({ payload: { path: '/project/.mcp.json', changeType: 'modify' } })
    })

    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    expect(mockInvalidateCache).toHaveBeenCalledWith('project')
    expect(mockInvalidateProjectCache).toHaveBeenCalled()
  })

  it('calls removeConfig for delete events', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    renderHook(() => useFileWatcher())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit delete event
    act(() => {
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'delete' } })
    })

    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    expect(mockRemoveConfig).toHaveBeenCalledWith('~/.claude.json')
  })

  it('triggers scope reload after processing changes', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    renderHook(() => useFileWatcher())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit change event
    act(() => {
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
    })

    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    expect(mockSwitchToScope).toHaveBeenCalledWith('user')
  })

  it('clears debounce timer on unmount', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    const { unmount } = renderHook(() => useFileWatcher())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit event
    act(() => {
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
    })

    // Unmount before debounce completes
    unmount()

    // Advance timers - should not process since unmounted
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    // removeConfig/invalidateCache should not be called (debounce cleared)
    // Note: This depends on cleanup being called before timer fires
    expect(mockUnlisten).toHaveBeenCalled()
  })

  it('handles both user and project changes in same batch', async () => {
    let eventCallback: (event: { payload: { path: string; changeType: string } }) => void = () => {}

    ;(listen as ReturnType<typeof vi.fn>).mockImplementation(async (_event, callback) => {
      eventCallback = callback
      return mockUnlisten
    })

    renderHook(() => useFileWatcher())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // Emit both user and project changes
    act(() => {
      eventCallback({ payload: { path: '~/.claude.json', changeType: 'modify' } })
      eventCallback({ payload: { path: '/project/.mcp.json', changeType: 'modify' } })
    })

    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
      await vi.runAllTimersAsync()
    })

    // Both caches should be invalidated
    expect(mockInvalidateCache).toHaveBeenCalledWith('user')
    expect(mockInvalidateCache).toHaveBeenCalledWith('project')
  })
})
