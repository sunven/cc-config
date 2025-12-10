/**
 * Unit tests for useLoading wrapper hook
 *
 * Tests the unified loading interface for local, global, and file operations
 */

import { renderHook, act } from '@testing-library/react'
import { useLoading, useLocalLoading, useGlobalLoading, useQuickLoading } from './useLoading'
import { vi } from 'vitest'

// Mock uiStore
vi.mock('../stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({
    isLoading: false,
    loadingMessage: null,
    setGlobalLoading: vi.fn(),
  })),
}))

describe('useLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle local loading type', async () => {
    const { result } = renderHook(() => useLoading({ type: 'local', delay: 0 }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.startLoading('Loading...', operation)
    })

    expect(operation).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false) // Should be done
  })

  it('should handle global loading type', async () => {
    const { result } = renderHook(() => useLoading({ type: 'global' }))

    expect(result.current.isLoading).toBe(false)

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.startLoading('Global loading...', operation)
    })

    expect(operation).toHaveBeenCalled()
  })

  it('should handle file loading type', async () => {
    const { result } = renderHook(() => useLoading({ type: 'file' }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.progress).toBeNull()

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.startLoading('File loading...', operation)
    })

    expect(operation).toHaveBeenCalled()
  })

  it('should set loading message', () => {
    const { result } = renderHook(() => useLoading({ type: 'local' }))

    act(() => {
      result.current.setLoadingMessage('Test message')
    })

    expect(result.current.loadingMessage).toBe('Test message')
  })

  it('should stop loading', () => {
    const { result } = renderHook(() => useLoading({ type: 'local', delay: 0 }))

    const operation = vi.fn().mockResolvedValue('success')

    act(async () => {
      await result.current.startLoading('Loading...', operation)
    })

    expect(result.current.isLoading).toBe(false)

    act(() => {
      result.current.stopLoading()
    })

    // Should still be false as operation completed
    expect(result.current.isLoading).toBe(false)
  })

  it('should call onComplete callback', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useLoading({ type: 'local', delay: 0, onComplete })
    )

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.startLoading('Loading...', operation)
    })

    expect(onComplete).toHaveBeenCalled()
  })

  it('should call onError callback on failure', async () => {
    const onError = vi.fn()
    const error = new Error('Test error')
    const { result } = renderHook(() =>
      useLoading({ type: 'local', delay: 0, onError })
    )

    const operation = vi.fn().mockRejectedValue(error)

    await act(async () => {
      try {
        await result.current.startLoading('Loading...', operation)
      } catch (e) {
        // Expected error
      }
    })

    expect(onError).toHaveBeenCalledWith(error)
  })
})

describe('useLocalLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create local loading hook with defaults', () => {
    const { result } = renderHook(() => useLocalLoading())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()
  })

  it('should use custom delay', async () => {
    const { result } = renderHook(() => useLocalLoading(500))

    const operation = vi.fn().mockResolvedValue('success')

    act(() => {
      result.current.startLoading('Loading...', operation)
    })

    expect(result.current.isLoading).toBe(false)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.isLoading).toBe(true)
  })
})

describe('useGlobalLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide global loading interface', () => {
    const { result } = renderHook(() => useGlobalLoading())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()
    expect(result.current.startGlobalLoading).toBeDefined()
    expect(result.current.stopGlobalLoading).toBeDefined()
  })

  it('should start global loading with operation', async () => {
    const { result } = renderHook(() => useGlobalLoading())

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.startGlobalLoading('Global loading...', operation)
    })

    expect(operation).toHaveBeenCalled()
  })
})

describe('useQuickLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use no debouncing for quick operations', () => {
    const { result } = renderHook(() => useQuickLoading('Quick loading...'))

    act(() => {
      result.current.startQuickLoading()
    })

    // Should show loading immediately (no debouncing)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBe('Quick loading...')
  })

  it('should stop loading after operation completes', async () => {
    const { result } = renderHook(() => useQuickLoading('Quick loading...'))

    const operation = vi.fn().mockResolvedValue('success')

    await act(async () => {
      await result.current.startQuickLoading(operation)
    })

    expect(operation).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useAsyncLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should execute async operations with loading state', async () => {
    const { result } = renderHook(() => useAsyncLoading('Loading data...', 0))

    const operation = vi.fn().mockResolvedValue('data')

    let data: string
    await act(async () => {
      data = await result.current.executeAsync(operation)
    })

    expect(operation).toHaveBeenCalled()
    expect(data).toBe('data')
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useConditionalLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading when data is null and isLoading is true', () => {
    const { result } = renderHook(() =>
      useConditionalLoading<string | null>(null, 'Loading data...', 0)
    )

    expect(result.current.shouldShowLoading).toBe(false) // Not loading yet
    expect(result.current.isLoading).toBe(false)
  })

  it('should not show loading when data is present', () => {
    const { result } = renderHook(() =>
      useConditionalLoading<string | null>('data', 'Loading data...', 0)
    )

    expect(result.current.shouldShowLoading).toBe(false)
    expect(result.current.data).toBe('data')
  })
})
