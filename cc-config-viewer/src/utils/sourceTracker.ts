/**
 * Source Tracker Utility
 *
 * Extends the source tracking from Story 3.3 to support location tracing.
 * Provides functionality to trace configuration items back to their source files.
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import type { SourceLocation, SourceLocationCache, TraceSourceRequest } from '../types/trace'

/// Source location cache with WeakRef for automatic GC
interface CacheEntry {
  location: WeakRef<SourceLocation>
  timestamp: number
}

/// Cache validity duration (10 minutes)
const CACHE_VALIDITY_MS = 10 * 60 * 1000

/// Source tracker class
export class SourceTracker {
  private cache: Map<string, CacheEntry> = new Map()
  private isEnabled: boolean = true

  /// FinalizationRegistry for automatic cleanup
  private weakRefRegistry = new FinalizationRegistry<string>((configKey) => {
    // Clean up cache entry when object is garbage collected
    this.cache.delete(configKey)
    console.debug('[SourceTracker] Auto-cleaned cache for:', configKey)
  })

  /// Checks if source location tracking is enabled
  isTrackingEnabled(): boolean {
    return this.isEnabled
  }

  /// Enables or disables source location tracking
  setTrackingEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (!enabled) {
      this.clearCache()
    }
  }

  /// Traces a configuration key to its source location
  async traceSource(configKey: string, searchPaths: string[]): Promise<SourceLocation | null> {
    if (!this.isEnabled) {
      console.log('Source tracking is disabled')
      return null
    }

    const startTime = performance.now()

    // Check cache first
    const cached = this.getCachedLocation(configKey)
    if (cached) {
      const endTime = performance.now()
      const duration = endTime - startTime
      trackTracePerformance(duration, true)
      console.log(`Using cached source location for ${configKey}`)
      return cached
    }

    try {
      // Use invoke from Tauri to call the Rust command
      const { invoke } = await import('@tauri-apps/api/core')

      const request: TraceSourceRequest = {
        config_key: configKey,
        search_paths: searchPaths,
      }

      console.log(`Tracing source for ${configKey} in paths:`, searchPaths)

      const result = await invoke<SourceLocation | null>('get_source_location', {
        request,
      })

      const endTime = performance.now()
      const duration = endTime - startTime
      trackTracePerformance(duration, false)

      if (result) {
        // Cache the result
        this.cacheLocation(configKey, result)
        console.log(`Found source location for ${configKey} in ${duration.toFixed(2)}ms:`, result)
        return result
      } else {
        console.log(`Source location not found for ${configKey} in ${duration.toFixed(2)}ms`)
        return null
      }
    } catch (error) {
      console.error('Failed to trace source:', error)
      throw new Error(`Source tracing failed: ${error}`)
    }
  }

  /// Gets cached source location if valid
  getCachedLocation(configKey: string): SourceLocation | undefined {
    const entry = this.cache.get(configKey)
    if (!entry) {
      return undefined
    }

    // Check if cache is still valid
    const now = Date.now()
    if (now - entry.timestamp > CACHE_VALIDITY_MS) {
      console.log(`Cache expired for ${configKey}`)
      this.cache.delete(configKey)
      return undefined
    }

    // Dereference WeakRef to get the actual object
    const location = entry.location.deref()
    if (!location) {
      // Object was garbage collected, remove the entry
      this.cache.delete(configKey)
      return undefined
    }

    return location
  }

  /// Caches a source location
  private cacheLocation(configKey: string, location: SourceLocation): void {
    // Wrap location in WeakRef
    const weakLocation: WeakRef<SourceLocation> = new WeakRef(location)
    this.cache.set(configKey, {
      location: weakLocation,
      timestamp: Date.now(),
    })

    // Register for auto-cleanup when object is GC'd
    this.weakRefRegistry.register(location, configKey)

    console.log(`Cached source location for ${configKey}`)
  }

  /// Clears the entire cache
  clearCache(): void {
    this.cache.clear()
    console.log('Source location cache cleared')
  }

  /// Gets cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }

  /// Invalidates a specific cache entry
  invalidate(configKey: string): void {
    this.cache.delete(configKey)
    console.log(`Invalidated cache for ${configKey}`)
  }

  /// Checks if a config key has cached data
  hasCached(configKey: string): boolean {
    return this.cache.has(configKey) && this.getCachedLocation(configKey) !== undefined
  }
}

/// Create and export a singleton instance
export const sourceTracker = new SourceTracker()

/// Performance monitoring utilities
interface PerformanceMetrics {
  traceSource: { count: number; totalTime: number; averageTime: number }
  cacheHit: { count: number; rate: number }
  cacheMiss: { count: number; rate: number }
}

const performanceMetrics: PerformanceMetrics = {
  traceSource: { count: 0, totalTime: 0, averageTime: 0 },
  cacheHit: { count: 0, rate: 0 },
  cacheMiss: { count: 0, rate: 0 },
}

/// Track performance of traceSource operation
const trackTracePerformance = (duration: number, wasCached: boolean) => {
  performanceMetrics.traceSource.count++
  performanceMetrics.traceSource.totalTime += duration
  performanceMetrics.traceSource.averageTime =
    performanceMetrics.traceSource.totalTime / performanceMetrics.traceSource.count

  if (wasCached) {
    performanceMetrics.cacheHit.count++
  } else {
    performanceMetrics.cacheMiss.count++
  }

  const total = performanceMetrics.cacheHit.count + performanceMetrics.cacheMiss.count
  performanceMetrics.cacheHit.rate = total > 0 ? performanceMetrics.cacheHit.count / total : 0
}

/// Get performance metrics
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceMetrics }
}

/// Check if performance meets AC9 requirements
export function checkPerformanceRequirements(): {
  meetsAc9: boolean
  averageTraceTime: number
  cacheHitRate: number
  warnings: string[]
} {
  const warnings: string[] = []
  const meetsAc9 = performanceMetrics.traceSource.averageTime < 100

  if (!meetsAc9) {
    warnings.push(
      `AC9 Violation: Average trace time (${performanceMetrics.traceSource.averageTime.toFixed(
        2
      )}ms) exceeds 100ms requirement`
    )
  }

  if (performanceMetrics.cacheHit.rate < 0.5) {
    warnings.push(
      `Low cache hit rate (${(performanceMetrics.cacheHit.rate * 100).toFixed(
        1
      )}%) - consider optimizing cache strategy`
    )
  }

  return {
    meetsAc9,
    averageTraceTime: performanceMetrics.traceSource.averageTime,
    cacheHitRate: performanceMetrics.cacheHit.rate,
    warnings,
  }
}

/// Helper function to trace source with default paths
export async function traceSourceWithDefaults(
  configKey: string,
  projectPath?: string
): Promise<SourceLocation | null> {
  const searchPaths: string[] = []

  // Add user-level config path
  searchPaths.push(`${process.env.HOME || process.env.USERPROFILE || ''}/.claude.json`)

  // Add project-level config path if provided
  if (projectPath) {
    searchPaths.push(`${projectPath}/.mcp.json`)
  }

  // Add local config path if exists
  if (projectPath) {
    searchPaths.push(`${projectPath}/.claude/settings.json`)
  }

  return sourceTracker.traceSource(configKey, searchPaths)
}

/// Helper function to get source location context for display
export function formatSourceLocation(location: SourceLocation): {
  displayPath: string
  displayLine: string | null
} {
  // Normalize the path for display
  const displayPath = location.file_path.replace(
    process.env.HOME || process.env.USERPROFILE || '',
    '~'
  )

  const displayLine = location.line_number ? `line ${location.line_number}` : null

  return {
    displayPath,
    displayLine,
  }
}