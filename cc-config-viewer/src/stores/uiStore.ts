import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type ScopeType = 'user' | 'project'

const isValidScope = (scope: unknown): scope is ScopeType => {
  return scope === 'user' || scope === 'project'
}

interface UiStore {
  currentScope: ScopeType
  isLoading: boolean
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  // View mode for inheritance display
  viewMode: 'merged' | 'split'
  setCurrentScope: (scope: ScopeType) => void
  setLoading: (loading: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setViewMode: (mode: 'merged' | 'split') => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      currentScope: 'user',
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      viewMode: 'merged',
      setCurrentScope: (scope) => set({ currentScope: scope }),
      setLoading: (loading) => set({ isLoading: loading }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'cc-config-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentScope: state.currentScope,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        viewMode: state.viewMode,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UiStore> | undefined
        return {
          ...currentState,
          ...persisted,
          // Validate scope - fallback to 'user' if invalid
          currentScope: persisted && isValidScope(persisted.currentScope)
            ? persisted.currentScope
            : 'user',
        }
      },
    }
  )
)
