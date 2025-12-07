import { create } from 'zustand'
import type { ConfigEntry, InheritanceChain } from '../types'
import { readAndParseConfig, extractAllEntries, mergeConfigs } from '../lib/configParser'
import { useUiStore } from './uiStore'

interface ConfigStore {
  configs: ConfigEntry[]
  inheritanceChain: InheritanceChain
  isLoading: boolean
  error: string | null
  updateConfigs: () => Promise<void>
  updateConfig: (key: string, value: any, sourceType: 'user' | 'project' | 'local') => void
  clearConfigs: () => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  configs: [],
  inheritanceChain: { entries: [], resolved: {} },
  isLoading: false,
  error: null,
  updateConfigs: async () => {
    const { currentScope } = useUiStore.getState()
    set({ isLoading: true, error: null })

    try {
      let newConfigs: ConfigEntry[]

      if (currentScope === 'project') {
        // For project scope, merge user and project configurations
        const userConfig = await readAndParseConfig('~/.claude.json')
        const projectConfig = await readAndParseConfig('./.mcp.json')
        newConfigs = mergeConfigs(userConfig, projectConfig)
      } else if (currentScope === 'user') {
        // For user scope, only load user configuration
        const config = await readAndParseConfig('~/.claude.json')
        newConfigs = extractAllEntries(config, 'user')
      } else {
        // For local scope, only load local configuration
        const config = await readAndParseConfig('./local-config.json')
        newConfigs = extractAllEntries(config, 'local')
      }

      set(() => ({
        configs: newConfigs,
        inheritanceChain: {
          entries: newConfigs,
          resolved: newConfigs.reduce((acc, config) => {
            acc[config.key] = config.value
            return acc
          }, {} as Record<string, any>),
        },
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      })
    }
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
      return { configs: newConfigs }
    }),
  clearConfigs: () => set({ configs: [], inheritanceChain: { entries: [], resolved: {} }, error: null }),
}))
