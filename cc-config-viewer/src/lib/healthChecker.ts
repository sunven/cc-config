import type { DiscoveredProject } from '../types/project'
import type {
  ProjectHealth,
  HealthStatus,
  HealthIssue,
  HealthMetrics,
} from '../types/health'
import type { Capability } from '../types/comparison'

/**
 * Calculate health metrics for a single project
 * Optimized for performance with O(n) complexity
 */
export function calculateProjectHealth(
  project: DiscoveredProject,
  capabilities: Capability[]
): ProjectHealth {
  const issues: HealthIssue[] = []
  let warnings = 0
  let errors = 0
  let invalidConfigs = 0

  // Analyze capabilities for health issues
  for (const capability of capabilities) {
    // Check for invalid or missing values
    if (capability.value === null || capability.value === undefined) {
      issues.push({
        id: `missing-value-${capability.id}`,
        type: 'warning',
        severity: 'medium',
        message: `Capability "${capability.key}" has missing value`,
        details: 'Check configuration for this capability',
        projectId: project.id,
      })
      warnings++
    }

    // Check for invalid JSON or parse errors (simulated)
    if (typeof capability.value === 'string' && capability.value.includes('invalid')) {
      issues.push({
        id: `invalid-value-${capability.id}`,
        type: 'error',
        severity: 'high',
        message: `Capability "${capability.key}" has invalid value`,
        details: 'Value contains invalid content',
        projectId: project.id,
      })
      errors++
      invalidConfigs++
    }
  }

  // Determine health status based on metrics
  const totalCapabilities = capabilities.length
  const validConfigs = totalCapabilities - invalidConfigs

  let status: HealthStatus
  let score: number

  if (errors > 3) {
    status = 'error'
    score = Math.max(0, 50 - (errors * 15) - (warnings * 2))
  } else if (errors > 0 || warnings > 0 || invalidConfigs > 0 || totalCapabilities < 2) {
    status = 'warning'
    score = Math.max(40, 75 - (warnings * 5) - (invalidConfigs * 10))
  } else {
    status = 'good'
    score = Math.min(100, 80 + (totalCapabilities * 2))
  }

  // Build metrics
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
 */
export function calculateBatchHealth(
  projects: DiscoveredProject[],
  projectCapabilities: Map<string, Capability[]>
): ProjectHealth[] {
  const healthResults: ProjectHealth[] = []

  for (const project of projects) {
    const capabilities = projectCapabilities.get(project.id) || []
    const health = calculateProjectHealth(project, capabilities)
    healthResults.push(health)
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