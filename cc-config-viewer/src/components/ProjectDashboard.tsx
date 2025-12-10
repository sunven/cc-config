import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import { useProjectComparison } from '../hooks/useProjectComparison'
import { ProjectHealthCard } from './ProjectHealthCard'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ExportButton } from './ExportButton'
import {
  Activity,
  Filter,
  RefreshCw,
  SortAsc,
  GitCompare,
  Folder,
} from 'lucide-react'
import type { DiscoveredProject } from '../types/project'
import type { SortBy, FilterBy } from '../types/health'
import type { ProjectHealth } from '../types/health'

// Keyboard navigation constants
const GRID_COLS = 4 // xl:grid-cols-4

interface ProjectDashboardProps {
  className?: string
  onViewCapabilities?: () => void
}

/**
 * ProjectDashboard Component
 * Main container for project health dashboard with grid layout, filtering, and sorting
 */
export function ProjectDashboard({ className, onViewCapabilities }: ProjectDashboardProps) {
  const {
    projects,
    dashboard,
    setDashboardFilters,
    refreshAllProjectHealth,
    comparison,
  } = useProjectsStore()

  const {
    startComparison,
  } = useProjectComparison()

  const [localFilter, setLocalFilter] = useState<FilterBy>(dashboard.filterBy)
  const [localSortBy, setLocalSortBy] = useState<SortBy>(dashboard.sortBy)
  const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1)

  // Refresh health metrics on mount
  useEffect(() => {
    refreshAllProjectHealth()
  }, [refreshAllProjectHealth])

  // Keyboard navigation handler for project grid
  const handleKeyDown = useCallback((event: React.KeyboardEvent, projectIndex: number) => {
    // Use current projects length for accurate navigation
    const totalCards = projects.length

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        setFocusedCardIndex((prev) => (prev + 1) % totalCards)
        break
      case 'ArrowLeft':
        event.preventDefault()
        setFocusedCardIndex((prev) => (prev - 1 + totalCards) % totalCards)
        break
      case 'ArrowDown':
        event.preventDefault()
        setFocusedCardIndex((prev) => {
          const next = prev + GRID_COLS
          return next >= totalCards ? prev : next
        })
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedCardIndex((prev) => {
          const next = prev - GRID_COLS
          return next < 0 ? prev : next
        })
        break
      case 'Home':
        event.preventDefault()
        setFocusedCardIndex(0)
        break
      case 'End':
        event.preventDefault()
        setFocusedCardIndex(totalCards - 1)
        break
      default:
        break
    }
  }, [projects.length]) // Use projects.length which is more stable

  // Performance optimization: Create health metrics map for O(1) lookups
  const healthMetricsMap = useMemo(() => {
    const map = new Map<string, (typeof dashboard.healthMetrics)[0]>()
    for (const metric of dashboard.healthMetrics) {
      map.set(metric.projectId, metric)
    }
    return map
  }, [dashboard.healthMetrics])

  // Filter and sort projects based on dashboard state
  // Performance: Optimized with Map lookups and early returns
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects]

    // Filter by health status
    if (dashboard.filterBy !== 'all') {
      filtered = filtered.filter((project) => {
        const healthMetric = healthMetricsMap.get(project.id)
        if (!healthMetric) return false

        const healthScore = healthMetric.healthScore
        if (dashboard.filterBy === 'good') return healthScore >= 80
        if (dashboard.filterBy === 'warning') return healthScore >= 50 && healthScore < 80
        if (dashboard.filterBy === 'error') return healthScore < 50
        return true
      })
    }

    // Sort projects
    filtered.sort((a, b) => {
      if (dashboard.sortBy === 'health') {
        const healthA = healthMetricsMap.get(a.id)
        const healthB = healthMetricsMap.get(b.id)
        const scoreA = healthA?.healthScore ?? 0
        const scoreB = healthB?.healthScore ?? 0
        return scoreB - scoreA // Higher scores first
      } else if (dashboard.sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (dashboard.sortBy === 'lastAccessed') {
        const timeA = a.lastModified || 0
        const timeB = b.lastModified || 0
        return timeB - timeA // Most recent first
      }
      return 0
    })

    return filtered
  }, [projects, healthMetricsMap, dashboard.filterBy, dashboard.sortBy])

  // Handle filter change
  // Performance: Memoized to prevent unnecessary re-renders
  const handleFilterChange = useCallback((filter: FilterBy) => {
    setLocalFilter(filter)
    setDashboardFilters({ filterBy: filter })
  }, [setDashboardFilters])

  // Handle sort change
  // Performance: Memoized to prevent unnecessary re-renders
  const handleSortChange = useCallback((sortBy: SortBy) => {
    setLocalSortBy(sortBy)
    setDashboardFilters({ sortBy })
  }, [setDashboardFilters])

  // Calculate health summary stats
  // Performance: Optimized with Map lookups and single pass
  const healthSummary = useMemo(() => {
    const total = projects.length
    let good = 0
    let warning = 0
    let error = 0

    // Single pass through projects with O(1) map lookup
    for (const project of projects) {
      const metric = healthMetricsMap.get(project.id)
      if (!metric) continue

      const score = metric.healthScore
      if (score >= 80) {
        good++
      } else if (score >= 50) {
        warning++
      } else {
        error++
      }
    }

    return { total, good, warning, error }
  }, [projects, healthMetricsMap])

  // Handle compare action
  // Performance: Memoized to prevent unnecessary re-renders of child components
  const handleCompare = useCallback((project: DiscoveredProject) => {
    // If a project is already selected for comparison, compare with this one
    if (comparison.leftProject && !comparison.rightProject) {
      // Complete the comparison with right project
      startComparison(comparison.leftProject, project)
    } else if (comparison.isComparing) {
      // Already comparing two projects, restart with this as left project
      startComparison(project, project)
    } else {
      // No left project selected, set this as left project for comparison
      startComparison(project, project)
    }
  }, [comparison.leftProject, comparison.rightProject, comparison.isComparing, startComparison])

  // Handle view details action
  // Performance: Memoized to prevent unnecessary re-renders of child components
  const handleViewDetails = useCallback((project: DiscoveredProject) => {
    // Switch to capabilities tab to view project details
    if (onViewCapabilities) {
      onViewCapabilities()
    }
  }, [onViewCapabilities])

  if (projects.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 ${className || ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="text-center text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">No projects found</h2>
          <p className="text-sm">Discover projects to get started</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Skip link for keyboard navigation */}
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div className={`flex flex-col h-full ${className || ''}`} role="main" aria-label="Project Health Dashboard" id="dashboard-content">
        {/* Header */}
      <header className="flex items-center justify-between p-4 border-b" role="banner">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-lg font-semibold">Project Health Dashboard</h1>
          </div>
          {healthSummary.total > 0 && (
            <div
              className="flex items-center space-x-2"
              role="group"
              aria-label="Health Summary Statistics"
            >
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
                aria-label={`${healthSummary.good} projects in good health`}
              >
                {healthSummary.good} Good
              </Badge>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
                aria-label={`${healthSummary.warning} projects with warnings`}
              >
                {healthSummary.warning} Warning
              </Badge>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
                aria-label={`${healthSummary.error} projects with errors`}
              >
                {healthSummary.error} Error
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <ExportButton
            source="project"
            data={projects.length === 1 ? projects[0] : null}
            variant="outline"
            size="sm"
          >
            导出项目
          </ExportButton>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAllProjectHealth()}
            disabled={dashboard.isRefreshing}
            aria-label={dashboard.isRefreshing ? 'Refreshing project health metrics' : 'Refresh project health metrics'}
            aria-busy={dashboard.isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${dashboard.isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {dashboard.isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      {/* Controls */}
      <nav
        className="flex items-center justify-between p-4 border-b bg-muted/20"
        aria-label="Dashboard Controls"
      >
        {/* Filter Controls */}
        <div className="flex items-center space-x-2" role="group" aria-labelledby="filter-label">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span id="filter-label" className="text-sm font-medium">Filter:</span>
          <div className="flex space-x-1" role="radiogroup" aria-label="Filter by health status">
            {(['all', 'good', 'warning', 'error'] as FilterBy[]).map((filter) => (
              <Button
                key={filter}
                variant={localFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange(filter)}
                className="capitalize"
                role="radio"
                aria-checked={localFilter === filter}
                aria-label={`Filter projects by ${filter} health status`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2" role="group" aria-labelledby="sort-label">
          <SortAsc className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span id="sort-label" className="text-sm font-medium">Sort by:</span>
          <div className="flex space-x-1" role="radiogroup" aria-label="Sort projects">
            {(['health', 'name', 'lastAccessed'] as SortBy[]).map((sort) => (
              <Button
                key={sort}
                variant={localSortBy === sort ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(sort)}
                className="capitalize"
                role="radio"
                aria-checked={localSortBy === sort}
                aria-label={`Sort projects by ${sort === 'lastAccessed' ? 'last accessed' : sort}`}
              >
                {sort === 'lastAccessed' ? 'Last Accessed' : sort}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* Live region for health status announcements */}
      <div
        id="health-status-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Project Grid */}
      <section
        className="flex-1 overflow-auto p-4"
        aria-label="Project List"
        role="region"
      >
        {filteredAndSortedProjects.length === 0 ? (
          <div className="flex items-center justify-center h-32" role="status" aria-live="polite">
            <div className="text-center text-muted-foreground">
              <p role="alert">No projects match the current filter</p>
              <p className="text-sm mt-2">Try adjusting the filter or sort options</p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              role="list"
              aria-label={`${filteredAndSortedProjects.length} projects`}
              aria-describedby="keyboard-help"
            >
              {filteredAndSortedProjects.map((project, index) => {
                // Performance: Use Map for O(1) lookup instead of find()
                const healthMetric = healthMetricsMap.get(project.id)

                // Create ProjectHealth object from metrics
                const health = healthMetric
                  ? {
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
                  : undefined

                return (
                  <ProjectHealthCard
                    key={project.id}
                    project={project}
                    health={health}
                    onCompare={() => handleCompare(project)}
                    onViewDetails={() => handleViewDetails(project)}
                    className="transition-transform hover:scale-[1.02]"
                    tabIndex={focusedCardIndex === index ? 0 : -1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    aria-label={`Project ${index + 1} of ${filteredAndSortedProjects.length}: ${project.name}`}
                  />
                )
              })}
            </div>
            {/* Keyboard navigation help */}
            <div id="keyboard-help" className="sr-only">
              Use arrow keys to navigate between projects. Press Home to go to first project, End to go to last project.
            </div>
          </>
        )}
      </section>
    </div>
    </>
  )
}

// Performance optimization: Memoize component to prevent unnecessary re-renders
// Target: <200ms render time for dashboard with 20+ projects
export const MemoizedProjectDashboard = memo(ProjectDashboard)
