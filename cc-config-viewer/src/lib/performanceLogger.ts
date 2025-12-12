/**
 * Performance Logging Utility
 *
 * Provides development-mode performance logging and analysis tools
 */

import { globalPerformanceMonitor, type PerformanceMetric } from './performanceMonitor'

// Performance thresholds
const THRESHOLDS = {
  STARTUP: 3000,
  TAB_SWITCH: 100,
  PROJECT_SWITCH: 100,
  MEMORY_WARNING: 150,
  MEMORY_CRITICAL: 200,
} as const

/**
 * Logs performance summary to console in development mode
 */
export function logPerformanceSummary(): void {
  if (!import.meta.env.DEV) {
    return
  }

  const metrics = globalPerformanceMonitor.getMetrics()

  if (metrics.length === 0) {
    console.debug('[Performance] No metrics recorded yet')
    return
  }

  console.group('📊 Performance Summary')

  // Startup time
  const startupMetrics = metrics.filter((m) => m.name === 'startup')
  if (startupMetrics.length > 0) {
    const startup = startupMetrics[startupMetrics.length - 1]
    console.log(
      `🚀 Startup: ${startup.duration.toFixed(2)}ms ${startup.meetsRequirement ? '✓' : '⚠'}`
    )
  }

  // Tab switches
  const tabSwitches = metrics.filter((m) => m.name === 'tab-switch')
  if (tabSwitches.length > 0) {
    const avgTabSwitch =
      tabSwitches.reduce((sum, m) => sum + m.duration, 0) / tabSwitches.length
    const slowSwitches = tabSwitches.filter((m) => !m.meetsRequirement)
    console.log(
      `🔀 Tab Switches: ${tabSwitches.length} (avg: ${avgTabSwitch.toFixed(
        2
      )}ms, slow: ${slowSwitches.length})`
    )
  }

  // Project switches
  const projectSwitches = metrics.filter((m) => m.name === 'project-switch')
  if (projectSwitches.length > 0) {
    const avgProjectSwitch =
      projectSwitches.reduce((sum, m) => sum + m.duration, 0) / projectSwitches.length
    const slowSwitches = projectSwitches.filter((m) => !m.meetsRequirement)
    console.log(
      `📁 Project Switches: ${projectSwitches.length} (avg: ${avgProjectSwitch.toFixed(
        2
      )}ms, slow: ${slowSwitches.length})`
    )
  }

  // Memory checks
  const memoryChecks = metrics.filter((m) => m.name.includes('memory'))
  if (memoryChecks.length > 0) {
    const lastMemory = memoryChecks[memoryChecks.length - 1]
    const usedMB = lastMemory.metadata?.usedMB ?? 0
    console.log(
      `💾 Memory: ${usedMB.toFixed(2)}MB ${
        usedMB > THRESHOLDS.MEMORY_CRITICAL
          ? '🚨'
          : usedMB > THRESHOLDS.MEMORY_WARNING
          ? '⚠️'
          : '✓'
      }`
    )
  }

  console.groupEnd()
}

/**
 * Logs slow operations to console
 */
export function logSlowOperations(threshold: number = 100): void {
  if (!import.meta.env.DEV) {
    return
  }

  const slowOps = globalPerformanceMonitor.getSlowOperations(threshold)

  if (slowOps.length === 0) {
    console.debug(`[Performance] No slow operations (threshold: ${threshold}ms)`)
    return
  }

  console.group(`⚠️ Slow Operations (${slowOps.length} found)`)

  slowOps.forEach((op) => {
    console.warn(
      `${op.name}: ${op.duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
      op.metadata || ''
    )
  })

  console.groupEnd()
}

/**
 * Logs memory usage details
 */
export function logMemoryUsage(): void {
  if (!import.meta.env.DEV) {
    return
  }

  const memoryMetrics = globalPerformanceMonitor.getMetricsByName('memory-check')
  const memoryMetricsManual = globalPerformanceMonitor.getMetricsByName('memory-check-manual')

  const allMemoryMetrics = [...memoryMetrics, ...memoryMetricsManual]

  if (allMemoryMetrics.length === 0) {
    console.debug('[Performance] No memory metrics recorded')
    return
  }

  const lastMemory = allMemoryMetrics[allMemoryMetrics.length - 1]
  const usedMB = lastMemory.metadata?.usedMB ?? 0
  const totalMB = lastMemory.metadata?.totalMB ?? 0
  const limitMB = lastMemory.metadata?.limitMB ?? 0
  const usagePercent = lastMemory.metadata?.usagePercent ?? 0

  console.group('💾 Memory Usage')

  console.log(`Used: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`)
  console.log(`Total: ${totalMB.toFixed(2)}MB`)
  console.log(`Checks: ${allMemoryMetrics.length}`)

  if (usedMB > THRESHOLDS.MEMORY_CRITICAL) {
    console.log('Status: 🚨 CRITICAL - Exceeds 200MB threshold')
  } else if (usedMB > THRESHOLDS.MEMORY_WARNING) {
    console.log('Status: ⚠️ WARNING - Exceeds 150MB threshold')
  } else {
    console.log('Status: ✓ Normal')
  }

  console.groupEnd()
}

/**
 * Exports performance metrics for external analysis
 */
export function exportPerformanceReport(): string {
  const metrics = globalPerformanceMonitor.getMetrics()
  const summary = globalPerformanceMonitor.getSummary()

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalMetrics: summary.count,
      averageDuration: summary.average,
      minDuration: summary.min,
      maxDuration: summary.max,
    },
    metrics: metrics.map((m) => ({
      name: m.name,
      duration: m.duration,
      timestamp: new Date(m.timestamp).toISOString(),
      meetsRequirement: m.meetsRequirement,
      metadata: m.metadata,
    })),
    thresholds: THRESHOLDS,
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Clears all performance metrics
 */
export function clearPerformanceMetrics(): void {
  globalPerformanceMonitor.clearMetrics()

  if (import.meta.env.DEV) {
    console.debug('[Performance] Metrics cleared')
  }
}

/**
 * Automatically logs performance issues on interval
 * Call this once in development mode
 */
export function enableAutoPerformanceLogging(intervalMs: number = 60000): () => void {
  if (!import.meta.env.DEV) {
    return () => {}
  }

  const interval = setInterval(() => {
    logSlowOperations()
  }, intervalMs)

  return () => {
    clearInterval(interval)
  }
}

/**
 * Logs a custom performance metric
 */
export function logMetric(name: string, duration: number, metadata?: Record<string, any>): void {
  const metric: PerformanceMetric = {
    name,
    duration,
    timestamp: Date.now(),
    meetsRequirement: duration < 100, // Default threshold
    metadata,
  }

  globalPerformanceMonitor.recordMetric(metric)

  if (import.meta.env.DEV) {
    const status = metric.meetsRequirement ? '✓' : '⚠'
    console.debug(`${status} [Performance] ${name}: ${duration.toFixed(2)}ms`, metadata || '')
  }
}

/**
 * Performance decorator for functions
 */
export function performanceTrace<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  threshold?: number
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now()
    const result = fn(...args)
    const endTime = performance.now()
    const duration = endTime - startTime

    logMetric(name, duration)

    return result
  }) as T
}

/**
 * Async performance decorator for functions
 */
export function performanceTraceAsync<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  threshold?: number
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now()
    const result = await fn(...args)
    const endTime = performance.now()
    const duration = endTime - startTime

    logMetric(name, duration)

    return result
  }) as T
}
