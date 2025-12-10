/**
 * Comprehensive Performance Benchmark Test Suite
 *
 * Tests to verify the performance benchmarking suite itself works correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  PerformanceBenchmark,
  PERFORMANCE_THRESHOLDS,
  runPerformanceBenchmarks,
  runBenchmarksForCI,
} from '../performanceBenchmark'

describe('Performance Benchmark Suite', () => {
  let benchmark: PerformanceBenchmark

  beforeEach(() => {
    benchmark = new PerformanceBenchmark()
  })

  afterEach(() => {
    benchmark.clearResults()
  })

  describe('Benchmark Class', () => {
    it('should create benchmark instance', () => {
      expect(benchmark).toBeDefined()
      expect(benchmark).toBeInstanceOf(PerformanceBenchmark)
    })

    it('should run single benchmark', async () => {
      const result = await benchmark.benchmarkCachePerformance()
      expect(result).toBeDefined()
      expect(result.name).toBe('Cache Performance')
      expect(result.unit).toBe('ms')
      expect(typeof result.value).toBe('number')
      expect(typeof result.passed).toBe('boolean')
      expect(result.threshold).toBeGreaterThan(0)
    })

    it('should track results', () => {
      expect(benchmark.getResults()).toHaveLength(0)

      // After running benchmarks, results should be tracked
      // Note: This is tested implicitly in other tests
    })

    it('should clear results', async () => {
      await benchmark.benchmarkCachePerformance()
      expect(benchmark.getResults()).toHaveLength(1)

      benchmark.clearResults()
      expect(benchmark.getResults()).toHaveLength(0)
    })
  })

  describe('Tab Switch Benchmark', () => {
    it('should measure tab switch performance', async () => {
      const result = await benchmark.benchmarkTabSwitch()

      expect(result.name).toBe('Tab Switch Performance')
      expect(result.unit).toBe('ms')
      expect(result.value).toBeGreaterThanOrEqual(0)
      expect(result.passed).toBe(true)  // Should pass by default (no actual tab switching)
    })

    it('should pass threshold for tab switching', async () => {
      const result = await benchmark.benchmarkTabSwitch()

      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(PERFORMANCE_THRESHOLDS.TAB_SWITCH)
    })
  })

  describe('Cache Performance Benchmark', () => {
    it('should measure cache performance', async () => {
      const result = await benchmark.benchmarkCachePerformance()

      expect(result.name).toBe('Cache Performance')
      expect(result.unit).toBe('ms')
      expect(result.value).toBeGreaterThanOrEqual(0)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should complete cache benchmark within threshold', async () => {
      const result = await benchmark.benchmarkCachePerformance()

      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(50)  // 50ms threshold for cache operations
    })
  })

  describe('Memory Usage Benchmark', () => {
    it('should measure memory usage', async () => {
      const result = await benchmark.benchmarkMemoryUsage()

      expect(result.name).toBe('Memory Usage')
      expect(result.unit).toBe('bytes')
      expect(result.value).toBeGreaterThanOrEqual(0)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should pass memory threshold', async () => {
      const result = await benchmark.benchmarkMemoryUsage()

      // Memory should be under 200 MB threshold
      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(PERFORMANCE_THRESHOLDS.MEMORY_USAGE)
    })
  })

  describe('Store Update Benchmark', () => {
    it('should measure store update performance', async () => {
      const result = await benchmark.benchmarkStoreUpdate()

      expect(result.name).toBe('Store Update Performance')
      expect(result.unit).toBe('ms')
      expect(result.value).toBeGreaterThanOrEqual(0)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should handle batch updates efficiently', async () => {
      const result = await benchmark.benchmarkStoreUpdate()

      // Should complete 100 updates within 100ms
      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(100)
    })
  })

  describe('Component Render Benchmark', () => {
    it('should measure component render performance', async () => {
      const result = await benchmark.benchmarkComponentRender()

      expect(result.name).toBe('Component Render Performance')
      expect(result.unit).toBe('ms')
      expect(result.value).toBeGreaterThanOrEqual(0)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should render items efficiently', async () => {
      const result = await benchmark.benchmarkComponentRender()

      // Should render 1000 items within 50ms
      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(50)
    })
  })

  describe('Inheritance Calculation Benchmark', () => {
    it('should measure inheritance calculation performance', async () => {
      const result = await benchmark.benchmarkInheritanceCalculation()

      expect(result.name).toBe('Inheritance Calculation Performance')
      expect(result.unit).toBe('ms')
      expect(result.value).toBeGreaterThanOrEqual(0)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should calculate inheritance efficiently', async () => {
      const result = await benchmark.benchmarkInheritanceCalculation()

      // Should calculate inheritance for 200 configs within 100ms
      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(100)
    })
  })

  describe('Bundle Size Benchmark', () => {
    it('should check bundle size', async () => {
      const result = await benchmark.benchmarkBundleSize()

      expect(result.name).toBe('Bundle Size')
      expect(result.unit).toBe('bytes')
      expect(result.value).toBeGreaterThan(0)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should pass bundle size threshold', async () => {
      const result = await benchmark.benchmarkBundleSize()

      // Should be under 10 MB
      expect(result.value).toBeLessThanOrEqual(result.threshold)
      expect(result.threshold).toBe(10 * 1024 * 1024)
    })
  })

  describe('Full Benchmark Suite', () => {
    it('should run all benchmarks', async () => {
      const suite = await benchmark.runAllBenchmarks()

      expect(suite).toBeDefined()
      expect(suite.name).toBe('Performance Benchmark Suite')
      expect(suite.benchmarks).toBeDefined()
      expect(suite.benchmarks.length).toBeGreaterThan(0)
      expect(suite.summary).toBeDefined()
      expect(typeof suite.summary.total).toBe('number')
      expect(typeof suite.summary.passed).toBe('number')
      expect(typeof suite.summary.failed).toBe('number')
      expect(typeof suite.summary.passRate).toBe('number')
    })

    it('should calculate summary correctly', async () => {
      const suite = await benchmark.runAllBenchmarks()

      expect(suite.summary.total).toBe(suite.benchmarks.length)
      expect(suite.summary.passed + suite.summary.failed).toBe(suite.summary.total)
      expect(suite.summary.passRate).toBe((suite.summary.passed / suite.summary.total) * 100)
    })

    it('should print results without errors', async () => {
      const suite = await benchmark.runAllBenchmarks()

      // Should not throw
      expect(() => benchmark.printResults(suite)).not.toThrow()
    })

    it('should export results to JSON', async () => {
      const suite = await benchmark.runAllBenchmarks()

      const json = benchmark.exportResults(suite)
      expect(json).toBeDefined()
      expect(typeof json).toBe('string')

      const parsed = JSON.parse(json)
      expect(parsed).toEqual(suite)
    })
  })

  describe('Helper Functions', () => {
    it('should run benchmarks with helper function', async () => {
      const suite = await runPerformanceBenchmarks()

      expect(suite).toBeDefined()
      expect(suite.benchmarks.length).toBeGreaterThan(0)
    })

    it('should run benchmarks for CI', async () => {
      const result = await runBenchmarksForCI()

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.suite).toBeDefined()
      expect(typeof result.success).toBe('boolean')
    })
  })

  describe('Performance Thresholds', () => {
    it('should have defined thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.STARTUP_TIME).toBe(3000)
      expect(PERFORMANCE_THRESHOLDS.TAB_SWITCH).toBe(100)
      expect(PERFORMANCE_THRESHOLDS.MEMORY_USAGE).toBe(200 * 1024 * 1024)
      expect(PERFORMANCE_THRESHOLDS.CPU_IDLE).toBe(1)
      expect(PERFORMANCE_THRESHOLDS.FILE_DETECTION).toBe(500)
      expect(PERFORMANCE_THRESHOLDS.MEMORY_GROWTH).toBe(10 * 1024 * 1024)
    })

    it('should have reasonable threshold values', () => {
      // All thresholds should be positive
      Object.values(PERFORMANCE_THRESHOLDS).forEach(value => {
        expect(value).toBeGreaterThan(0)
      })

      // Memory thresholds should be in bytes
      expect(PERFORMANCE_THRESHOLDS.MEMORY_USAGE).toBeGreaterThan(1024 * 1024)
      expect(PERFORMANCE_THRESHOLDS.MEMORY_GROWTH).toBeGreaterThan(1024 * 1024)

      // Time thresholds should be reasonable
      expect(PERFORMANCE_THRESHOLDS.STARTUP_TIME).toBeLessThan(10000)
      expect(PERFORMANCE_THRESHOLDS.TAB_SWITCH).toBeLessThan(1000)
      expect(PERFORMANCE_THRESHOLDS.FILE_DETECTION).toBeLessThan(5000)
    })
  })

  describe('Benchmark Result Validation', () => {
    it('should have valid benchmark results', async () => {
      const suite = await benchmark.runAllBenchmarks()

      suite.benchmarks.forEach(result => {
        expect(result.name).toBeDefined()
        expect(result.name.length).toBeGreaterThan(0)
        expect(result.value).toBeDefined()
        expect(typeof result.value).toBe('number')
        expect(result.value).toBeGreaterThanOrEqual(0)
        expect(result.unit).toBeDefined()
        expect(result.unit.length).toBeGreaterThan(0)
        expect(typeof result.passed).toBe('boolean')
        expect(result.threshold).toBeDefined()
        expect(typeof result.threshold).toBe('number')
        expect(result.threshold).toBeGreaterThan(0)
      })
    })

    it('should handle edge cases gracefully', async () => {
      // Run benchmarks multiple times to ensure consistency
      const suite1 = await benchmark.runAllBenchmarks()
      benchmark.clearResults()
      const suite2 = await benchmark.runAllBenchmarks()

      // Should complete without errors
      expect(suite1).toBeDefined()
      expect(suite2).toBeDefined()
    })
  })
})
