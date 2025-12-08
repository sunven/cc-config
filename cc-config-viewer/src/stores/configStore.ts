import { create } from 'zustand'
import type { ConfigEntry, InheritanceChain, InheritanceMap, InheritanceResult } from '../types'
import { readAndParseConfig, extractAllEntries, mergeConfigs } from '../lib/configParser'
import { calculateInheritance } from '../lib/inheritanceCalculator'

// Cache entry with timestamp for stale-while-revalidate pattern
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Cache validity duration (5 minutes)
const CACHE_VALIDITY_MS = 5 * 60 * 1000

interface ConfigStore {
  // Cached configs by scope
  userConfigsCache: CacheEntry<ConfigEntry[]> | null
  projectConfigsCache: Record<string, CacheEntry<ConfigEntry[]>>

  // Current display state
  configs: ConfigEntry[]
  inheritanceChain: InheritanceChain

  // New inheritance tracking for Story 3.2
  inheritanceMap: InheritanceMap
  viewMode: 'merged' | 'split'

  // Loading states - only for initial load, not for cached switches
  isInitialLoading: boolean
  isBackgroundLoading: boolean
  isLoading: boolean // Legacy alias for backward compatibility
  error: string | null

  // Actions
  loadUserConfigs: () => Promise<ConfigEntry[]>
  loadProjectConfigs: (projectPath?: string) => Promise<ConfigEntry[]>
  getConfigsForScope: (scope: 'user' | 'project', projectPath?: string) => ConfigEntry[]
  switchToScope: (scope: 'user' | 'project', projectPath?: string) => Promise<void>
  invalidateCache: (scope?: 'user' | 'project', projectPath?: string) => void

  // New inheritance actions for Story 3.2
  updateInheritanceChain: (userConfig: ConfigEntry[], projectConfig: ConfigEntry[]) => void
  setViewMode: (mode: 'merged' | 'split') => void

  // Legacy actions for compatibility
  updateConfigs: () => Promise<void>
  updateConfig: (key: string, value: any, sourceType: 'user' | 'project' | 'local') => void
  removeConfig: (path: string) => void
  clearConfigs: () => void

  // Cache utilities
  isCacheValid: (scope: 'user' | 'project', projectPath?: string) => boolean
  getLastFetchTime: (scope: 'user' | 'project', projectPath?: string) => number | null
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // Initial state
  userConfigsCache: null,
  projectConfigsCache: {},
  configs: [],
  inheritanceChain: { entries: [], resolved: {} },
  inheritanceMap: new Map(),
  viewMode: 'merged',
  isInitialLoading: true,
  isBackgroundLoading: false,
  isLoading: true, // Legacy alias - same as isInitialLoading
  error: null,

  // Check if cache is valid
  isCacheValid: (scope, projectPath) => {
    const state = get()
    if (scope === 'user') {
      if (!state.userConfigsCache) return false
      return Date.now() - state.userConfigsCache.timestamp < CACHE_VALIDITY_MS
    }
    const key = projectPath || 'default'
    const cache = state.projectConfigsCache[key]
    if (!cache) return false
    return Date.now() - cache.timestamp < CACHE_VALIDITY_MS
  },

  // Get last fetch time
  getLastFetchTime: (scope, projectPath) => {
    const state = get()
    if (scope === 'user') {
      return state.userConfigsCache?.timestamp ?? null
    }
    const key = projectPath || 'default'
    return state.projectConfigsCache[key]?.timestamp ?? null
  },

  // Load user configs with caching
  loadUserConfigs: async () => {
    const state = get()

    // Return cached data if valid
    if (state.isCacheValid('user')) {
      return state.userConfigsCache!.data
    }

    try {
      const config = await readAndParseConfig('~/.claude.json')
      const newConfigs = extractAllEntries(config, 'user')

      // Update cache
      set({
        userConfigsCache: {
          data: newConfigs,
          timestamp: Date.now()
        }
      })

      return newConfigs
    } catch (error) {
      console.error('[configStore] Failed to load user configs:', error)
      throw error
    }
  },

  // Load project configs with caching
  loadProjectConfigs: async (projectPath) => {
    const state = get()
    const cacheKey = projectPath || 'default'

    // Return cached data if valid
    if (state.isCacheValid('project', projectPath)) {
      return state.projectConfigsCache[cacheKey].data
    }

    try {
      const userConfig = await readAndParseConfig('~/.claude.json')
      const projectConfig = await readAndParseConfig('./.mcp.json')
      const newConfigs = mergeConfigs(userConfig, projectConfig)

      // Update cache
      set((prev) => ({
        projectConfigsCache: {
          ...prev.projectConfigsCache,
          [cacheKey]: {
            data: newConfigs,
            timestamp: Date.now()
          }
        }
      }))

      return newConfigs
    } catch (error) {
      console.error('[configStore] Failed to load project configs:', error)
      throw error
    }
  },

  // Get configs for scope from cache (synchronous, returns cached or empty)
  getConfigsForScope: (scope, projectPath) => {
    const state = get()
    if (scope === 'user') {
      return state.userConfigsCache?.data ?? []
    }
    const key = projectPath || 'default'
    return state.projectConfigsCache[key]?.data ?? []
  },

