import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { LoadingIndicator } from '../lib/loadingTypes'

type ScopeType = 'user' | 'project'

const isValidScope = (scope: unknown): scope is ScopeType => {
  return scope === 'user' || scope === 'project'
}

interface UiStore {
  currentScope: ScopeType
  isLoading: boolean
  loadingMessage: string | null
  isInitialLoading: boolean
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  // View mode for inheritance display
  viewMode: 'merged' | 'split'
  // Export state
  export: {
    isExporting: boolean
    exportProgress: number
    exportFormat: 'json' | 'markdown' | 'csv'
    exportOptions: {
      includeInherited: boolean
      includeMCP: boolean
      includeAgents: boolean
      includeMetadata: boolean
    }
    lastExportPath?: string
  }
  // Onboarding state
  hasSeenOnboarding: boolean
  isOnboardingActive: boolean
  currentOnboardingStep: number
  setCurrentScope: (scope: ScopeType) => void
  setLoading: (loading: boolean) => void
  setLoadingMessage: (message: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setViewMode: (mode: 'merged' | 'split') => void
  // Global loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void
  // Export actions
  startExport: (format: 'json' | 'markdown' | 'csv', options: any) => void
  setExportProgress: (progress: number) => void
  completeExport: (filePath: string) => void
  cancelExport: () => void
  resetExportState: () => void
  // Onboarding actions
  setOnboardingActive: (active: boolean) => void
  setOnboardingStep: (step: number) => void
  setHasSeenOnboarding: (hasSeen: boolean) => void
  startOnboarding: () => void
  completeOnboarding: () => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      currentScope: 'user',
      isLoading: false,
      loadingMessage: null,
      isInitialLoading: false,
      sidebarOpen: true,
      theme: 'light',
      viewMode: 'merged',
      export: {
        isExporting: false,
        exportProgress: 0,
        exportFormat: 'json',
        exportOptions: {
          includeInherited: true,
          includeMCP: true,
          includeAgents: true,
          includeMetadata: true,
        },
        lastExportPath: undefined,
      },
      // Onboarding state
      hasSeenOnboarding: false,
      isOnboardingActive: false,
      currentOnboardingStep: 0,
      setCurrentScope: (scope) => set({ currentScope: scope }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingMessage: (message) => set({ loadingMessage: message }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setGlobalLoading: (loading, message) =>
        set({
          isLoading: loading,
          loadingMessage: loading ? message || null : null,
        }),
      startExport: (format, options) =>
        set((state) => ({
          export: {
            ...state.export,
            isExporting: true,
            exportProgress: 0,
            exportFormat: format,
            exportOptions: options,
          },
        })),
      setExportProgress: (progress) =>
        set((state) => ({
          export: {
            ...state.export,
            exportProgress: progress,
          },
        })),
      completeExport: (filePath) =>
        set((state) => ({
          export: {
            ...state.export,
            isExporting: false,
            exportProgress: 100,
            lastExportPath: filePath,
          },
        })),
      cancelExport: () =>
        set((state) => ({
          export: {
            ...state.export,
            isExporting: false,
            exportProgress: 0,
          },
        })),
      resetExportState: () =>
        set((state) => ({
          export: {
            ...state.export,
            isExporting: false,
            exportProgress: 0,
            lastExportPath: undefined,
          },
        })),
      // Onboarding actions
      setOnboardingActive: (active) => set({ isOnboardingActive: active }),
      setOnboardingStep: (step) => set({ currentOnboardingStep: step }),
      setHasSeenOnboarding: (hasSeen) => {
        set({ hasSeenOnboarding: hasSeen })
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          try {
            const onboardingData = {
              hasSeen,
              version: '1.0.0',
              completedAt: hasSeen ? new Date().toISOString() : null,
            }
            localStorage.setItem('cc-config-onboarding', JSON.stringify(onboardingData))
          } catch (error) {
            console.warn('Failed to persist onboarding status:', error)
          }
        }
      },
      startOnboarding: () =>
        set({
          isOnboardingActive: true,
          currentOnboardingStep: 0,
        }),
      completeOnboarding: () =>
        set({
          hasSeenOnboarding: true,
          isOnboardingActive: false,
          currentOnboardingStep: 0,
        }),
    }),
    {
      name: 'cc-config-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentScope: state.currentScope,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        viewMode: state.viewMode,
        hasSeenOnboarding: state.hasSeenOnboarding,
        currentOnboardingStep: state.currentOnboardingStep,
        // Note: loadingMessage, isInitialLoading, and isOnboardingActive are NOT persisted
        // They are reset on app restart for clean state
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
          // Validate hasSeenOnboarding - ensure it's a boolean
          hasSeenOnboarding:
            typeof persisted?.hasSeenOnboarding === 'boolean'
              ? persisted.hasSeenOnboarding
              : false,
          // Validate currentOnboardingStep - ensure it's a number
          currentOnboardingStep:
            typeof persisted?.currentOnboardingStep === 'number'
              ? Math.max(0, persisted.currentOnboardingStep)
              : 0,
          // Reset loading state on app restart
          isLoading: false,
          loadingMessage: null,
          isInitialLoading: false,
          // Reset onboarding state on app restart
          isOnboardingActive: false,
        }
      },
    }
  )
)
