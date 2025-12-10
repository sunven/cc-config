/**
 * Memory Profiling Tests
 *
 * Tests memory usage patterns, leak detection, and performance thresholds
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { measureMemory } from '../performanceMonitor'

// Mock performance memory API
const mockPerformanceMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50 MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100 MB
  jsHeapSizeLimit: 500 * 1024 * 1024, // 500 MB
}

describe('Memory Profiling', () => {
  beforeEach(() => {
    // Mock performance.memory API
    Object.defineProperty(globalThis, 'performance', {
      value: {
        memory: mockPerformanceMemory,
        now: vi.fn(() => Date.now()),
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Memory Measurement', () => {
    it('should measure memory usage correctly', () => {
      const memory = measureMemory()

      expect(memory).toBeDefined()
      expect(memory?.usedMB).toBeCloseTo(50, 1)
      expect(memory?.totalMB).toBeCloseTo(100, 1)
      expect(memory?.limitMB).toBeCloseTo(500, 1)
      expect(memory?.usagePercent).toBeCloseTo(10, 1) // (50/500)*100 = 10%
    })

    it('should return null when performance.memory is not available', () => {
      // Remove the memory API
      delete (globalThis as any).performance.memory

      const memory = measureMemory()

      expect(memory).toBeNull()
    })

    it('should handle zero memory usage', () => {
      ;(globalThis as any).performance.memory.usedJSHeapSize = 0

      const memory = measureMemory()

      expect(memory?.usedMB).toBe(0)
      expect(memory?.usagePercent).toBe(0)
    })

    it('should handle near-limit memory usage', () => {
      ;(globalThis as any).performance.memory.usedJSHeapSize = 450 * 1024 * 1024 // 450 MB

      const memory = measureMemory()

      expect(memory?.usedMB).toBeCloseTo(450, 1)
      expect(memory?.usagePercent).toBeCloseTo(90, 1)
    })
  })

  describe('Memory Thresholds', () => {
    beforeEach(() => {
      // Reset mock to default values before each test
      ;(globalThis as any).performance.memory.usedJSHeapSize = 50 * 1024 * 1024
    })

    it('should detect memory usage below warning threshold', () => {
      const memory = measureMemory()

      // 50 MB is below 150 MB warning threshold
      expect(memory?.usedMB).toBeLessThan(150)
      expect(memory?.usagePercent).toBeLessThan(30) // (50/500)*100 = 10%
    })

    it('should detect memory usage above warning threshold', () => {
      // Mock high memory usage
      ;(globalThis as any).performance.memory.usedJSHeapSize = 200 * 1024 * 1024 // 200 MB

      const memory = measureMemory()

      // 200 MB exceeds warning threshold (150 MB)
      expect(memory?.usedMB).toBeGreaterThan(150)
      expect(memory?.usagePercent).toBeGreaterThan(30) // (200/500)*100 = 40%
    })

    it('should detect memory usage above critical threshold', () => {
      // Mock critical memory usage
      ;(globalThis as any).performance.memory.usedJSHeapSize = 250 * 1024 * 1024 // 250 MB

      const memory = measureMemory()

      // 250 MB exceeds critical threshold (200 MB)
      expect(memory?.usedMB).toBeGreaterThan(200)
      expect(memory?.usagePercent).toBeGreaterThanOrEqual(50) // (250/500)*100 = 50%
    })
  })

  describe('Memory Constraints', () => {
    beforeEach(() => {
      // Reset mock to default values before each test
      ;(globalThis as any).performance.memory.usedJSHeapSize = 50 * 1024 * 1024
    })

    it('should validate memory measurements are within limits', () => {
      const memory = measureMemory()

      expect(memory?.usedMB).toBeGreaterThan(0)
      expect(memory?.totalMB).toBeGreaterThanOrEqual(memory?.usedMB || 0)
      expect(memory?.limitMB).toBeGreaterThan(0)
      expect(memory?.usagePercent).toBeGreaterThanOrEqual(0)
      expect(memory?.usagePercent).toBeLessThanOrEqual(100)
    })

    it('should handle zero memory usage', () => {
      ;(globalThis as any).performance.memory.usedJSHeapSize = 0

      const memory = measureMemory()

      expect(memory?.usedMB).toBe(0)
      expect(memory?.usagePercent).toBe(0)
    })

    it('should handle near-limit memory usage', () => {
      ;(globalThis as any).performance.memory.usedJSHeapSize = 450 * 1024 * 1024 // 450 MB

      const memory = measureMemory()

      expect(memory?.usedMB).toBeCloseTo(450, 1)
      expect(memory?.usagePercent).toBeCloseTo(90, 1)
    })
  })

  describe('Memory Performance', () => {
    it('should measure memory quickly', () => {
      const startTime = performance.now()

      measureMemory()

      const duration = performance.now() - startTime

      // Memory measurement should be fast (< 10ms)
      expect(duration).toBeLessThan(10)
    })

    it('should handle memory API errors gracefully', () => {
      // Remove the memory API to simulate it not being available
      vi.spyOn(globalThis as any, 'performance', 'get').mockReturnValue({
        now: Date.now(),
      } as any)

      const memory = measureMemory()

      expect(memory).toBeNull()
    })
  })

  describe('Memory Snapshot', () => {
    it('should create consistent memory snapshots', () => {
      const snapshot1 = measureMemory()
      const snapshot2 = measureMemory()

      expect(snapshot1?.usedMB).toBe(snapshot2?.usedMB)
      expect(snapshot1?.totalMB).toBe(snapshot2?.totalMB)
    })

    it('should provide detailed memory information', () => {
      const memory = measureMemory()

      if (memory) {
        expect(typeof memory.usedMB).toBe('number')
        expect(typeof memory.totalMB).toBe('number')
        expect(typeof memory.limitMB).toBe('number')
        expect(typeof memory.usagePercent).toBe('number')
      }
    })
  })

  describe('Memory Growth Tracking', () => {
    it('should track memory growth over time', () => {
      const measurements: number[] = []

      // Simulate growing memory
      for (let i = 0; i < 5; i++) {
        ;(globalThis as any).performance.memory.usedJSHeapSize = (50 + i * 10) * 1024 * 1024

        const memory = measureMemory()
        if (memory) {
          measurements.push(memory.usedMB)
        }
      }

      // Verify memory grew
      expect(measurements[0]).toBeLessThan(measurements[measurements.length - 1])
      expect(measurements).toHaveLength(5)
    })
  })
})
