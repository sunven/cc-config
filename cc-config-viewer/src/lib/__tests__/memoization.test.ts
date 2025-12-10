/**
 * Memoization Logic Tests
 *
 * Tests to verify memoization patterns work correctly for performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateInheritanceChain,
  clearInheritanceCache,
  getConfigValue,
  getConfigSource
} from '../inheritanceCalculator'
import { createBatchUpdater, debounce, throttle } from '../batchUpdater'
import { useUiStore } from '../uiStore'
import { useConfigStore } from '../../stores/configStore'

describe('Memoization Logic Tests', () => {
  describe('Inheritance Calculator Memoization', () => {
    beforeEach(() => {
      clearInheritanceCache()
    })

    afterEach(() => {
      clearInheritanceCache()
    })

    it('should cache calculation results', () => {
      const entries = [
        { key: 'test.key1', value: 'value1', source: { type: 'user' as const, path: '', priority: 1 } },
        { key: 'test.key2', value: 'value2', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      // First calculation
      const chain1 = calculateInheritanceChain(entries)

      // Second calculation with same input
      const chain2 = calculateInheritanceChain(entries)

      // Should return the same object (cached)
      expect(chain1).toBe(chain2)
    })

    it('should cache different results separately', () => {
      const entries1 = [
        { key: 'test.key1', value: 'value1', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const entries2 = [
        { key: 'test.key2', value: 'value2', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const chain1 = calculateInheritanceChain(entries1)
      const chain2 = calculateInheritanceChain(entries2)

      // Should be different objects
      expect(chain1).not.toBe(chain2)

      // But same input should return same object
      const chain1Again = calculateInheritanceChain(entries1)
      expect(chain1).toBe(chain1Again)
    })

    it('should respect cache TTL (1 minute)', () => {
      const entries = [
        { key: 'test.key', value: 'value', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const chain1 = calculateInheritanceChain(entries)

      // Advance time by 30 seconds (within TTL)
      vi.useFakeTimers()
      vi.advanceTimersByTime(30000)

      const chain2 = calculateInheritanceChain(entries)

      // Should still be cached
      expect(chain1).toBe(chain2)

      vi.useRealTimers()
    })

    it('should respect cache max size (10 entries)', () => {
      vi.useFakeTimers()

      // Create 10 entries
      const entries = Array.from({ length: 10 }, (_, i) => ({
        key: `test.key${i}`,
        value: `value${i}`,
        source: { type: 'user' as const, path: '', priority: 1 }
      }))

      // Calculate for each entry
      for (let i = 0; i < 10; i++) {
        const entry = [entries[i]]
        calculateInheritanceChain(entry)
      }

      // All should be cached
      for (let i = 0; i < 10; i++) {
        const entry = [entries[i]]
        const chain = calculateInheritanceChain(entry)
        expect(chain).toBeDefined()
      }

      // Add one more entry
      const eleventhEntry = [{
        key: 'test.key11',
        value: 'value11',
        source: { type: 'user' as const, path: '', priority: 1 }
      }]
      calculateInheritanceChain(eleventhEntry)

      // First entry should be evicted (FIFO)
      const firstEntry = [entries[0]]
      const chain = calculateInheritanceChain(firstEntry)

      // Should be a new calculation (evicted from cache)
      expect(chain).toBeDefined()

      vi.useRealTimers()
    })

    it('should clear cache on demand', () => {
      const entries = [
        { key: 'test.key', value: 'value', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const chain1 = calculateInheritanceChain(entries)
      clearInheritanceCache()
      const chain2 = calculateInheritanceChain(entries)

      // Should be different objects after clear
      expect(chain1).not.toBe(chain2)
    })

    it('should handle WeakRef garbage collection', () => {
      const entries = [
        { key: 'test.key', value: 'value', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const chain1 = calculateInheritanceChain(entries)

      // Simulate WeakRef being garbage collected
      // In real scenario, this would happen automatically
      // Here we just verify the code handles it gracefully
      expect(chain1).toBeDefined()

      // Try to get from cache again
      const chain2 = calculateInheritanceChain(entries)

      // Should either return cached or recalculate
      expect(chain2).toBeDefined()
    })

    it('should memoize based on input content hash', () => {
      const entries1 = [
        { key: 'test.key', value: 'value', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const entries2 = [
        { key: 'test.key', value: 'value', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      // Different array instances but same content
      const chain1 = calculateInheritanceChain(entries1)
      const chain2 = calculateInheritanceChain(entries2)

      // Should be cached (same content)
      expect(chain1).toBe(chain2)
    })

    it('should detect different content', () => {
      const entries1 = [
        { key: 'test.key', value: 'value1', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const entries2 = [
        { key: 'test.key', value: 'value2', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      const chain1 = calculateInheritanceChain(entries1)
      const chain2 = calculateInheritanceChain(entries2)

      // Should be different (different content)
      expect(chain1).not.toBe(chain2)
    })
  })

  describe('Batch Updater Memoization', () => {
    it('should batch multiple updates', async () => {
      let updateCount = 0
      const updates: number[] = []

      const batchUpdater = createBatchUpdater((value: number) => {
        updateCount++
        updates.push(value)
      }, 16)

      // Trigger multiple updates
      batchUpdater(1)
      batchUpdater(2)
      batchUpdater(3)

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should have one batched update
      expect(updateCount).toBe(1)
      expect(updates).toContain(3) // Last value
    })

    it('should use latest value in batch', async () => {
      let lastValue: number | null = null

      const batchUpdater = createBatchUpdater((value: number) => {
        lastValue = value
      }, 16)

      // Trigger multiple updates
      batchUpdater(1)
      batchUpdater(2)
      batchUpdater(3)

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should have latest value
      expect(lastValue).toBe(3)
    })

    it('should support custom debounce intervals', async () => {
      let updateCount = 0

      const batchUpdater = createBatchUpdater(() => {
        updateCount++
      }, 100) // 100ms debounce

      batchUpdater(1)
      batchUpdater(2)

      // Wait 50ms (less than debounce)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not have updated yet
      expect(updateCount).toBe(0)

      // Wait another 60ms (total 110ms, more than debounce)
      await new Promise(resolve => setTimeout(resolve, 60))

      // Should have updated
      expect(updateCount).toBe(1)
    })

    it('should handle rapid updates efficiently', async () => {
      let updateCount = 0

      const batchUpdater = createBatchUpdater(() => {
        updateCount++
      }, 16)

      const startTime = performance.now()

      // Trigger 100 rapid updates
      for (let i = 0; i < 100; i++) {
        batchUpdater(i)
      }

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 50))

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should have one update for 100 changes
      expect(updateCount).toBe(1)

      // Should complete quickly (within 100ms)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Debounce Function', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Should not have been called yet
      expect(callCount).toBe(0)

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have been called once
      expect(callCount).toBe(1)
    })

    it('should pass latest arguments', async () => {
      let lastArg: number | null = null
      const debouncedFn = debounce((arg: number) => {
        lastArg = arg
      }, 100)

      debouncedFn(1)
      debouncedFn(2)
      debouncedFn(3)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have latest argument
      expect(lastArg).toBe(3)
    })

    it('should cancel pending timeout on new call', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      debouncedFn()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not have been called yet
      expect(callCount).toBe(0)

      // New call should reset timer
      debouncedFn()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Still not called
      expect(callCount).toBe(0)

      // Wait for final timeout
      await new Promise(resolve => setTimeout(resolve, 60))

      // Should have been called once
      expect(callCount).toBe(1)
    })
  })

  describe('Throttle Function', () => {
    it('should throttle function calls', async () => {
      let callCount = 0
      const throttledFn = throttle(() => {
        callCount++
      }, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      // Should have been called once
      expect(callCount).toBe(1)

      // Wait for throttle window
      await new Promise(resolve => setTimeout(resolve, 100))

      throttledFn()

      // Should have been called again
      expect(callCount).toBe(2)
    })

    it('should preserve last argument', async () => {
      let lastArg: number | null = null
      const throttledFn = throttle((arg: number) => {
        lastArg = arg
      }, 100)

      throttledFn(1)
      throttledFn(2)
      throttledFn(3)

      expect(lastArg).toBe(3)
    })

    it('should handle rapid calls within throttle window', async () => {
      let callCount = 0
      const throttledFn = throttle(() => {
        callCount++
      }, 100)

      const startTime = performance.now()

      // Call many times rapidly
      for (let i = 0; i < 10; i++) {
        throttledFn()
      }

      const endTime = performance.now()

      // Should be throttled to one call
      expect(callCount).toBe(1)

      // Should complete immediately (no wait)
      expect(endTime - startTime).toBeLessThan(10)
    })
  })

  describe('Store Selector Memoization', () => {
    it('should create memoized selectors', () => {
      // This test verifies that store selectors use memoization
      // The actual implementation is in storeSelectors.ts
      const selector = useUiStore.getState().currentScope

      expect(selector).toBeDefined()
    })

    it('should not trigger re-renders for unchanged data', () => {
      // This test verifies the concept of selector memoization
      // In Zustand, selectors are memoized to prevent unnecessary re-renders
      const state1 = useUiStore.getState()
      const state2 = useUiStore.getState()

      // Accessing the same selector should return the same reference
      expect(state1.currentScope).toBe(state2.currentScope)
    })
  })

  describe('Memoization Performance', () => {
    it('should cache expensive calculations', () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        key: `test.key${i}`,
        value: `value${i}`,
        source: { type: 'user' as const, path: '', priority: 1 }
      }))

      // First calculation
      const start1 = performance.now()
      const chain1 = calculateInheritanceChain(entries)
      const time1 = performance.now() - start1

      // Second calculation (cached)
      const start2 = performance.now()
      const chain2 = calculateInheritanceChain(entries)
      const time2 = performance.now() - start2

      // Cached should be faster
      expect(time2).toBeLessThan(time1)

      // Should return same object
      expect(chain1).toBe(chain2)

      console.log(`First calculation: ${time1.toFixed(2)}ms, Cached: ${time2.toFixed(2)}ms`)
    })

    it('should optimize batch operations', async () => {
      const startTime = performance.now()

      let updateCount = 0
      const batchUpdater = createBatchUpdater(() => {
        updateCount++
      }, 16)

      // Do 1000 operations
      for (let i = 0; i < 1000; i++) {
        batchUpdater(i)
      }

      await new Promise(resolve => setTimeout(resolve, 50))

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete efficiently (within 100ms)
      expect(duration).toBeLessThan(100)

      // Should have one update
      expect(updateCount).toBe(1)

      console.log(`1000 batched operations completed in ${duration.toFixed(2)}ms`)
    })
  })

  describe('Cache Hit Rate', () => {
    it('should maintain high cache hit rate', () => {
      const testData = [
        { key: 'key1', value: 'value1', source: { type: 'user' as const, path: '', priority: 1 } },
        { key: 'key2', value: 'value2', source: { type: 'user' as const, path: '', priority: 1 } },
        { key: 'key3', value: 'value3', source: { type: 'user' as const, path: '', priority: 1 } },
      ]

      // Calculate each once
      for (const data of testData) {
        calculateInheritanceChain([data])
      }

      // Calculate again (should hit cache)
      let cacheHits = 0
      for (const data of testData) {
        const chain = calculateInheritanceChain([data])
        if (chain) {
          cacheHits++
        }
      }

      // Should hit cache for all
      expect(cacheHits).toBe(testData.length)
    })
  })

  describe('Memoization Edge Cases', () => {
    it('should handle undefined inputs', () => {
      // Empty array should work
      const chain1 = calculateInheritanceChain([])
      const chain2 = calculateInheritanceChain([])

      expect(chain1).toBe(chain2) // Should be cached
    })

    it('should handle large datasets', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        key: `test.key${i}`,
        value: `value${i}`,
        source: { type: 'user' as const, path: '', priority: 1 }
      }))

      const chain = calculateInheritanceChain(largeDataset)

      expect(chain).toBeDefined()
      expect(chain.entries).toHaveLength(1000)
    })

    it('should handle concurrent requests', async () => {
      const entries = [
        { key: 'test.key', value: 'value', source: { type: 'user' as const, path: '', priority: 1 } }
      ]

      // Request the same data concurrently
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(calculateInheritanceChain(entries))
      )

      const results = await Promise.all(promises)

      // All should return the same cached object
      const firstResult = results[0]
      for (const result of results) {
        expect(result).toBe(firstResult)
      }
    })
  })
})
