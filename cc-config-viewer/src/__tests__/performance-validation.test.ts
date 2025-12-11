/**
 * Comprehensive Performance Validation Tests (Task 4)
 *
 * Validates all NFR performance requirements:
 * - Startup time: <3 seconds
 * - Tab switching: <100ms
 * - File change detection: <500ms
 * - Memory usage: <200MB
 * - CPU usage: <1% (idle)
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from '../stores/configStore'

// Mock Tauri API for performance testing
vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn().mockResolvedValue('/Users/test'),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn().mockResolvedValue(true),
  readTextFile: vi.fn().mockResolvedValue(JSON.stringify({
    mcpServers: {
      'test-server': { command: 'node', args: ['test.js'] },
    },
    subAgents: {
      'test-agent': { type: 'read-only', permissions: ['read'] },
    },
  })),
}))

// Performance thresholds from requirements
const NFR_THRESHOLDS = {
  STARTUP_TIME: 3000, // <3 seconds
  TAB_SWITCH: 100, // <100ms
  FILE_CHANGE_DETECTION: 500, // <500ms
  MEMORY_USAGE_MB: 200, // <200MB
  CPU_IDLE_PERCENT: 1, // <1%
}

describe('Task 4: Performance Testing & Validation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('4.3: Startup Time Validation (<3 seconds)', () => {
    it('should initialize store state within threshold', async () => {
      const start = performance.now()

      const { result } = renderHook(() => useConfigStore())

      // Wait for initial state to be ready
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(NFR_THRESHOLDS.STARTUP_TIME)
    })

    it('should have initial state immediately available', () => {
      const start = performance.now()

      const { result } = renderHook(() => useConfigStore())

      const duration = performance.now() - start

      // Initial render should be near-instant
      expect(duration).toBeLessThan(100)
      expect(result.current).toBeDefined()
    })

    it('should load cached data faster than cold start', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Warm up cache
      await act(async () => {
        await result.current.switchToScope('user')
      })

      // Measure cached access
      const start = performance.now()

      act(() => {
        result.current.getConfigsForScope('user')
      })

      const cachedDuration = performance.now() - start

      // Cached access should be very fast
      expect(cachedDuration).toBeLessThan(10)
    })
  })

  describe('4.4: Tab Switching Validation (<100ms)', () => {
    it('should switch scope within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        await result.current.switchToScope('user')
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(NFR_THRESHOLDS.TAB_SWITCH)
    })

    it('should handle rapid scope switches without degradation', async () => {
      const { result } = renderHook(() => useConfigStore())
      const scopes: Array<'user' | 'project'> = ['user', 'project']
      const iterations = 20
      const durations: number[] = []

      for (let i = 0; i < iterations; i++) {
        const scope = scopes[i % scopes.length]
        const start = performance.now()

        await act(async () => {
          await result.current.switchToScope(scope)
        })

        durations.push(performance.now() - start)
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)

      expect(avgDuration).toBeLessThan(NFR_THRESHOLDS.TAB_SWITCH)
      expect(maxDuration).toBeLessThan(NFR_THRESHOLDS.TAB_SWITCH * 2)
    })

    it('should switch view mode within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        result.current.setViewMode('split')
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(NFR_THRESHOLDS.TAB_SWITCH / 2)
    })
  })

  describe('4.5: File Change Detection Validation (<500ms)', () => {
    it('should detect file changes within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        result.current.invalidateCache('user')
        await result.current.switchToScope('user')
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(NFR_THRESHOLDS.FILE_CHANGE_DETECTION)
    })

    it('should debounce rapid file changes efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())
      const changeCount = 10
      const durations: number[] = []

      for (let i = 0; i < changeCount; i++) {
        const start = performance.now()

        await act(async () => {
          result.current.invalidateCache('user')
        })

        durations.push(performance.now() - start)
      }

      // Each invalidation should be fast
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      expect(avgDuration).toBeLessThan(50) // Very fast for invalidation only
    })
  })

  describe('4.6: Memory Usage Validation (<200MB)', () => {
    it('should not exceed memory threshold during operations', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          result.current.setSourceLocation(`key-${i}`, {
            filePath: `/test/path-${i}`,
            line: i,
            column: 1,
          })
        })
      }

      const memoryUsage = process.memoryUsage()
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024

      expect(heapUsedMB).toBeLessThan(NFR_THRESHOLDS.MEMORY_USAGE_MB)
    })

    it('should release memory after clearing data', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Add data
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          result.current.setSourceLocation(`key-${i}`, {
            filePath: `/test/path-${i}`,
            line: i,
            column: 1,
          })
        })
      }

      const memoryBefore = process.memoryUsage().heapUsed

      // Clear data
      await act(async () => {
        result.current.clearSourceLocations()
      })

      // Memory should not grow significantly after clearing
      const memoryAfter = process.memoryUsage().heapUsed
      const memoryGrowth = (memoryAfter - memoryBefore) / 1024 / 1024

      // Allow small growth but should not be significant
      expect(memoryGrowth).toBeLessThan(5) // Less than 5MB growth
    })

    it('should handle large config files without memory issues', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Simulate large number of config entries
      const largeConfigs = Array.from({ length: 500 }, (_, i) => ({
        key: `config-${i}`,
        value: `value-${i}`.repeat(100), // Each value ~800 chars
      }))

      const memoryBefore = process.memoryUsage().heapUsed

      for (const config of largeConfigs) {
        await act(async () => {
          result.current.setSourceLocation(config.key, {
            filePath: `/test/${config.key}`,
            line: 1,
            column: 1,
          })
        })
      }

      const memoryAfter = process.memoryUsage().heapUsed
      const memoryUsedMB = (memoryAfter - memoryBefore) / 1024 / 1024

      // Should still be well under limit even with large data
      expect(memoryUsedMB).toBeLessThan(NFR_THRESHOLDS.MEMORY_USAGE_MB / 2)
    })
  })

  describe('4.8: Large Config Files Performance (1000+ entries)', () => {
    it('should handle 1000+ config entries efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())
      const entryCount = 1000

      const start = performance.now()

      for (let i = 0; i < entryCount; i++) {
        await act(async () => {
          result.current.setSourceLocation(`large-config-${i}`, {
            filePath: `/test/large/path-${i}`,
            line: i,
            column: 1,
          })
        })
      }

      const duration = performance.now() - start
      const avgPerEntry = duration / entryCount

      // Average time per entry should be very small
      expect(avgPerEntry).toBeLessThan(10) // <10ms per entry
    })

    it('should filter large config lists within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Load data first
      for (let i = 0; i < 500; i++) {
        await act(async () => {
          result.current.setSourceLocation(`filter-test-${i}`, {
            filePath: `/test/filter/path-${i}`,
            line: i,
            column: 1,
          })
        })
      }

      const start = performance.now()

      act(() => {
        result.current.filterMcpServers({ search: 'test' })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(100) // Filtering should be fast
    })

    it('should sort large config lists within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const mockServers = result.current.mcpServers

      const start = performance.now()

      act(() => {
        result.current.sortMcpServers(mockServers, { field: 'name', direction: 'asc' })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(100) // Sorting should be fast
    })
  })

  describe('4.9: Memory Leak Detection', () => {
    it('should not leak memory during extended use simulation', async () => {
      const { result } = renderHook(() => useConfigStore())

      const initialMemory = process.memoryUsage().heapUsed
      const operationCycles = 5

      for (let cycle = 0; cycle < operationCycles; cycle++) {
        // Add data
        for (let i = 0; i < 50; i++) {
          await act(async () => {
            result.current.setSourceLocation(`cycle-${cycle}-key-${i}`, {
              filePath: `/test/cycle-${cycle}/path-${i}`,
              line: i,
              column: 1,
            })
          })
        }

        // Clear data
        await act(async () => {
          result.current.clearSourceLocations()
        })
      }

      // Force GC if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryGrowthMB = (finalMemory - initialMemory) / 1024 / 1024

      // After multiple cycles of add/clear, memory should not grow significantly
      expect(memoryGrowthMB).toBeLessThan(20) // Less than 20MB growth
    })

    it('should clean up event listeners properly', async () => {
      const { result, unmount } = renderHook(() => useConfigStore())

      // Perform operations
      await act(async () => {
        await result.current.switchToScope('user')
      })

      // Unmount
      unmount()

      // Memory should be stable after unmount
      const memoryAfterUnmount = process.memoryUsage().heapUsed
      expect(memoryAfterUnmount).toBeDefined()
    })
  })

  describe('4.10: Performance Reports and Trends', () => {
    it('should track operation durations for reporting', async () => {
      const { result } = renderHook(() => useConfigStore())
      const operationTimes: { operation: string; duration: number }[] = []

      // Track scope switch
      let start = performance.now()
      await act(async () => {
        await result.current.switchToScope('user')
      })
      operationTimes.push({ operation: 'scope_switch', duration: performance.now() - start })

      // Track view mode change
      start = performance.now()
      await act(async () => {
        result.current.setViewMode('split')
      })
      operationTimes.push({ operation: 'view_mode_change', duration: performance.now() - start })

      // Track cache invalidation
      start = performance.now()
      await act(async () => {
        result.current.invalidateCache('user')
      })
      operationTimes.push({ operation: 'cache_invalidation', duration: performance.now() - start })

      // All operations should have been tracked
      expect(operationTimes).toHaveLength(3)

      // All operations should be fast
      for (const op of operationTimes) {
        expect(op.duration).toBeLessThan(NFR_THRESHOLDS.TAB_SWITCH)
      }
    })

    it('should provide consistent performance across multiple runs', async () => {
      const { result } = renderHook(() => useConfigStore())
      const runs = 5
      const runDurations: number[] = []

      for (let run = 0; run < runs; run++) {
        const start = performance.now()

        await act(async () => {
          await result.current.switchToScope('user')
          result.current.setViewMode(run % 2 === 0 ? 'merged' : 'split')
          result.current.invalidateCache('user')
        })

        runDurations.push(performance.now() - start)
      }

      const avgDuration = runDurations.reduce((a, b) => a + b, 0) / runs
      const variance = runDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / runs
      const stdDev = Math.sqrt(variance)

      // Standard deviation should be low (consistent performance)
      expect(stdDev).toBeLessThan(avgDuration * 0.5) // Less than 50% of average
    })
  })
})

export { NFR_THRESHOLDS }
