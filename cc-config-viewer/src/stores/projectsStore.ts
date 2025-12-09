import { create } from 'zustand'
import type { Project, ProjectSummary, DiscoveredProject } from '../types/project'
import type { ConfigEntry } from '../types'
import type {
  ComparisonView,
  DiffResult,
  HighlightFilters,
  SummaryStats,
  DifferenceHighlighting,
} from '../types/comparison'
import type { ProjectHealth, SortBy, FilterBy, DashboardFilters, HealthMetrics } from '../types/health'
import { discoverProjects } from '../lib/projectDetection'

// Cache entry with timestamp
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Cache validity duration (5 minutes)
const CACHE_VALIDITY_MS = 5 * 60 * 1000

// LocalStorage key for persisting lastAccessed timestamps
const LAST_ACCESSED_STORAGE_KEY = 'cc-config-project-last-accessed'

interface ProjectsStore {
  projects: Project[]
  activeProject: Project | null

  // Per-project config cache
  projectConfigsCache: Record<string, CacheEntry<ConfigEntry[]>>

  // Story 2.5 - Multi-Project Navigation state
  isLoadingProjects: boolean
  projectsError: string | null
  sortOrder: 'recency' | 'name'

  // Story 5.2 - Comparison state
  comparison: {
    leftProject: DiscoveredProject | null
    rightProject: DiscoveredProject | null
    isComparing: boolean
    diffResults: DiffResult[]
    comparisonMode: 'capabilities' | 'settings' | 'all'

    // Story 5.3 - Highlighting state
    highlighting: {
      diffResults: DiffResult[] // Extended with highlightClass
      filters: HighlightFilters
      summary: SummaryStats
    }
  }

  // Story 5.4 - Dashboard state
  dashboard: {
    sortBy: SortBy
    filterBy: FilterBy
    selectedProjects: string[]
    healthMetrics: HealthMetrics[]
    isRefreshing: boolean
  }

  // Actions
  setActiveProject: (project: Project | null) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void

  // Cache actions
  cacheProjectConfigs: (projectPath: string, configs: ConfigEntry[]) => void
  getProjectConfigs: (projectPath: string) => ConfigEntry[] | null
  isProjectCacheValid: (projectPath: string) => boolean
  invalidateProjectCache: (projectPath?: string) => void

  // Story 2.5 - New actions
  loadProjects: () => Promise<void>
  updateProjectLastAccessed: (projectId: string) => void
  setSortOrder: (order: 'recency' | 'name') => void
  getProjectSummary: (projectId: string) => ProjectSummary | null

  // Story 5.2 - Comparison actions
  setComparisonProjects: (left: DiscoveredProject, right: DiscoveredProject) => void
  calculateDiff: () => Promise<void>
  clearComparison: () => void

  // Story 5.3 - Highlighting actions
  setHighlightFilters: (filters: Partial<HighlightFilters>) => void
  calculateSummaryStats: () => Promise<void>
  toggleDifferenceFilter: () => void
  categorizeDifferences: () => Promise<void>

  // Story 5.4 - Dashboard actions
  updateProjectHealth: (projectId: string) => Promise<void>
  setDashboardFilters: (filters: Partial<DashboardFilters>) => void
  refreshAllProjectHealth: () => Promise<void>
}

