import { create } from 'zustand'
import type { ConfigEntry, InheritanceChain, InheritanceMap, InheritanceResult, InheritanceChainItem } from '../types'
import type { SourceLocation } from '../types/trace'
import type { InheritanceStats } from '../utils/statsCalculator'
import type { InheritanceStatsState } from '../types/inheritance-summary'
import type { McpServer } from '../types/mcp'
import type { Agent, AgentFilterState, AgentSortState } from '../types/agent'
import type { UnifiedCapability, CapabilityFilterState, CapabilitySortState } from '../types/capability'
import type { CapabilityStats } from '../lib/capabilityStats'
import { readAndParseConfig, extractAllEntries, mergeConfigs, parseMcpServers } from '../lib/configParser'
import { parseAgents } from '../lib/agentParser'
import { calculateInheritance } from '../lib/inheritanceCalculator'
import { calculateStats } from '../utils/statsCalculator'
import { unifyCapabilities, filterCapabilities as filterUnifiedCapabilities, sortCapabilities as sortUnifiedCapabilities } from '../lib/capabilityUnifier'
import { calculateCapabilityStats } from '../lib/capabilityStats'

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
  classifiedEntries: Array<InheritanceChainItem>
  viewMode: 'merged' | 'split'

  // Source location tracking for Story 3.4
  sourceLocations: Record<string, SourceLocation>

  // Inheritance statistics for Story 3.5
  inheritanceStats: InheritanceStatsState

  // MCP servers for Story 4.1
  mcpServers: McpServer[]
  mcpServersByScope: {
    user: McpServer[]
    project: McpServer[]
    local: McpServer[]
  }
  mcpStatusRefreshInterval: number | null

  // Agents for Story 4.2
  agents: Agent[]
  agentsByScope: {
    user: Agent[]
    project: Agent[]
    local: Agent[]
  }

  // Unified capabilities for Story 4.3
  capabilities: UnifiedCapability[]

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

  // Source location actions for Story 3.4
  setSourceLocation: (configKey: string, location: SourceLocation) => void
  getSourceLocation: (configKey: string) => SourceLocation | undefined
  clearSourceLocations: () => void
  removeSourceLocation: (configKey: string) => void

  // Inheritance statistics actions for Story 3.5
  updateStats: (stats: InheritanceStats) => void
  setStatsCalculating: (isCalculating: boolean) => void
  setStatsError: (error: string | null) => void
  clearStats: () => void
  calculateStatsFromChain: (chain?: InheritanceChain) => InheritanceStats | null
  selectStats: () => InheritanceStats | null

  // MCP server actions for Story 4.1
  updateMcpServers: () => Promise<void>
  filterMcpServers: (filters: { source?: string; type?: string; status?: string; search?: string }) => McpServer[]
  sortMcpServers: (servers: McpServer[], sort: { field: string; direction: 'asc' | 'desc' }) => McpServer[]
  startMcpStatusRefresh: () => void
  stopMcpStatusRefresh: () => void

  // Agent actions for Story 4.2
  updateAgents: () => Promise<void>
  filterAgents: (filters: AgentFilterState) => Agent[]
  sortAgents: (agents: Agent[], sort: AgentSortState) => Agent[]

  // Unified capability actions for Story 4.3
  updateCapabilities: () => Promise<void>
  getCapabilities: (type?: 'all' | 'mcp' | 'agent') => UnifiedCapability[]
  filterCapabilities: (filters: CapabilityFilterState) => UnifiedCapability[]
  searchCapabilities: (query: string) => UnifiedCapability[]
  sortCapabilities: (capabilities: UnifiedCapability[], sort: CapabilitySortState) => UnifiedCapability[]

  // Capability statistics for Story 4.5
  getCapabilityStats: (scope?: 'user' | 'project') => CapabilityStats

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
  classifiedEntries: [],
  viewMode: 'merged',
  sourceLocations: {},
  inheritanceStats: {
    stats: null,
    isCalculating: false,
    lastUpdated: null,
    error: null
  },
  mcpServers: [],
  mcpServersByScope: {
    user: [],
    project: [],
    local: []
  },
  mcpStatusRefreshInterval: null,
  agents: [],
  agentsByScope: {
    user: [],
    project: [],
    local: []
  },
  capabilities: [],
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

      // Update inheritance classification and calculate stats
      // For stats calculation, we need both user and project configs
      const userConfig = state.userConfigsCache?.data || []
      if (scope === 'project' && userConfig.length > 0) {
        state.updateInheritanceChain(userConfig, cachedConfigs)
        state.calculateStatsFromChain()
      }

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

            // Update inheritance classification and calculate stats
            // For stats calculation, we need both user and project configs
            const userConfig = currentState.userConfigsCache?.data || []
            if (scope === 'project' && userConfig.length > 0) {
              currentState.updateInheritanceChain(userConfig, freshConfigs)
              currentState.calculateStatsFromChain()
            }
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

        // Update inheritance classification and calculate stats
        // For stats calculation, we need both user and project configs
        const userConfig = state.userConfigsCache?.data || []
        if (scope === 'project' && userConfig.length > 0) {
          state.updateInheritanceChain(userConfig, newConfigs)
          state.calculateStatsFromChain()
        }
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

  clearConfigs: () => {
    const state = get()
    if (state.mcpStatusRefreshInterval) {
      clearInterval(state.mcpStatusRefreshInterval)
    }
    set({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      inheritanceMap: new Map(),
      classifiedEntries: [],
      sourceLocations: {},
      inheritanceStats: {
        stats: null,
        isCalculating: false,
        lastUpdated: null,
        error: null
      },
      mcpServers: [],
      mcpServersByScope: {
        user: [],
        project: [],
        local: []
      },
      mcpStatusRefreshInterval: null,
      agents: [],
      agentsByScope: {
        user: [],
        project: [],
        local: []
      },
      capabilities: [],
      error: null,
      isInitialLoading: false,
      isLoading: false,
      userConfigsCache: null,
      projectConfigsCache: {}
    })
  },

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

    // Convert map to array for easier consumption
    const classifiedEntries = Array.from(inheritanceMap.values())

    set({
      inheritanceMap,
      classifiedEntries
    })
  },

  setViewMode: (mode: 'merged' | 'split') => set({ viewMode: mode }),

  // Source location methods for Story 3.4
  setSourceLocation: (configKey: string, location: SourceLocation) =>
    set((state) => ({
      sourceLocations: {
        ...state.sourceLocations,
        [configKey]: location
      }
    })),

  getSourceLocation: (configKey: string) => {
    const state = get()
    return state.sourceLocations[configKey]
  },

  clearSourceLocations: () => set({ sourceLocations: {} }),

  removeSourceLocation: (configKey: string) =>
    set((state) => {
      const newLocations = { ...state.sourceLocations }
      delete newLocations[configKey]
      return { sourceLocations: newLocations }
    }),

  // Inheritance statistics methods for Story 3.5
  updateStats: (stats: InheritanceStats) =>
    set({
      inheritanceStats: {
        stats,
        isCalculating: false,
        lastUpdated: Date.now(),
        error: null
      }
    }),

  setStatsCalculating: (isCalculating: boolean) =>
    set((state) => ({
      inheritanceStats: {
        ...state.inheritanceStats,
        isCalculating
      }
    })),

  setStatsError: (error: string | null) =>
    set((state) => ({
      inheritanceStats: {
        ...state.inheritanceStats,
        error,
        isCalculating: false
      }
    })),

  clearStats: () =>
    set((state) => ({
      inheritanceStats: {
        stats: null,
        isCalculating: false,
        lastUpdated: null,
        error: null
      }
    })),

  calculateStatsFromChain: (chain?: InheritanceChain): InheritanceStats | null => {
    const state = get()
    // Use classifiedEntries which has the proper classification
    const classifiedEntries = state.classifiedEntries

    if (classifiedEntries.length === 0) {
      state.clearStats()
      return null
    }

    try {
      const stats = calculateStats(classifiedEntries)
      state.updateStats(stats)
      return stats
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate stats'
      state.setStatsError(errorMessage)
      return null
    }
  },

  selectStats: () => {
    const state = get()
    return state.inheritanceStats.stats
  },

  // MCP server actions for Story 4.1
  updateMcpServers: async () => {
    try {
      const userConfig = await readAndParseConfig('~/.claude.json')
      const projectConfig = await readAndParseConfig('./.mcp.json')

      const { userMcpServers, projectMcpServers, inheritedMcpServers } = parseMcpServers(
        userConfig,
        projectConfig
      )

      set({
        mcpServers: [...userMcpServers, ...projectMcpServers],
        mcpServersByScope: {
          user: userMcpServers,
          project: projectMcpServers,
          local: inheritedMcpServers
        }
      })
    } catch (error) {
      console.error('[configStore] Failed to update MCP servers:', error)
      set({
        error: `Failed to update MCP servers: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      // Don't throw - MCP servers are optional
    }
  },

  startMcpStatusRefresh: () => {
    const state = get()
    if (state.mcpStatusRefreshInterval) {
      clearInterval(state.mcpStatusRefreshInterval)
    }

    // Refresh every 30 seconds as per architecture requirements
    const interval = window.setInterval(() => {
      state.updateMcpServers()
    }, 30000)

    set({ mcpStatusRefreshInterval: interval })
  },

  stopMcpStatusRefresh: () => {
    const state = get()
    if (state.mcpStatusRefreshInterval) {
      clearInterval(state.mcpStatusRefreshInterval)
      set({ mcpStatusRefreshInterval: null })
    }
  },

  filterMcpServers: (filters) => {
    const state = get()
    let filtered = [...state.mcpServers]

    if (filters.source) {
      filtered = filtered.filter(server => {
        // User-level: ~/.claude.json (absolute path, not starting with ./)
        const isUser = server.sourcePath.includes('.claude.json') && !server.sourcePath.startsWith('./')
        // Project-level: ./.mcp.json or ./.claude.json (relative path starting with ./)
        const isProject = server.sourcePath.startsWith('./')
        // Local/inherited (any other path)
        const isLocal = !isUser && !isProject

        switch (filters.source) {
          case 'user':
            return isUser
          case 'project':
            return isProject
          case 'local':
            return isLocal
          default:
            return true
        }
      })
    }

    if (filters.type) {
      filtered = filtered.filter(server => server.type === filters.type)
    }

    if (filters.status) {
      filtered = filtered.filter(server => server.status === filters.status)
    }

    if (filters.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(query) ||
        server.description?.toLowerCase().includes(query) ||
        server.type.toLowerCase().includes(query)
      )
    }

    return filtered
  },

  sortMcpServers: (servers, sort) => {
    return [...servers].sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sort.field) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'source':
          aValue = a.sourcePath
          bValue = b.sourcePath
          break
        default:
          return 0
      }

      const comparison = aValue.localeCompare(bValue)
      return sort.direction === 'asc' ? comparison : -comparison
    })
  },

  // Agent actions for Story 4.2
  updateAgents: async () => {
    try {
      const { userAgents, projectAgents, inheritedAgents } = await parseAgents()

      set({
        agents: [...userAgents, ...projectAgents],
        agentsByScope: {
          user: userAgents,
          project: projectAgents,
          local: inheritedAgents
        }
      })
    } catch (error) {
      console.error('[configStore] Failed to update agents:', error)
      set({
        error: `Failed to update agents: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      // Don't throw - agents are optional
    }
  },

  filterAgents: (filters) => {
    const state = get()
    let filtered = [...state.agents]

    if (filters.source) {
      filtered = filtered.filter(agent => {
        // User-level: ~/.claude/agents/*.md (absolute path, not starting with ./)
        const isUser = agent.sourcePath.includes('.claude/agents/') && !agent.sourcePath.startsWith('./')
        // Project-level: ./.claude/agents/*.md (relative path starting with ./)
        const isProject = agent.sourcePath.startsWith('./')
        // Local/inherited (any other path)
        const isLocal = !isUser && !isProject

        switch (filters.source) {
          case 'user':
            return isUser
          case 'project':
            return isProject
          case 'local':
            return isLocal
          default:
            return true
        }
      })
    }

    if (filters.permissions) {
      filtered = filtered.filter(agent => agent.permissions.type === filters.permissions)
    }

    if (filters.status) {
      filtered = filtered.filter(agent => agent.status === filters.status)
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query) ||
        agent.permissions.type.toLowerCase().includes(query)
      )
    }

    return filtered
  },

  sortAgents: (agents, sort) => {
    return [...agents].sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sort.field) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'permissions':
          aValue = a.permissions.type
          bValue = b.permissions.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'source':
          aValue = a.sourcePath
          bValue = b.sourcePath
          break
        case 'lastModified':
          aValue = a.lastModified?.toISOString() || ''
          bValue = b.lastModified?.toISOString() || ''
          break
        default:
          return 0
      }

      const comparison = aValue.localeCompare(bValue)
      return sort.direction === 'asc' ? comparison : -comparison
    })
  },

  // Unified capability actions for Story 4.3
  updateCapabilities: async () => {
    const state = get()

    try {
      // Ensure MCP servers and agents are loaded
      await Promise.all([state.updateMcpServers(), state.updateAgents()])

      // Unify MCP servers and agents into capabilities
      const { capabilities } = unifyCapabilities(state.mcpServers, state.agents)

      set({ capabilities })
    } catch (error) {
      console.error('[configStore] Failed to update capabilities:', error)
      set({
        error: `Failed to update capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      // Don't throw - capabilities are optional
    }
  },

  getCapabilities: (type = 'all') => {
    const state = get()
    if (type === 'all') {
      return state.capabilities
    }
    return state.capabilities.filter(cap => cap.type === type)
  },

  filterCapabilities: (filters) => {
    const state = get()
    return filterUnifiedCapabilities(state.capabilities, filters)
  },

  searchCapabilities: (query) => {
    const state = get()
    return filterUnifiedCapabilities(state.capabilities, { searchQuery: query })
  },

  sortCapabilities: (capabilities, sort) => {
    return sortUnifiedCapabilities(capabilities, sort)
  },

  // Capability statistics for Story 4.5
  getCapabilityStats: (scope) => {
    const state = get()
    // Get capabilities filtered by scope (or all if no scope specified)
    const capabilities = scope
      ? state.capabilities.filter(cap => cap.source === scope)
      : state.capabilities

    // Calculate and return stats, passing inheritance map if available
    return calculateCapabilityStats(capabilities, scope, state.inheritanceMap)
  },
}))
