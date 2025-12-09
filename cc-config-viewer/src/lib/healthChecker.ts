import type { DiscoveredProject } from '../types/project'
import type {
  ProjectHealth,
  HealthStatus,
  HealthIssue,
  HealthMetrics,
} from '../types/health'
import type { Capability } from '../types/comparison'

// Performance optimization: Pre-allocate and reuse objects
const ISSUE_ID_PREFIX = {
  missing: 'missing-value-',
  invalid: 'invalid-value-',
} as const

/**
 * Calculate health metrics for a single project
 * Optimized for performance with O(n) complexity
 * Target: <50ms per project
 */
export function calculateProjectHealth(
  project: DiscoveredProject,
  capabilities: Capability[]
): ProjectHealth {
  // Pre-allocate array with known size for better performance
  const issues: HealthIssue[] = new Array(capabilities.length)
  let issueIndex = 0
  let warnings = 0
  let errors = 0
  let invalidConfigs = 0

  // Analyze capabilities for health issues
  // Performance: Single pass through capabilities
  for (let i = 0; i < capabilities.length; i++) {
    const capability = capabilities[i]
    const value = capability.value

    // Check for invalid or missing values
    if (value === null || value === undefined) {
      // Performance: Use indexed assignment instead of push
      issues[issueIndex++] = {
        id: `${ISSUE_ID_PREFIX.missing}${capability.id}`,
        type: 'warning',
        severity: 'medium',
        message: `Capability "${capability.key}" has missing value`,
        details: 'Check configuration for this capability',
        projectId: project.id,
      }
      warnings++
    } else if (typeof value === 'string' && value.includes('invalid')) {
      // Check for invalid JSON or parse errors (simulated)
      issues[issueIndex++] = {
        id: `${ISSUE_ID_PREFIX.invalid}${capability.id}`,
        type: 'error',
        severity: 'high',
        message: `Capability "${capability.key}" has invalid value`,
        details: 'Value contains invalid content',
        projectId: project.id,
      }
      errors++
      invalidConfigs++
    }
  }

  // Trim issues array to actual size
  if (issueIndex !== issues.length) {
    issues.length = issueIndex
  }

  // Determine health status based on metrics
  // Performance: Single calculation pass
  const totalCapabilities = capabilities.length
  const validConfigs = totalCapabilities - invalidConfigs

  let status: HealthStatus
  let score: number

  // Performance: Fast path for common case (good status)
  if (errors === 0 && warnings === 0 && invalidConfigs === 0 && totalCapabilities >= 2) {
    status = 'good'
    score = Math.min(100, 80 + (totalCapabilities * 2))
  } else if (errors > 3) {
    status = 'error'
    score = Math.max(0, 50 - (errors * 15) - (warnings * 2))
  } else {
    status = 'warning'
    score = Math.max(40, 75 - (warnings * 5) - (invalidConfigs * 10))
  }

  // Build metrics
  // Performance: Single object creation
  const metrics: HealthMetrics = {
    totalCapabilities,
    validConfigs,
    invalidConfigs,
    warnings,
    errors,
    lastChecked: new Date(),
    lastAccessed: project.lastModified ? new Date(project.lastModified * 1000) : undefined,
  }

  // Generate recommendations
  const recommendations = generateRecommendations(status, warnings, errors, totalCapabilities)

  return {
    projectId: project.id,
    status,
    score,
    metrics,
    issues,
    recommendations,
  }
}

/**
 * Batch calculate health for multiple projects
 * Optimized for batch processing with parallel capability lookup
 * Target: <50ms per project, <200ms for batch of 10 projects
 */
export function calculateBatchHealth(
  projects: DiscoveredProject[],
  projectCapabilities: Map<string, Capability[]>
): ProjectHealth[] {
  // Pre-allocate array for better performance
  const healthResults: ProjectHealth[] = new Array(projects.length)

  // Process projects in batch
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    // Performance: Use get() with fallback to empty array
    const capabilities = projectCapabilities.get(project.id) || []
    healthResults[i] = calculateProjectHealth(project, capabilities)
  }

  return healthResults
}

/**
 * Filter projects by health status
 */
export function filterByHealthStatus(
  healthResults: ProjectHealth[],
  filter: 'all' | 'good' | 'warning' | 'error'
): ProjectHealth[] {
  if (filter === 'all') {
    return healthResults
  }

  return healthResults.filter((health) => health.status === filter)
}

/**
 * Sort projects by health score (descending)
 */
export function sortByHealthScore(healthResults: ProjectHealth[]): ProjectHealth[] {
  return [...healthResults].sort((a, b) => b.score - a.score)
}

/**
 * Generate recommendations based on health status
 */
function generateRecommendations(
  status: HealthStatus,
  warnings: number,
  errors: number,
  totalCapabilities: number
): string[] {
  const recommendations: string[] = []

  if (status === 'error') {
    recommendations.push('Fix critical configuration errors immediately')
    recommendations.push('Review project setup and validate all configuration files')
  } else if (status === 'warning') {
    recommendations.push('Address configuration warnings to improve project health')
    recommendations.push('Validate configuration values and fix any issues')
  } else {
    recommendations.push('Configuration looks good')
    recommendations.push('Continue regular maintenance and monitoring')
  }

  if (totalCapabilities === 0) {
    recommendations.push('Add configuration files to improve project visibility')
  }

  if (warnings > 5) {
    recommendations.push('High number of warnings detected - review all configurations')
  }

  return recommendations
}

// Performance optimization: Simple LRU cache for repeated calculations
class HealthCalculationCache {
  private cache = new Map<string, { health: ProjectHealth; timestamp: number }>()
  private maxSize = 100

  set(key: string, health: ProjectHealth): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      health: { ...health },
      timestamp: Date.now(),
    })
  }

  get(key: string): ProjectHealth | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if cache entry is still valid (5 minutes)
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
      this.cache.delete(key)
      return null
    }

    return { ...entry.health }
  }

  clear(): void {
    this.cache.clear()
  }
}

const healthCache = new HealthCalculationCache()

/**
 * Memoized version of calculateProjectHealth with 5-minute cache
 * Use for scenarios where same project is checked repeatedly
 */
export function calculateProjectHealthMemoized(
  project: DiscoveredProject,
  capabilities: Capability[]
): ProjectHealth {
  const cacheKey = `${project.id}-${capabilities.length}-${capabilities.length > 0 ? capabilities[0].id : 'empty'}`

  const cached = healthCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const health = calculateProjectHealth(project, capabilities)
  healthCache.set(cacheKey, health)

  return health
}

/**
 * Performance benchmarking utility
 * Measures execution time of health calculations
 */
export function benchmarkHealthCalculation(
  project: DiscoveredProject,
  capabilities: Capability[],
  iterations: number = 100
): { average: number; min: number; max: number; total: number } {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    calculateProjectHealth(project, capabilities)
    const end = performance.now()
    times.push(end - start)
  }

  const total = times.reduce((a, b) => a + b, 0)
  const average = total / iterations
  const min = Math.min(...times)
  const max = Math.max(...times)

  return { average, min, max, total }
}

/**
 * Clear health calculation cache
 * Call this when project capabilities change
 */
export function clearHealthCache(): void {
  healthCache.clear()
}