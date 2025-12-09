import { useCallback } from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import type { ProjectHealth } from '../types/health'

/**
 * Hook for project health operations
 * Provides health-related state and actions for the dashboard
 */
export function useProjectHealth() {
  const {
    projects,
    dashboard,
    updateProjectHealth,
    refreshAllProjectHealth,
  } = useProjectsStore()

  // Get health data for a specific project
  const getProjectHealth = useCallback(
    (projectId: string): ProjectHealth | null => {
      const healthMetric = dashboard.healthMetrics.find((m) => m.projectId === projectId)

      if (!healthMetric) return null

      const project = projects.find((p) => p.id === projectId)

      if (!project) return null

      // Convert HealthMetrics to ProjectHealth
      return {
        projectId: project.id,
        status:
          healthMetric.healthScore >= 80
            ? 'good'
            : healthMetric.healthScore >= 50
            ? 'warning'
            : 'error',
        score: healthMetric.healthScore,
        metrics: {
          totalCapabilities: healthMetric.totalCapabilities,
          validConfigs: healthMetric.validConfigs,
          invalidConfigs: healthMetric.invalidConfigs,
          warnings: healthMetric.warningCount,
          errors: healthMetric.errorCount,
          lastChecked: healthMetric.lastModified,
          lastAccessed: project.lastModified
            ? new Date(project.lastModified * 1000).toISOString()
            : undefined,
        },
        issues: [],
        recommendations: [],
      }
    },
    [projects, dashboard.healthMetrics]
  )

  // Check health status for a specific project
  const getProjectHealthStatus = useCallback(
    (projectId: string): 'good' | 'warning' | 'error' | 'unknown' => {
      const health = getProjectHealth(projectId)
      return health?.status || 'unknown'
    },
    [getProjectHealth]
  )

  // Get health score for a specific project
  const getProjectHealthScore = useCallback(
    (projectId: string): number => {
      const health = getProjectHealth(projectId)
      return health?.score || 0
    },
    [getProjectHealth]
  )

  // Refresh health for a specific project
  const refreshProjectHealth = useCallback(
    async (projectId: string) => {
      await updateProjectHealth(projectId)
    },
    [updateProjectHealth]
  )

  // Refresh health for all projects
  const refreshAllHealth = useCallback(async () => {
    await refreshAllProjectHealth()
  }, [refreshAllProjectHealth])

  // Get list of projects by health status
  const getProjectsByHealthStatus = useCallback(
    (status: 'good' | 'warning' | 'error') => {
      return projects.filter((project) => {
        const healthStatus = getProjectHealthStatus(project.id)
        return healthStatus === status
      })
    },
    [projects, getProjectHealthStatus]
  )

  // Calculate health statistics
  const getHealthStatistics = useCallback(() => {
    const total = projects.length
    const good = getProjectsByHealthStatus('good').length
    const warning = getProjectsByHealthStatus('warning').length
    const error = getProjectsByHealthStatus('error').length

    const averageScore =
      dashboard.healthMetrics.length > 0
        ? dashboard.healthMetrics.reduce((sum, m) => sum + m.healthScore, 0) /
          dashboard.healthMetrics.length
        : 0

    return {
      total,
      good,
      warning,
      error,
      averageScore: Math.round(averageScore),
    }
  }, [projects, dashboard.healthMetrics, getProjectsByHealthStatus])

  return {
    // State
    projects,
    healthMetrics: dashboard.healthMetrics,
    isRefreshing: dashboard.isRefreshing,
    healthStatistics: getHealthStatistics(),

    // Actions
    getProjectHealth,
    getProjectHealthStatus,
    getProjectHealthScore,
    refreshProjectHealth,
    refreshAllHealth,
    getProjectsByHealthStatus,
  }
}
