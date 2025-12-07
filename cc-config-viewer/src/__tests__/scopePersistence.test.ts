import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Scope Persistence (Story 2.3 - AC#6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('persists scope to localStorage when changed', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    // Change scope to project
    act(() => {
      result.current.setCurrentScope('project')
    })

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled()

    // Check the value stored
    const calls = localStorageMock.setItem.mock.calls
    const lastCall = calls[calls.length - 1]
    if (lastCall) {
      const stored = JSON.parse(lastCall[1])
      expect(stored.state.currentScope).toBe('project')
    }
  })

  it('initializes with user scope as default', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    expect(result.current.currentScope).toBe('user')
  })

  it('persists theme preference along with scope', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorageMock.setItem).toHaveBeenCalled()

    const calls = localStorageMock.setItem.mock.calls
    const lastCall = calls[calls.length - 1]
    if (lastCall) {
      const stored = JSON.parse(lastCall[1])
      expect(stored.state.theme).toBe('dark')
    }
  })

  it('persists sidebarOpen state', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setSidebarOpen(false)
    })

    expect(localStorageMock.setItem).toHaveBeenCalled()

    const calls = localStorageMock.setItem.mock.calls
    const lastCall = calls[calls.length - 1]
    if (lastCall) {
      const stored = JSON.parse(lastCall[1])
      expect(stored.state.sidebarOpen).toBe(false)
    }
  })

  it('uses correct storage key for persistence', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setCurrentScope('project')
    })

    // Check the storage key used
    const calls = localStorageMock.setItem.mock.calls
    const keys = calls.map(call => call[0])
    expect(keys).toContain('cc-config-ui-storage')
  })
})

describe('Edge Cases for Scope Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('handles scope change from user to project', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    expect(result.current.currentScope).toBe('user')

    act(() => {
      result.current.setCurrentScope('project')
    })

    expect(result.current.currentScope).toBe('project')
  })

  it('handles scope change from project to user', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setCurrentScope('project')
    })
    expect(result.current.currentScope).toBe('project')

    act(() => {
      result.current.setCurrentScope('user')
    })
    expect(result.current.currentScope).toBe('user')
  })

  it('does not persist isLoading state', async () => {
    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setLoading(true)
    })

    // isLoading should not be persisted (transient state)
    const calls = localStorageMock.setItem.mock.calls
    const lastCall = calls[calls.length - 1]
    if (lastCall) {
      const stored = JSON.parse(lastCall[1])
      // isLoading should not be in persisted state
      expect(stored.state.isLoading).toBeUndefined()
    }
  })

  it('handles invalid persisted scope gracefully by falling back to user', async () => {
    // Pre-populate localStorage with invalid scope
    localStorageMock.setItem('cc-config-ui-storage', JSON.stringify({
      state: { currentScope: 'invalid-scope', theme: 'light', sidebarOpen: true },
      version: 0
    }))

    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    // Should fallback to 'user' due to merge validation
    expect(result.current.currentScope).toBe('user')
  })

  it('restores valid scope from localStorage on mount', async () => {
    // Pre-populate localStorage with valid project scope
    localStorageMock.setItem('cc-config-ui-storage', JSON.stringify({
      state: { currentScope: 'project', theme: 'dark', sidebarOpen: false },
      version: 0
    }))

    const { useUiStore } = await import('@/stores/uiStore')

    const { result } = renderHook(() => useUiStore())

    // Should restore the valid persisted scope
    expect(result.current.currentScope).toBe('project')
    expect(result.current.theme).toBe('dark')
    expect(result.current.sidebarOpen).toBe(false)
  })
})
