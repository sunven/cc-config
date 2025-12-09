import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHealthRefresh } from '../useHealthRefresh'
import { useProjectsStore } from '../../stores/projectsStore'

// Mock the store
vi.mock('../../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

const mockUseProjectsStore = vi.mocked(useProjectsStore)

describe('useHealthRefresh', () => {
  const mockRefreshAllProjectHealth = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseProjectsStore.mockReturnValue({
      dashboard: {
        isRefreshing: false,
      },
      refreshAllProjectHealth: mockRefreshAllProjectHealth,
    } as any)
  })

  it('calls refresh on mount when enabled', () => {
    renderHook(() => useHealthRefresh(true))

    expect(mockRefreshAllProjectHealth).toHaveBeenCalled()
  })

  it('does not refresh on mount when disabled', () => {
    renderHook(() => useHealthRefresh(false))

    expect(mockRefreshAllProjectHealth).not.toHaveBeenCalled()
  })

  it('returns enabled state', () => {
    const { result } = renderHook(() => useHealthRefresh(true))

    expect(result.current.isAutoRefreshEnabled).toBe(true)
  })

  it('returns disabled state', () => {
    const { result } = renderHook(() => useHealthRefresh(false))

    expect(result.current.isAutoRefreshEnabled).toBe(false)
  })

  it('manually refreshes health', async () => {
    const { result } = renderHook(() => useHealthRefresh(false))

    await act(async () => {
      await result.current.refreshNow()
    })

    expect(mockRefreshAllProjectHealth).toHaveBeenCalled()
  })

  it('updates refresh state when enabling/disabling', () => {
    const { result, rerender } = renderHook(
      (enabled: boolean) => useHealthRefresh(enabled),
      { initialProps: false }
    )

    expect(result.current.isAutoRefreshEnabled).toBe(false)

    // Enable auto-refresh
    rerender(true)

    expect(result.current.isAutoRefreshEnabled).toBe(true)

    // Disable auto-refresh
    rerender(false)

    expect(result.current.isAutoRefreshEnabled).toBe(false)
  })

  it('handles refresh during manual refresh', () => {
    mockUseProjectsStore.mockReturnValue({
      dashboard: {
        isRefreshing: true,
      },
      refreshAllProjectHealth: mockRefreshAllProjectHealth,
    } as any)

    const { result } = renderHook(() => useHealthRefresh(false))

    expect(result.current.isRefreshing).toBe(true)
  })

  it('gets refresh status with enabled', () => {
    const { result } = renderHook(() => useHealthRefresh(true))

    const status = result.current.refreshStatus

    expect(status.isAutoRefreshEnabled).toBe(true)
    expect(status.isManualRefreshing).toBe(false)
    expect(status.intervalMs).toBe(30000)
  })

  it('gets refresh status with disabled', () => {
    const { result } = renderHook(() => useHealthRefresh(false))

    const status = result.current.refreshStatus

    expect(status.isAutoRefreshEnabled).toBe(false)
    expect(status.isManualRefreshing).toBe(false)
    expect(status.intervalMs).toBe(30000)
  })
})