// Load persisted lastAccessed timestamps from localStorage
function loadPersistedLastAccessed(): Record<string, string> {
  try {
    const stored = localStorage.getItem(LAST_ACCESSED_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Persist lastAccessed timestamps to localStorage
function persistLastAccessed(projectId: string, timestamp: Date): void {
  try {
    const stored = loadPersistedLastAccessed()
    stored[projectId] = timestamp.toISOString()
    localStorage.setItem(LAST_ACCESSED_STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Failed to persist lastAccessed:', error)
  }
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  activeProject: null,
  projectConfigsCache: {},

  // Story 2.5 - Initial state
  isLoadingProjects: false,
  projectsError: null,
  sortOrder: 'recency',

  // Story 5.2 - Comparison state
  comparison: {
    leftProject: null,
    rightProject: null,
    isComparing: false,
    diffResults: [],
    comparisonMode: 'capabilities',

    // Story 5.3 - Highlighting state
    highlighting: {
      diffResults: [],
      filters: {
        showOnlyDifferences: false,
        showBlueOnly: true,
        showGreenOnly: true,
        showYellowOnly: true,
      },
      summary: {
        totalDifferences: 0,
        onlyInA: 0,
        onlyInB: 0,
        differentValues: 0,
      },
    },
  },

  // Story 5.4 - Dashboard initial state
  dashboard: {
    sortBy: 'health',
    filterBy: 'all',
    selectedProjects: [],
    healthMetrics: [],
    isRefreshing: false,
  },

  setActiveProject: (project) => set({ activeProject: project }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),

  // Cache project configs with timestamp
  cacheProjectConfigs: (projectPath, configs) =>
    set((state) => ({
      projectConfigsCache: {
        ...state.projectConfigsCache,
        [projectPath]: {
          data: configs,
          timestamp: Date.now()
        }
      }
    })),

  // Get cached configs (returns null if not cached)
  getProjectConfigs: (projectPath) => {
    const cache = get().projectConfigsCache[projectPath]
    return cache?.data ?? null
  },

  // Check if cache is still valid
  isProjectCacheValid: (projectPath) => {
    const cache = get().projectConfigsCache[projectPath]
    if (!cache) return false
    return Date.now() - cache.timestamp < CACHE_VALIDITY_MS
  },

  // Invalidate cache for specific project or all projects
  invalidateProjectCache: (projectPath) => {
    if (projectPath) {
      set((state) => {
        const newCache = { ...state.projectConfigsCache }
        delete newCache[projectPath]
        return { projectConfigsCache: newCache }
      })
    } else {
      set({ projectConfigsCache: {} })
    }
  },

  // Story 2.5 - Load all projects
  loadProjects: async () => {
    set({ isLoadingProjects: true, projectsError: null })

    try {
      const discoveredProjects = await discoverProjects()

      // Merge persisted lastAccessed timestamps
      const persistedLastAccessed = loadPersistedLastAccessed()
      const projectsWithPersistedTime = discoveredProjects.map((project) => {
        const persistedTime = persistedLastAccessed[project.id]
        if (persistedTime && !project.lastAccessed) {
          return { ...project, lastAccessed: new Date(persistedTime) }
        }
        return project
      })

      // Sort by current sort order
      const { sortOrder } = get()
      const sortedProjects = sortProjectsByOrder(projectsWithPersistedTime, sortOrder)

      set({
        projects: sortedProjects,
        isLoadingProjects: false,
      })
    } catch (error) {
      set({
        projectsError: error instanceof Error ? error.message : 'Failed to load projects',
        isLoadingProjects: false,
      })
    }
  },

  // Story 2.5 - Update project lastAccessed timestamp
  updateProjectLastAccessed: (projectId) => {
    const now = new Date()

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, lastAccessed: now } : p
      ),
    }))

    // Persist to localStorage
    persistLastAccessed(projectId, now)
  },

  // Story 2.5 - Set sort order
  setSortOrder: (order) => {
    set((state) => ({
      sortOrder: order,
      projects: sortProjectsByOrder(state.projects, order),
    }))
  },

  // Story 2.5 - Get project summary
  getProjectSummary: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return null

    return {
      project,
      mcpCount: project.mcpCount ?? 0,
      agentCount: project.agentCount ?? 0,
      lastAccessed: project.lastAccessed ?? null,
    }
  },

  // Story 5.2 - Comparison actions
  setComparisonProjects: (left, right) =>
    set((state) => ({
      comparison: {
        ...state.comparison,
        leftProject: left,
        rightProject: right,
        isComparing: true,
        diffResults: [],
      },
    })),

  calculateDiff: async () => {
    const { leftProject, rightProject } = get().comparison

    if (!leftProject || !rightProject) {
      console.warn('Cannot calculate diff: missing projects')
      return
    }

    try {
      // Call Rust backend to compare projects
      const { invoke } = await import('@tauri-apps/api/core')
      const diffResults = await invoke('compare_projects', {
        leftPath: leftProject.path,
        rightPath: rightProject.path,
      }) as DiffResult[]

      set((state) => ({
        comparison: {
          ...state.comparison,
          diffResults,
        },
      }))
    } catch (error) {
      console.error('Failed to calculate diff:', error)
      set((state) => ({
        comparison: {
          ...state.comparison,
          diffResults: [],
        },
      }))
    }
  },

  clearComparison: () =>
    set((state) => ({
      comparison: {
        leftProject: null,
        rightProject: null,
        isComparing: false,
        diffResults: [],
        comparisonMode: 'capabilities',
        highlighting: {
          diffResults: [],
          filters: {
            showOnlyDifferences: false,
            showBlueOnly: true,
            showGreenOnly: true,
            showYellowOnly: true,
          },
          summary: {
            totalDifferences: 0,
            onlyInA: 0,
            onlyInB: 0,
            differentValues: 0,
          },
        },
      },
    })),

  // Story 5.3 - Highlighting actions
  setHighlightFilters: (filters) =>
    set((state) => ({
      comparison: {
        ...state.comparison,
        highlighting: {
          ...state.comparison.highlighting,
          filters: {
            ...state.comparison.highlighting.filters,
            ...filters,
          },
        },
      },
    })),

  calculateSummaryStats: async () => {
    const { diffResults } = get().comparison

    if (diffResults.length === 0) {
      set((state) => ({
        comparison: {
          ...state.comparison,
          highlighting: {
            ...state.comparison.highlighting,
            summary: {
              totalDifferences: 0,
              onlyInA: 0,
              onlyInB: 0,
              differentValues: 0,
            },
          },
        },
      }))
      return
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const summary = await invoke('calculate_summary_stats', {
        diffResults,
      }) as SummaryStats

      set((state) => ({
        comparison: {
          ...state.comparison,
          highlighting: {
            ...state.comparison.highlighting,
            summary,
          },
        },
      }))
    } catch (error) {
      console.error('Failed to calculate summary stats:', error)
    }
  },

  toggleDifferenceFilter: () =>
    set((state) => ({
      comparison: {
        ...state.comparison,
        highlighting: {
          ...state.comparison.highlighting,
          filters: {
            ...state.comparison.highlighting.filters,
            showOnlyDifferences: !state.comparison.highlighting.filters.showOnlyDifferences,
          },
        },
      },
    })),

  categorizeDifferences: async () => {
    const { diffResults } = get().comparison

    if (diffResults.length === 0) {
      set((state) => ({
        comparison: {
          ...state.comparison,
          highlighting: {
            ...state.comparison.highlighting,
            diffResults: [],
          },
        },
      }))
      return
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const categorized = await invoke('categorize_differences', {
        diffResults,
      }) as DiffResult[]

      set((state) => ({
        comparison: {
          ...state.comparison,
          diffResults: categorized,
          highlighting: {
            ...state.comparison.highlighting,
            diffResults: categorized,
          },
        },
      }))
    } catch (error) {
      console.error('Failed to categorize differences:', error)
    }
  },

  // Story 5.4 - Dashboard actions
  updateProjectHealth: async (projectId) => {
    const { projects, dashboard } = get()
    const project = projects.find((p) => p.id === projectId || p.path === projectId)

    if (!project) {
      console.warn('Project not found for health update:', projectId)
      return
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const health = await invoke('health_check_project', {
        projectPath: project.path,
      }) as ProjectHealth

      set((state) => {
        const existingIndex = state.dashboard.healthMetrics.findIndex(
          (m) => m.projectId === projectId
        )
        const updatedMetrics = { ...health.metrics, projectId: project.id }

        let newHealthMetrics
        if (existingIndex >= 0) {
          newHealthMetrics = [...state.dashboard.healthMetrics]
          newHealthMetrics[existingIndex] = updatedMetrics
        } else {
          newHealthMetrics = [...state.dashboard.healthMetrics, updatedMetrics]
        }

        return {
          dashboard: {
            ...state.dashboard,
            healthMetrics: newHealthMetrics,
          },
        }
      })
    } catch (error) {
      console.error('Failed to update project health:', error)
    }
  },

  setDashboardFilters: (filters) =>
    set((state) => ({
      dashboard: {
        ...state.dashboard,
        ...filters,
      },
    })),

  refreshAllProjectHealth: async () => {
    const { projects } = get()

    if (projects.length === 0) {
      return
    }

    set((state) => ({
      dashboard: {
        ...state.dashboard,
        isRefreshing: true,
      },
    }))

    try {
      const { invoke } = await import('@tauri-apps/api/core')

      // Convert projects to DiscoveredProject format for backend
      const discoveredProjects = projects.map((p) => ({
        id: p.id,
        name: p.name,
        path: p.path,
        configFileCount: p.configFileCount || 0,
        lastModified: Math.floor((p.updatedAt?.getTime() || Date.now()) / 1000),
        configSources: {
          user: false,
          project: true,
          local: false,
        },
      }))

      const healthResults = await invoke('calculate_health_metrics', {
        projects: discoveredProjects,
      }) as ProjectHealth[]

      const healthMetrics = healthResults.map((health) => ({
        ...health.metrics,
        projectId: health.projectId,
      }))

      set((state) => ({
        dashboard: {
          ...state.dashboard,
          healthMetrics,
          isRefreshing: false,
        },
      }))
    } catch (error) {
      console.error('Failed to refresh project health:', error)
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          isRefreshing: false,
        },
      }))
    }
  },
}))

// Helper function to sort projects
function sortProjectsByOrder(projects: Project[], order: 'recency' | 'name'): Project[] {
  return [...projects].sort((a, b) => {
    if (order === 'recency') {
      const aTime = a.lastAccessed?.getTime() ?? 0
      const bTime = b.lastAccessed?.getTime() ?? 0
      return bTime - aTime
    } else {
      return a.name.localeCompare(b.name)
    }
  })
}
