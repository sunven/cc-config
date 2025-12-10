/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for measuring and tracking application performance metrics
 * including startup time, tab switching, memory usage, and custom operations.
 */

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  STARTUP: 3000, // < 3 seconds
  TAB_SWITCH: 100, // < 100ms
  INITIAL_RENDER: 50, // < 50ms
  FILE_DETECTION: 500, // < 500ms
} as const

/**
 * Result of a performance measurement
 */
export interface MeasurementResult {
  name: string
  duration: number
  timestamp: number
  meetsRequirement: boolean
  result?: any
  metadata?: Record<string, any>
}

/**
 * Performance metric with full details
 */
export interface PerformanceMetric extends MeasurementResult {
  // Extended interface for storing metrics
}

/**
 * Memory usage information
 */
export interface MemoryInfo {
  usedMB: number
  totalMB: number
  limitMB: number
  usagePercent: number
}

/**
 * Tab switch measurement result
 */
export interface TabSwitchResult extends MeasurementResult {
  from: string
  to: string
}

/**
 * Startup time measurement result
 */
export interface StartupResult extends MeasurementResult {
  // No additional fields needed
}

/**
 * Measures execution time of a synchronous or asynchronous function
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => T | Promise<T>,
  threshold?: number
): Promise<MeasurementResult> {
  const thresholdMs = threshold ?? PERFORMANCE_THRESHOLDS.TAB_SWITCH
  const timestamp = Date.now()

  try {
    performance.mark(`${name}-start`)

    const result = await fn()

    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)

    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure?.duration ?? 0

    const measurement: MeasurementResult = {
      name,
      duration,
      timestamp,
      meetsRequirement: duration < thresholdMs,
      result,
      metadata: { resultType: result && typeof result === 'object' ? 'object' : typeof result },
    }

    // Clear marks and measures
    performance.clearMarks(`${name}-start`)
    performance.clearMarks(`${name}-end`)
    performance.clearMeasures(name)

    return measurement
  } catch (error) {
    // Even on error, try to measure partial time
    const duration = performance.now()
    performance.clearMarks(`${name}-start`)
    performance.clearMarks(`${name}-end`)

    throw error
  }
}

/**
 * Measures current memory usage
 */
export function measureMemory(): MemoryInfo | null {
  if (!('memory' in performance) || !performance.memory) {
    return null
  }

  const memory = performance.memory
  const usedMB = memory.usedJSHeapSize / 1024 / 1024
  const totalMB = memory.totalJSHeapSize / 1024 / 1024
  const limitMB = memory.jsHeapSizeLimit / 1024 / 1024
  const usagePercent = (usedMB / limitMB) * 100

  return {
    usedMB,
    totalMB,
    limitMB,
    usagePercent,
  }
}

/**
 * Measures startup time from app launch
 */
export function measureStartupTime(): StartupResult {
  const startTime = performance.timeOrigin || 0
  const currentTime = performance.now()
  const duration = currentTime

  return {
    name: 'startup',
    duration,
    timestamp: Date.now(),
    meetsRequirement: duration < PERFORMANCE_THRESHOLDS.STARTUP,
  }
}

/**
 * Measures tab switch performance
 */
export function measureTabSwitch(from: string, to: string): TabSwitchResult {
  const duration = performance.now()

  return {
    name: 'tab-switch',
    duration,
    timestamp: Date.now(),
    meetsRequirement: duration < PERFORMANCE_THRESHOLDS.TAB_SWITCH,
    from,
    to,
  }
}

/**
 * Creates a performance marker for manual timing
 */
export function createPerformanceMarker(
  name: string,
  thresholdMs: number = PERFORMANCE_THRESHOLDS.TAB_SWITCH
) {
  let startTime = 0

  return {
    start: () => {
      startTime = performance.now()
      performance.mark(`${name}-start`)
    },
    end: (metadata?: Record<string, any>): MeasurementResult => {
      const endTime = performance.now()
      const duration = endTime - startTime

      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)

      const result: MeasurementResult = {
        name,
        duration,
        timestamp: Date.now(),
        meetsRequirement: duration < thresholdMs,
        metadata,
      }

      // Clean up
      performance.clearMarks(`${name}-start`)
      performance.clearMarks(`${name}-end`)
      performance.clearMeasures(name)

      return result
    },
  }
}

/**
 * Performance monitoring class for tracking multiple metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Get performance summary statistics
   */
  getSummary() {
    if (this.metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
      }
    }

    const durations = this.metrics.map((m) => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)

    return {
      count: this.metrics.length,
      average: sum / this.metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    }
  }

  /**
   * Get operations that exceeded the threshold
   */
  getSlowOperations(threshold: number = PERFORMANCE_THRESHOLDS.TAB_SWITCH): PerformanceMetric[] {
    return this.metrics.filter((m) => m.duration > threshold)
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return this.metrics.map((m) => ({
      name: m.name,
      duration: m.duration,
      timestamp: m.timestamp,
      metadata: m.metadata,
    }))
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor()

/**
 * Development mode performance logger
 */
export function logPerformanceMetric(metric: PerformanceMetric): void {
  if (process.env.NODE_ENV === 'development') {
    const status = metric.meetsRequirement ? '✓' : '⚠'
    const threshold =
      metric.name === 'startup'
        ? PERFORMANCE_THRESHOLDS.STARTUP
        : metric.name === 'tab-switch'
        ? PERFORMANCE_THRESHOLDS.TAB_SWITCH
        : PERFORMANCE_THRESHOLDS.TAB_SWITCH

    console.debug(
      `${status} [Performance] ${metric.name}: ${metric.duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
      metric.metadata ? metric.metadata : ''
    )
  }
}

/**
 * Tracks and logs slow operations automatically
 */
export function trackSlowOperation<T>(
  name: string,
  fn: () => T | Promise<T>,
  thresholdMs: number = PERFORMANCE_THRESHOLDS.TAB_SWITCH
): T | Promise<T> {
  const marker = createPerformanceMarker(name, thresholdMs)
  marker.start()

  const run = async () => {
    try {
      const result = await fn()
      const measurement = marker.end()
      logPerformanceMetric(measurement)

      // Record in global monitor
      globalPerformanceMonitor.recordMetric(measurement)

      return result
    } catch (error) {
      marker.end({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  const result = run()

  // If it's a Promise, attach handler
  if (result && typeof result.then === 'function') {
    return result
  }

  return result
}

/**
 * Measure React component render time
 */
export function createRenderTimeTracker(componentName: string) {
  return {
    start: () => {
      performance.mark(`${componentName}-render-start`)
    },
    end: () => {
      performance.mark(`${componentName}-render-end`)
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      )

      const measure = performance.getEntriesByName(`${componentName}-render`, 'measure')[0]
      const duration = measure?.duration ?? 0

      performance.clearMarks(`${componentName}-render-start`)
      performance.clearMarks(`${componentName}-render-end`)
      performance.clearMeasures(`${componentName}-render`)

      return duration
    },
  }
}
