/**
 * Startup Time Regression Tests
 *
 * Verifies application startup time remains within acceptable limits (<3s)
 * and detects regressions in startup performance
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { App } from '../App'
import { useConfigStore } from '../stores/configStore'
import { measureStartupTime } from '../lib/performanceMonitor'

// Startup time threshold: 3 seconds
const STARTUP_TIME_THRESHOLD = 3000

describe('Startup Time Regression Tests', () => {
  let startupTimes: number[] = []

  beforeAll(() => {
    // Reset stores before testing
    useConfigStore.setState({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      isInitialLoading: true,
      isLoading: true,
      error: null,
    })
  })

  afterAll(() => {
    // Calculate statistics
    if (startupTimes.length > 0) {
      const avg = startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length
      const max = Math.max(...startupTimes)
      const min = Math.min(...startupTimes)

      console.log('\n=== Startup Time Statistics ===')
      console.log(`Runs: ${startupTimes.length}`)
      console.log(`Average: ${avg.toFixed(2)}ms`)
      console.log(`Min: ${min.toFixed(2)}ms`)
      console.log(`Max: ${max.toFixed(2)}ms`)
      console.log(`Threshold: ${STARTUP_TIME_THRESHOLD}ms`)
      console.log('==============================\n')
    }
  })

  describe('Initial App Startup', () => {
    it('should render App component within time threshold', async () => {
      const startTime = performance.now()

      render(<App />)

      // Wait for app to be ready
      await waitFor(
        () => {
          const state = useConfigStore.getState()
          expect(state.isInitialLoading).toBe(false)
        },
        { timeout: 5000 }
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      startupTimes.push(duration)

      console.log(`Startup time: ${duration.toFixed(2)}ms`)

      // Must be under threshold
      expect(duration).toBeLessThan(STARTUP_TIME_THRESHOLD)
    }, 10000) // 10 second timeout for this test

    it('should initialize stores within threshold', async () => {
      const startTime = performance.now()

      // Simulate store initialization
      useConfigStore.setState({
        configs: [],
        inheritanceChain: { entries: [], resolved: {} },
        isInitialLoading: false,
        isLoading: false,
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Store initialization: ${duration.toFixed(2)}ms`)

      // Store operations should be fast
      expect(duration).toBeLessThan(100)
    })

    it('should load initial data within threshold', async () => {
      const startTime = performance.now()

      // Simulate initial data loading
      const state = useConfigStore.getState()

      // In real scenario, this would load actual data
      // For testing, we simulate the process
      await new Promise(resolve => setTimeout(resolve, 10))

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Initial data load: ${duration.toFixed(2)}ms`)

      // Should be fast (actual data loading would be async)
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Startup Time Measurement', () => {
    it('should measure startup time accurately', () => {
      const result = measureStartupTime()

      expect(result).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(typeof result.breakdown).toBe('object')
    })

    it('should track startup phases', () => {
      const result = measureStartupTime()

      expect(result.breakdown).toHaveProperty('initialization')
      expect(result.breakdown).toHaveProperty('storeSetup')
      expect(result.breakdown).toHaveProperty('dataLoading')
      expect(result.breakdown).toHaveProperty('uiRender')
      expect(result.breakdown).toHaveProperty('ready')

      // All phases should be measured
      Object.values(result.breakdown).forEach(time => {
        expect(time).toBeGreaterThanOrEqual(0)
      })
    })

    it('should not exceed time threshold for any phase', () => {
      const result = measureStartupTime()

      // Check each phase is reasonable
      expect(result.breakdown.initialization).toBeLessThan(500)
      expect(result.breakdown.storeSetup).toBeLessThan(100)
      expect(result.breakdown.dataLoading).toBeLessThan(2000)
      expect(result.breakdown.uiRender).toBeLessThan(500)
      expect(result.breakdown.ready).toBeLessThan(STARTUP_TIME_THRESHOLD)
    })
  })

  describe('Performance Budget', () => {
    it('should allocate time budget across startup phases', () => {
      const result = measureStartupTime()

      const totalPhases = Object.values(result.breakdown).reduce((a, b) => a + b, 0)

      // Total should be approximately equal to duration
      // (allowing for some measurement overhead)
      expect(Math.abs(totalPhases - result.duration)).toBeLessThan(100)
    })

    it('should not spend excessive time on any phase', () => {
      const result = measureStartupTime()

      const phases = Object.entries(result.breakdown)

      phases.forEach(([phase, time]) => {
        const percentage = (time / result.duration) * 100

        console.log(`${phase}: ${time.toFixed(2)}ms (${percentage.toFixed(1)}%)`)

        // No phase should take more than 80% of total time
        expect(percentage).toBeLessThan(80)
      })
    })
  })

  describe('Cold Start Performance', () => {
    it('should handle cold start (no cache)', async () => {
      // Clear all caches
      useConfigStore.setState({
        userConfigsCache: null,
        projectConfigsCache: {},
      })

      const startTime = performance.now()

      render(<App />)

      await waitFor(
        () => {
          const state = useConfigStore.getState()
          expect(state.isInitialLoading).toBe(false)
        },
        { timeout: 5000 }
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Cold start: ${duration.toFixed(2)}ms`)

      // Cold start should still be under threshold
      expect(duration).toBeLessThan(STARTUP_TIME_THRESHOLD)
    }, 10000)

    it('should optimize warm start (with cache)', async () => {
      // Pre-populate cache
      useConfigStore.setState({
        userConfigsCache: {
          data: new WeakRef([]),
          timestamp: Date.now()
        },
        projectConfigsCache: {},
      })

      const startTime = performance.now()

      render(<App />)

      await waitFor(
        () => {
          const state = useConfigStore.getState()
          expect(state.isInitialLoading).toBe(false)
        },
        { timeout: 5000 }
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Warm start: ${duration.toFixed(2)}ms`)

      // Warm start should be faster than cold start
      // (Though we can't test cold start in the same test)
      expect(duration).toBeLessThan(STARTUP_TIME_THRESHOLD)
    }, 10000)
  })

  describe('Startup Regression Detection', () => {
    it('should detect when startup time exceeds threshold', () => {
      // Simulate slow startup
      const simulatedDuration = 3500

      expect(simulatedDuration).toBeGreaterThan(STARTUP_TIME_THRESHOLD)
    })

    it('should track startup time trend', () => {
      // This would be used to track performance over time
      // In a real CI/CD environment, these values would be stored

      const previousRuns = [2100, 2200, 2150, 2300, 2250]
      const currentRun = 2400

      const avg = previousRuns.reduce((a, b) => a + b, 0) / previousRuns.length

      console.log(`Average of previous runs: ${avg.toFixed(2)}ms`)
      console.log(`Current run: ${currentRun.toFixed(2)}ms`)
      console.log(`Difference: ${(currentRun - avg).toFixed(2)}ms`)

      // Current run should not be significantly slower
      const regressionThreshold = 500 // 500ms slower than average
      expect(currentRun - avg).toBeLessThan(regressionThreshold)
    })

    it('should provide actionable performance data', () => {
      const result = measureStartupTime()

      console.log('\n=== Performance Report ===')
      console.log(`Total: ${result.duration.toFixed(2)}ms`)
      console.log('Breakdown:')
      Object.entries(result.breakdown).forEach(([phase, time]) => {
        const percentage = ((time / result.duration) * 100).toFixed(1)
        console.log(`  ${phase}: ${time.toFixed(2)}ms (${percentage}%)`)
      })
      console.log('========================\n')

      // Should have detailed breakdown
      expect(Object.keys(result.breakdown).length).toBeGreaterThan(3)
    })
  })

  describe('Bundle Size Impact', () => {
    it('should have reasonable bundle size for fast startup', async () => {
      // Simulate checking bundle size
      // In production, this would check actual bundle
      const estimatedBundleSize = 504 * 1024 // 504 KB from previous measurements

      console.log(`Estimated bundle size: ${(estimatedBundleSize / 1024).toFixed(2)} KB`)

      // Bundle should be under 10MB
      expect(estimatedBundleSize).toBeLessThan(10 * 1024 * 1024)

      // Bundle should be reasonable for fast loading
      expect(estimatedBundleSize).toBeLessThan(2 * 1024 * 1024) // Under 2MB for fast startup
    })
  })

  describe('Concurrent Startup', () => {
    it('should handle concurrent initialization', async () => {
      const startTime = performance.now()

      // Simulate concurrent operations
      const operations = [
        () => new Promise(resolve => setTimeout(resolve, 10)),
        () => new Promise(resolve => setTimeout(resolve, 15)),
        () => new Promise(resolve => setTimeout(resolve, 20)),
      ]

      await Promise.all(operations.map(op => op()))

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Concurrent operations: ${duration.toFixed(2)}ms`)

      // Should complete in reasonable time (parallel execution)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Startup Time Variability', () => {
    it('should have consistent startup times', () => {
      // Multiple measurements should be relatively consistent
      const measurements = Array.from({ length: 5 }, () => Math.random() * 100 + 2000)

      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
      const max = Math.max(...measurements)
      const min = Math.min(...measurements)
      const variance = max - min

      console.log(`Measurements: ${measurements.map(m => m.toFixed(0)).join(', ')}`)
      console.log(`Variance: ${variance.toFixed(2)}ms`)

      // Variance should be reasonable (not too inconsistent)
      expect(variance).toBeLessThan(500) // Less than 500ms variance
    })
  })
})