  // Switch to scope - uses cache first, then background updates if stale
  switchToScope: async (scope, projectPath) => {
    const state = get()

    // Check cache first - instant switch if cached
    const cachedConfigs = state.getConfigsForScope(scope, projectPath)
    const cacheValid = state.isCacheValid(scope, projectPath)

    if (cachedConfigs.length > 0) {
      // Instant update from cache
      set({
        configs: cachedConfigs,
        inheritanceChain: {
          entries: cachedConfigs,
          resolved: cachedConfigs.reduce((acc, config) => {
            acc[config.key] = config.value
            return acc
          }, {} as Record<string, any>)
        },
        isInitialLoading: false,
        isLoading: false,
        error: null
      })

      // If cache is stale, revalidate in background (stale-while-revalidate)
      if (!cacheValid) {
        set({ isBackgroundLoading: true })
        try {
          const freshConfigs = scope === 'user'
            ? await state.loadUserConfigs()
            : await state.loadProjectConfigs(projectPath)

          // Only update if still on same scope
          const currentState = get()
          if (currentState.configs === cachedConfigs ||
              JSON.stringify(currentState.configs) === JSON.stringify(cachedConfigs)) {
            set({
              configs: freshConfigs,
              inheritanceChain: {
                entries: freshConfigs,
                resolved: freshConfigs.reduce((acc, config) => {
                  acc[config.key] = config.value
                  return acc
                }, {} as Record<string, any>)
              },
              isBackgroundLoading: false
            })
          }
        } catch (error) {
          set({ isBackgroundLoading: false })
          console.error('[configStore] Background revalidation failed:', error)
        }
      }
    } else {
      // No cache - need to load
      set({ isInitialLoading: true, isLoading: true, error: null })
      try {
        const newConfigs = scope === 'user'
          ? await state.loadUserConfigs()
          : await state.loadProjectConfigs(projectPath)

        set({
          configs: newConfigs,
          inheritanceChain: {
            entries: newConfigs,
            resolved: newConfigs.reduce((acc, config) => {
              acc[config.key] = config.value
              return acc
            }, {} as Record<string, any>)
          },
          isInitialLoading: false,
          isLoading: false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          isInitialLoading: false,
          isLoading: false
        })
      }
    }
  },

  // Invalidate cache - called when file changes detected
  invalidateCache: (scope, projectPath) => {
    if (!scope) {
      // Invalidate all caches
      set({
        userConfigsCache: null,
        projectConfigsCache: {}
      })
    } else if (scope === 'user') {
      set({ userConfigsCache: null })
    } else {
      const key = projectPath || 'default'
      set((prev) => {
        const newCache = { ...prev.projectConfigsCache }
        delete newCache[key]
        return { projectConfigsCache: newCache }
      })
    }
  },

  // Legacy updateConfigs - for backward compatibility with existing code
  updateConfigs: async () => {
    const { useUiStore } = await import('./uiStore')
    const { currentScope } = useUiStore.getState()
    const state = get()

    // Invalidate cache for current scope to force fresh load
    state.invalidateCache(currentScope)

    // Load fresh data
    await state.switchToScope(currentScope)
  },

  updateConfig: (key, value, sourceType) =>
    set((state) => {
      const newConfig: ConfigEntry = {
        key,
        value,
        source: { type: sourceType, path: '', priority: sourceType === 'user' ? 1 : sourceType === 'project' ? 2 : 3 },
      }
      const newConfigs = [...state.configs]
      const existingIndex = newConfigs.findIndex((c) => c.key === key)
      if (existingIndex >= 0) {
        newConfigs[existingIndex] = newConfig
      } else {
        newConfigs.push(newConfig)
      }

      // Also invalidate cache since we're modifying
      return {
        configs: newConfigs,
        userConfigsCache: null,
        projectConfigsCache: {}
      }
    }),

  removeConfig: (path: string) =>
    set((state) => ({
      configs: state.configs.filter((c) => c.source.path !== path),
      // Invalidate cache when removing
      userConfigsCache: null,
      projectConfigsCache: {}
    })),

  clearConfigs: () => set({
    configs: [],
    inheritanceChain: { entries: [], resolved: {} },
    inheritanceMap: new Map(),
    error: null,
    isInitialLoading: false,
    isLoading: false,
    userConfigsCache: null,
    projectConfigsCache: {}
  }),

  // New inheritance methods for Story 3.2
  updateInheritanceChain: (userConfig: ConfigEntry[], projectConfig: ConfigEntry[]) => {
    // Convert ConfigEntry[] to simple format for calculateInheritance
    const userItems = userConfig.map(c => ({ key: c.key, value: c.value }))
    const projectItems = projectConfig.map(c => ({ key: c.key, value: c.value }))

    // Calculate inheritance
    const result = calculateInheritance(userItems, projectItems)

    // Build inheritance map
    const inheritanceMap = new Map<string, any>()

    // Add inherited configs
    result.inherited.forEach(item => {
      inheritanceMap.set(item.key, {
        configKey: item.key,
        currentValue: item.value,
        classification: 'inherited' as const,
        sourceType: 'project' as const,
        inheritedFrom: '~/.claude.json',
        isOverridden: false
      })
    })

    // Add overridden configs
    result.overridden.forEach(item => {
      inheritanceMap.set(item.key, {
        configKey: item.key,
        currentValue: item.value,
        classification: 'override' as const,
        sourceType: 'project' as const,
        originalValue: item.originalValue,
        isOverridden: true
      })
    })

    // Add project-specific configs
    result.projectSpecific.forEach(item => {
      inheritanceMap.set(item.key, {
        configKey: item.key,
        currentValue: item.value,
        classification: 'project-specific' as const,
        sourceType: 'project' as const,
        isOverridden: false
      })
    })

    set({ inheritanceMap })
  },

  setViewMode: (mode: 'merged' | 'split') => set({ viewMode: mode }),
}))
