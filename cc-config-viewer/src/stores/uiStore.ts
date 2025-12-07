import { create } from 'zustand'

interface UiStore {
  currentScope: 'user' | 'project'
  isLoading: boolean
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setCurrentScope: (scope: 'user' | 'project') => void
  setLoading: (loading: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  currentScope: 'user',
  isLoading: false,
  sidebarOpen: true,
  theme: 'light',
  setCurrentScope: (scope) => set({ currentScope: scope }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}))
