import { useEffect, useRef, useCallback } from 'react'
import { useProjectsStore } from '../stores/projectsStore'

// Auto-refresh interval in milliseconds (30 seconds)
const REFRESH_INTERVAL = 30 * 1000

/**
 * Hook for automatic health refresh
 * Provides 30-second auto-refresh functionality for project health metrics
 */
export function useHealthRefresh(enabled: boolean = true) {
  const {
    dashboard,
    refreshAllProjectHealth,
  } = useProjectsStore()

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Manual refresh function
  const refreshNow = useCallback(async () => {
    await refreshAllProjectHealth()
  }, [refreshAllProjectHealth])

  // Start auto-refresh
  const startAutoRefresh = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Refresh immediately when starting
    await refreshNow()

    // Then set up interval
    intervalRef.current = setInterval(() => {
      refreshNow()
    }, REFRESH_INTERVAL)
  }, [refreshNow])

  // Stop auto-refresh
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      stopAutoRefresh()
    } else {
      startAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  // Set up auto-refresh effect
  useEffect(() => {
    if (enabled) {
      const initAutoRefresh = async () => {
        await startAutoRefresh()
      }
      initAutoRefresh()

      // Cleanup function
      return () => {
        stopAutoRefresh()
      }
    } else {
      stopAutoRefresh()
    }
  }, [enabled, startAutoRefresh, stopAutoRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  // Calculate next refresh time
  const getNextRefreshTime = useCallback(() => {
    if (!intervalRef.current) {
      return null
    }

    // We can't get the exact remaining time from setInterval,
    // so we track it manually
    const now = Date.now()
    const nextRefresh = now + REFRESH_INTERVAL
    return new Date(nextRefresh)
  }, [])

  // Check if auto-refresh is running
  const isAutoRefreshRunning = intervalRef.current !== null

  // Get refresh status
  const getRefreshStatus = useCallback(() => {
    return {
      isAutoRefreshEnabled: enabled,
      isAutoRefreshRunning,
      isManualRefreshing: dashboard.isRefreshing,
      nextRefreshTime: getNextRefreshTime(),
      intervalMs: REFRESH_INTERVAL,
    }
  }, [enabled, isAutoRefreshRunning, dashboard.isRefreshing, getNextRefreshTime])

  return {
    // State
    isAutoRefreshEnabled: enabled,
    isAutoRefreshRunning,
    isRefreshing: dashboard.isRefreshing,

    // Computed
    nextRefreshTime: getNextRefreshTime(),
    refreshStatus: getRefreshStatus(),

    // Actions
    refreshNow,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
  }
}
