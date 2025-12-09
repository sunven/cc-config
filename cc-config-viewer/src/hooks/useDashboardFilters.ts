import { useCallback, useMemo } from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import type { SortBy, FilterBy } from '../types/health'
import type { DiscoveredProject } from '../types/project'

/**
 * Hook for dashboard filtering and sorting operations
 * Provides filtered and sorted project lists based on dashboard state
 */
export function useDashboardFilters() {
  const {
    projects,
    dashboard,
    setDashboardFilters,
  } = useProjectsStore()

  const { sortBy, filterBy, healthMetrics } = dashboard

  // Filter projects by health status
  const filterProjects = useCallback(
    (projectList: DiscoveredProject[]): DiscoveredProject[] => {
      if (filterBy === 'all') {
        return projectList
      }

      return projectList.filter((project) => {
        const healthMetric = healthMetrics.find((m) => m.projectId === project.id)
        if (!healthMetric) return false

        const healthScore = healthMetric.healthScore
        if (filterBy === 'good') return healthScore >= 80
        if (filterBy === 'warning') return healthScore >= 50 && healthScore < 80
        if (filterBy === 'error') return healthScore < 50
        return true
      })
    },
    [filterBy, healthMetrics]
  )

  // Sort projects
  const sortProjects = useCallback(
    (projectList: DiscoveredProject[]): DiscoveredProject[] => {
      const sorted = [...projectList]

      if (sortBy === 'health') {
        return sorted.sort((a, b) => {
          const healthA = healthMetrics.find((m) => m.projectId === a.id)
          const healthB = healthMetrics.find((m) => m.projectId === b.id)
          const scoreA = healthA?.healthScore ?? 0
          const scoreB = healthB?.healthScore ?? 0
          return scoreB - scoreA // Higher scores first
        })
      } else if (sortBy === 'name') {
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      } else if (sortBy === 'lastAccessed') {
        return sorted.sort((a, b) => {
          const timeA = a.lastModified || 0
          const timeB = b.lastModified || 0
          return timeB - timeA // Most recent first
        })
      }

      return sorted
    },
    [sortBy, healthMetrics]
  )

  // Get filtered and sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    return sortProjects(filterProjects(projects))
  }, [projects, filterProjects, sortProjects])

  // Change filter
  const changeFilter = useCallback(
    (newFilter: FilterBy) => {
      setDashboardFilters({ filterBy: newFilter })
    },
    [setDashboardFilters]
  )

  // Change sort
  const changeSort = useCallback(
    (newSort: SortBy) => {
      setDashboardFilters({ sortBy: newSort })
    },
    [setDashboardFilters]
  )

  // Toggle filter (cycle through all, good, warning, error)
  const toggleFilter = useCallback(() => {
    const filters: FilterBy[] = ['all', 'good', 'warning', 'error']
    const currentIndex = filters.indexOf(filterBy)
    const nextIndex = (currentIndex + 1) % filters.length
    setDashboardFilters({ filterBy: filters[nextIndex] })
  }, [filterBy, setDashboardFilters])

  // Toggle sort (cycle through health, name, lastAccessed)
  const toggleSort = useCallback(() => {
    const sorts: SortBy[] = ['health', 'name', 'lastAccessed']
    const currentIndex = sorts.indexOf(sortBy)
    const nextIndex = (currentIndex + 1) % sorts.length
    setDashboardFilters({ sortBy: sorts[nextIndex] })
  }, [sortBy, setDashboardFilters])

  // Get filter count (number of projects matching current filter)
  const getFilterCount = useCallback(
    (filter?: FilterBy): number => {
      const targetFilter = filter || filterBy
      const filtered = filterProjects(projects)
      return filtered.length
    },
    [projects, filterBy, filterProjects]
  )

  // Get sort direction info
  const getSortInfo = useCallback(() => {
    return {
      sortBy,
      filterBy,
      isSortedByHealth: sortBy === 'health',
      isSortedByName: sortBy === 'name',
      isSortedByLastAccessed: sortBy === 'lastAccessed',
      isFiltered: filterBy !== 'all',
      isFilteredByGood: filterBy === 'good',
      isFilteredByWarning: filterBy === 'warning',
      isFilteredByError: filterBy === 'error',
    }
  }, [sortBy, filterBy])

  return {
    // State
    sortBy,
    filterBy,
    filteredAndSortedProjects,

    // Computed
    filterCount: getFilterCount(),
    sortInfo: getSortInfo(),

    // Actions
    changeFilter,
    changeSort,
    toggleFilter,
    toggleSort,
    getFilterCount,
  }
}
