/**
 * Performance Tests
 *
 * Component-level performance testing for critical user interactions
 * Validates scope switching, config loading, and memory usage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from '../stores/configStore'

// Mock Tauri API
vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn().mockResolvedValue('/Users/test'),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn().mockResolvedValue(true),
  readTextFile: vi.fn().mockResolvedValue(JSON.stringify({
    mcpServers: {
      'test-server': { command: 'node', args: ['test.js'] },
    },
  })),
}))

// Performance thresholds
const THRESHOLDS = {
  SCOPE_SWITCH: 100, // <100ms for scope switch
  CONFIG_LOAD: 500, // <500ms for config loading
  STATE_UPDATE: 50, // <50ms for simple state updates
  FILTER_OPERATION: 100, // <100ms for filtering
  VIEW_MODE_SWITCH: 50, // <50ms for view mode switch
}

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Scope Switching Performance', () => {
    it('should switch scope within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        await result.current.switchToScope('user')
      })

      const duration = performance.now() - start

      // Should be well under threshold for cached data
      expect(duration).toBeLessThan(THRESHOLDS.SCOPE_SWITCH)
    })

    it('should handle view mode switch efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        result.current.setViewMode('split')
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.VIEW_MODE_SWITCH)
      expect(result.current.viewMode).toBe('split')
    })

    it('should handle rapid view mode switches without degradation', async () => {
      const { result } = renderHook(() => useConfigStore())
      const modes: Array<'merged' | 'split'> = ['merged', 'split']
      const iterations = 10
      const durations: number[] = []

      for (let i = 0; i < iterations; i++) {
        const mode = modes[i % modes.length]
        const start = performance.now()

        await act(async () => {
          result.current.setViewMode(mode)
        })

        durations.push(performance.now() - start)
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)

      expect(avgDuration).toBeLessThan(THRESHOLDS.VIEW_MODE_SWITCH)
      expect(maxDuration).toBeLessThan(THRESHOLDS.VIEW_MODE_SWITCH * 2)
    })
  })

  describe('Cache Performance', () => {
    it('should invalidate cache efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        result.current.invalidateCache('user')
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
    })

    it('should get configs for scope quickly when cached', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      act(() => {
        result.current.getConfigsForScope('user')
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
    })
  })

  describe('Filter Operation Performance', () => {
    it('should filter MCP servers within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      act(() => {
        result.current.filterMcpServers({ search: 'test' })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.FILTER_OPERATION)
    })

    it('should filter agents within threshold', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      act(() => {
        result.current.filterAgents({ search: '', status: null, type: null, source: null })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.FILTER_OPERATION)
    })
  })

  describe('Sort Operation Performance', () => {
    it('should sort MCP servers efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const mockServers = result.current.mcpServers

      const start = performance.now()

      act(() => {
        result.current.sortMcpServers(mockServers, { field: 'name', direction: 'asc' })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
    })

    it('should sort agents efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const mockAgents = result.current.agents

      const start = performance.now()

      act(() => {
        result.current.sortAgents(mockAgents, { field: 'name', direction: 'asc' })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
    })
  })

  describe('Source Location Performance', () => {
    it('should set source location efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      await act(async () => {
        result.current.setSourceLocation('test-key', {
          filePath: '/test/path',
          line: 1,
          column: 1,
        })
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
    })

    it('should get source location efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      await act(async () => {
        result.current.setSourceLocation('test-key', {
          filePath: '/test/path',
          line: 1,
          column: 1,
        })
      })

      const start = performance.now()

      const location = result.current.getSourceLocation('test-key')

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
      expect(location).toBeDefined()
    })

    it('should clear source locations efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Add multiple locations
      await act(async () => {
        for (let i = 0; i < 100; i++) {
          result.current.setSourceLocation(`key-${i}`, {
            filePath: `/test/path-${i}`,
            line: i,
            column: 1,
          })
        }
      })

      const start = performance.now()

      await act(async () => {
        result.current.clearSourceLocations()
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE * 2)
    })
  })

  describe('Stats Calculation Performance', () => {
    it('should calculate stats efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      act(() => {
        result.current.calculateStatsFromChain()
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.FILTER_OPERATION)
    })

    it('should select stats efficiently', async () => {
      const { result } = renderHook(() => useConfigStore())

      const start = performance.now()

      act(() => {
        result.current.selectStats()
      })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE)
    })
  })

  describe('Memory Management', () => {
    it('should not accumulate memory on repeated operations', async () => {
      const { result } = renderHook(() => useConfigStore())

      // Initial memory baseline
      const initialMemory = process.memoryUsage().heapUsed

      // Perform many operations
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          result.current.setViewMode(i % 2 === 0 ? 'merged' : 'split')
          result.current.setSourceLocation(`key-${i}`, {
            filePath: `/path-${i}`,
            line: i,
            column: 1,
          })
        })
      }

      // Clear locations
      await act(async () => {
        result.current.clearSourceLocations()
      })

      // Force garbage collection hint
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024 // MB

      // Memory growth should be minimal (< 10MB for 50 operations)
      expect(memoryGrowth).toBeLessThan(10)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent source location updates', async () => {
      const { result } = renderHook(() => useConfigStore())

      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        act(async () => {
          result.current.setSourceLocation(`concurrent-${i}`, {
            filePath: `/concurrent/path-${i}`,
            line: i,
            column: 1,
          })
        })
      )

      const start = performance.now()
      await Promise.all(updatePromises)
      const duration = performance.now() - start

      // Concurrent updates should complete in reasonable time
      expect(duration).toBeLessThan(THRESHOLDS.STATE_UPDATE * 10)
    })
  })
})

// Export thresholds for external use
export { THRESHOLDS }
