/**
 * Unit tests for useDebouncedLoading hook
 *
 * Tests the 200ms debouncing threshold and loading state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebouncedLoading } from './useDebouncedLoading'

describe('useDebouncedLoading', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should not show loading immediately without immediate flag', async () => {
    const { result } = renderHook(() => useDebouncedLoading({ delay: 200 }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()

    act(() => {
      result.current.startLoading('Loading...')
    })

    // Loading should not be true yet (debounced)
    expect(result.current.isLoading).toBe(false)

    // After delay, loading should be true
    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBe('Loading...')
  })

  it('should show loading immediately with immediate flag', () => {
    const { result } = renderHook(() =>
      useDebouncedLoading({ delay: 200, immediate: true })
    )

    act(() => {
      result.current.startLoading('Loading...')
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBe('Loading...')
  })

  it('should execute operation and stop loading on success', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useDebouncedLoading({ delay: 200 }))

    let promise: Promise<any>
    act(() => {
      promise = result.current.startLoading('Loading...', operation)
    })

    // Wait for operation to complete
    await act(async () => {
      await promise
    })

    expect(operation).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()
  })

  it('should stop loading on error and call error callback', async () => {
    const error = new Error('Operation failed')
    const operation = jest.fn().mockRejectedValue(error)
    const onError = jest.fn()
    const { result } = renderHook(() =>
      useDebouncedLoading({ delay: 200, onError })
    )

    let promise: Promise<any>
    act(() => {
      promise = result.current.startLoading('Loading...', operation)
    })

    await act(async () => {
      try {
        await promise
      } catch (e) {
        // Expected error
      }
    })

    expect(operation).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should allow manual stopLoading', () => {
    const { result } = renderHook(() => useDebouncedLoading({ delay: 200 }))

    act(() => {
      result.current.startLoading('Loading...')
    })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.stopLoading()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeNull()
  })

  it('should update loading message', () => {
    const { result } = renderHook(() => useDebouncedLoading({ delay: 200 }))

    act(() => {
      result.current.setLoadingMessage('Message 1')
    })

    expect(result.current.loadingMessage).toBe('Message 1')

    act(() => {
      result.current.setLoadingMessage('Message 2')
    })

    expect(result.current.loadingMessage).toBe('Message 2')
  })

  it('should call onComplete callback when provided', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    const onComplete = jest.fn()
    const { result } = renderHook(() =>
      useDebouncedLoading({ delay: 200, onComplete })
    )

    let promise: Promise<any>
    act(() => {
      promise = result.current.startLoading('Loading...', operation)
    })

    await act(async () => {
      await promise
    })

    expect(onComplete).toHaveBeenCalled()
  })

  it('should clear timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebouncedLoading({ delay: 200 }))

    act(() => {
      unmount()
    })

    // Should not throw
    expect(() => {
      jest.advanceTimersByTime(200)
    }).not.toThrow()
  })

  it('should clear existing timeout before setting new one', () => {
    const { result } = renderHook(() => useDebouncedLoading({ delay: 200 }))

    act(() => {
      result.current.startLoading('Loading 1')
    })

    act(() => {
      result.current.startLoading('Loading 2')
    })

    // Should not show loading yet (second timeout active)
    expect(result.current.isLoading).toBe(false)

    // After delay, should show the second message
    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBe('Loading 2')
  })
})

describe('useGlobalDebouncedLoading', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should use uiStore global loading state', () => {
    const { result } = renderHook(() => useGlobalDebouncedLoading(200))

    expect(result.current.isLoading).toBeDefined()
    expect(result.current.loadingMessage).toBeDefined()
  })

  it('should start global loading with message', () => {
    const { result } = renderHook(() => useGlobalDebouncedLoading(200))

    act(() => {
      const startOperation = result.current.startGlobalLoading('Global loading...')
      startOperation()
    })

    // Should not be loading yet (debounced)
    expect(result.current.isLoading).toBe(false)

    act(() => {
      jest.advanceTimersByTime(200)
    })

    // After delay, should be loading
    expect(result.current.isLoading).toBe(true)
  })

  it('should stop global loading', () => {
    const { result } = renderHook(() => useGlobalDebouncedLoading(200))

    act(() => {
      const startOperation = result.current.startGlobalLoading('Global loading...')
      startOperation()
    })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.stopGlobalLoading()
    })

    expect(result.current.isLoading).toBe(false)
  })
})
