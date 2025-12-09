import { useCallback } from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'

/**
 * Hook for project comparison operations
 */
export function useProjectComparison() {
  const {
    comparison,
    setComparisonProjects,
    calculateDiff,
    clearComparison,
  } = useProjectsStore()

  const startComparison = useCallback(
    (left: DiscoveredProject, right: DiscoveredProject) => {
      setComparisonProjects(left, right)
    },
    [setComparisonProjects]
  )

  const refreshComparison = useCallback(async () => {
    await calculateDiff()
  }, [calculateDiff])

  const exitComparison = useCallback(() => {
    clearComparison()
  }, [clearComparison])

  return {
    // State
    leftProject: comparison.leftProject,
    rightProject: comparison.rightProject,
    isComparing: comparison.isComparing,
    diffResults: comparison.diffResults,
    comparisonMode: comparison.comparisonMode,

    // Actions
    startComparison,
    refreshComparison,
    exitComparison,
  }
}