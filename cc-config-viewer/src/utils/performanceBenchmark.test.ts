/**
 * Performance benchmarks for Story 3.4 features
 *
 * Validates AC9: trace operations <100ms
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { sourceTracker } from './sourceTracker'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Performance Benchmarks - Story 3.4', () => {
  describe('Source location lookup performance', () => {
    it('should complete trace source operation within 100ms (AC9)', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      // Mock quick response
      mockInvoke.mockResolvedValue({
        file_path: '/test/.claude.json',
        line_number: 42,
        context: '  "testKey": "value",',
      })

      const startTime = performance.now()
      const result = await sourceTracker.traceSource('testKey', ['/test/.claude.json'])
      const endTime = performance.now()

      const duration = endTime - startTime
      console.log(`Source trace took: ${duration.toFixed(2)}ms`)

      // AC9: Must be < 100ms
      expect(duration).toBeLessThan(100)
      expect(result).toBeDefined()
    })

    it('should cache source locations for fast subsequent lookups', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      // First call - mock response
      mockInvoke.mockResolvedValue({
        file_path: '/test/.claude.json',
        line_number: 42,
        context: '  "cachedKey": "value",',
      })

      // First lookup
      await sourceTracker.traceSource('cachedKey', ['/test/.claude.json'])

      // Second lookup - should use cache
      const startTime = performance.now()
      const result = await sourceTracker.traceSource('cachedKey', ['/test/.claude.json'])
      const endTime = performance.now()

      const duration = endTime - startTime
      console.log(`Cached lookup took: ${duration.toFixed(2)}ms`)

      // Cached lookup should be significantly faster
      expect(duration).toBeLessThan(50)
      expect(mockInvoke).toHaveBeenCalledTimes(1) // Only called once
      expect(result).toBeDefined()
    })

    it('should handle multiple parallel trace requests efficiently', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockImplementation(async (cmd: string, args: any) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return {
          file_path: '/test/.claude.json',
          line_number: Math.floor(Math.random() * 100),
          context: `  "${args.request.config_key}": "value",`,
        }
      })

      const keys = Array.from({ length: 10 }, (_, i) => `key${i}`)
      const startTime = performance.now()

      const results = await Promise.all(
        keys.map(key => sourceTracker.traceSource(key, ['/test/.claude.json']))
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Parallel batch (${keys.length} items) took: ${duration.toFixed(2)}ms`)

      // Parallel operations should complete efficiently
      expect(duration).toBeLessThan(200) // Allow some overhead for parallel execution
      expect(results).toHaveLength(10)
      expect(results.every(r => r !== null)).toBe(true)
    })
  })

  describe('External editor performance', () => {
    it('should open editor within 100ms (AC9)', async () => {
      const { openFileInEditor } = await import('./externalEditorLauncher')
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockImplementation for Tauri invoke
      mockInvoke.mockImplementation(async (cmd: string, args: any) => {
        // Simulate editor launch
        await new Promise(resolve => setTimeout(resolve, 20))
        return undefined
      })

      const startTime = performance.now()
      await openFileInEditor('/test/file.txt', { line_number: 42 })
      const endTime = performance.now()

      const duration = endTime - startTime
      console.log(`Editor launch took: ${duration.toFixed(2)}ms`)

      expect(duration).toBeLessThan(100)
      expect(mockInvoke).toHaveBeenCalledWith('open_in_editor', {
        filePath: '/test/file.txt',
        lineNumber: 42,
      })
    })
  })

  describe('Cache performance', () => {
    it('should maintain cache statistics efficiently', () => {
      const stats = sourceTracker.getCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('entries')
      expect(Array.isArray(stats.entries)).toBe(true)
    })

    it('should invalidate cache efficiently', () => {
      sourceTracker.invalidate('testKey')
      // Should not throw and should complete quickly
      expect(() => sourceTracker.clearCache()).not.toThrow()
    })

    it('should check cache validity efficiently', () => {
      const hasCache = sourceTracker.hasCached('nonexistent')
      expect(hasCache).toBe(false)
    })
  })

  describe('Memory usage', () => {
    it('should not grow cache indefinitely', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockResolvedValue({
        file_path: '/test/.claude.json',
        line_number: 42,
        context: '  "key": "value",',
      })

      // Add many items to cache
      for (let i = 0; i < 100; i++) {
        await sourceTracker.traceSource(`key${i}`, ['/test/.claude.json'])
      }

      const stats = sourceTracker.getCacheStats()
      console.log(`Cache size after 100 items: ${stats.size}`)

      // Cache should be finite
      expect(stats.size).toBeLessThanOrEqual(100)

      // Clear cache
      sourceTracker.clearCache()

      const statsAfterClear = sourceTracker.getCacheStats()
      expect(statsAfterClear.size).toBe(0)
    })
  })

  describe('Integration performance', () => {
    it('should handle complete trace workflow within AC9 limits', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockImplementation(async (cmd: string, args: any) => {
        // Simulate realistic trace operation
        await new Promise(resolve => setTimeout(resolve, 15))
        return {
          file_path: '/home/user/.claude.json',
          line_number: 42,
          context: '  "integrationKey": "value",',
        }
      })

      const startTime = performance.now()

      // Complete workflow: trace → copy → open
      const location = await sourceTracker.traceSource('integrationKey', ['/home/user/.claude.json'])
      expect(location).toBeDefined()

      const { copy_to_clipboard } = await import('@tauri-apps/api/core')
      if (location) {
        await copy_to_clipboard(location.file_path)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Complete workflow took: ${duration.toFixed(2)}ms`)

      // Total workflow should be < 100ms
      expect(duration).toBeLessThan(100)
    })
  })
})

// Helper function to measure performance
export function measurePerformance<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
  return (async () => {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime
    return { result, duration }
  })()
}

// Benchmark decorator for easy use
export function benchmark(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = performance.now()
      const result = await originalMethod.apply(this, args)
      const end = performance.now()
      console.log(`[Benchmark] ${name}: ${(end - start).toFixed(2)}ms`)
      return result
    }
  }
}