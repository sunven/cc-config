import { create } from 'zustand'
import type { ConfigEntry } from '../types'

interface ConfigStore {
  configs: Record<string, ConfigEntry>
  scope: 'user' | 'project' | 'local'
  setScope: (scope: 'user' | 'project' | 'local') => void
  updateConfig: (key: string, value: any, sourceType: 'user' | 'project' | 'local') => void
  clearConfigs: () => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  configs: {},
  scope: 'user',
  setScope: (scope) => set({ scope }),
  updateConfig: (key, value, sourceType) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [key]: {
          key,
          value,
          source: { type: sourceType, path: '', priority: sourceType === 'user' ? 1 : sourceType === 'project' ? 2 : 3 },
        },
      },
    })),
  clearConfigs: () => set({ configs: {} }),
}))
