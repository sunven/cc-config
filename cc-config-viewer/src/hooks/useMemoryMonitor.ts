/**
 * Memory Monitoring Hook
 *
 * Tracks memory usage over time and logs warnings when thresholds are exceeded
 */

import { useEffect, useRef } from 'react'
import { measureMemory, globalPerformanceMonitor } from '@/lib/performanceMonitor'

// Memory thresholds (in MB)
const MEMORY_THRESHOLDS = {
  WARNING: 150, // Warn at 150MB
  CRITICAL: 200, // Critical at 200MB
} as const

/**
 * Hook for monitoring memory usage
 *
 * @param intervalMs - How often to check memory (default: 30 seconds)
 * @param enableLogging - Whether to log memory warnings (default: true in development)
 */
export function useMemoryMonitor(
  intervalMs: number = 30000,
  enableLogging: boolean = import.meta.env.DEV
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const warningShownRef = useRef(false)

  useEffect(() => {
    let checkCount = 0

    const checkMemory = () => {
      const memory = measureMemory()

      // If memory API is not available, skip
      if (!memory) {
        if (enableLogging) {
          console.debug('[Performance] Memory API not available')
        }
        return
      }

      // Record memory metric
      globalPerformanceMonitor.recordMetric({
        name: 'memory-check',
        duration: 0, // Not applicable for memory checks
        timestamp: Date.now(),
        meetsRequirement: memory.usedMB < MEMORY_THRESHOLDS.CRITICAL,
        metadata: {
          usedMB: memory.usedMB,
          totalMB: memory.totalMB,
          limitMB: memory.limitMB,
          usagePercent: memory.usagePercent,
        },
      })

      // Log warnings in development mode
      if (enableLogging && memory.usedMB > MEMORY_THRESHOLDS.WARNING) {
        const status =
          memory.usedMB > MEMORY_THRESHOLDS.CRITICAL ? '🚨 CRITICAL' : '⚠️ WARNING'

        console.warn(
          `${status} [Memory] High memory usage: ${memory.usedMB.toFixed(2)}MB / ${memory.limitMB.toFixed(2)}MB (${memory.usagePercent.toFixed(1)}%)`
        )

        // Only show critical warning once to avoid spam
        if (memory.usedMB > MEMORY_THRESHOLDS.CRITICAL && !warningShownRef.current) {
          warningShownRef.current = true
          console.warn(
            `🚨 [Memory] Memory usage (${memory.usedMB.toFixed(
              2
            )}MB) exceeds critical threshold (${MEMORY_THRESHOLDS.CRITICAL}MB)`
          )
        }
      }

      checkCount++
    }

    // Check memory immediately
    checkMemory()

    // Set up periodic checking
    intervalRef.current = setInterval(checkMemory, intervalMs)

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [intervalMs, enableLogging])

  // Return a function to manually check memory
  return {
    checkMemory: () => {
      const memory = measureMemory()
      if (memory) {
        globalPerformanceMonitor.recordMetric({
          name: 'memory-check-manual',
          duration: 0,
          timestamp: Date.now(),
          meetsRequirement: memory.usedMB < MEMORY_THRESHOLDS.CRITICAL,
          metadata: {
            usedMB: memory.usedMB,
            totalMB: memory.totalMB,
            limitMB: memory.limitMB,
            usagePercent: memory.usagePercent,
          },
        })
      }
      return memory
    },
  }
}
