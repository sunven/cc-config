import { create } from 'zustand'
import type { Project, ProjectSummary, DiscoveredProject } from '../types/project'
import type { ConfigEntry } from '../types'
import type { ComparisonView, DiffResult } from '../types/comparison'
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
      },
    })),
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
