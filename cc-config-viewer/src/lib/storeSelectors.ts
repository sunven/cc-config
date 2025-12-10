/**
 * Store Selector Optimizations
 *
 * Provides optimized selectors with shallow comparison to prevent unnecessary re-renders
 */

import { createSelector } from 'zustand/vanilla'
import { shallow } from 'zustand/vanilla/shallow'

// Re-export shallow for convenience
export { shallow }

/**
 * Creates a shallow comparison selector for a Zustand store
 *
 * @param selector - Function that returns selected state
 * @returns Selector with shallow comparison
 */
export function createShallowSelector<T, Selected>(
  selector: (state: T) => Selected
) {
  return createSelector([selector], (selected) => selected, {
    equalityFn: shallow,
  })
}

/**
 * Optimized UI store selectors with shallow comparison
 *
 * These selectors prevent unnecessary re-renders when multiple related fields
 * are selected together.
 */

// Loading state selector with shallow comparison
export const selectLoadingState = (state: any) => ({
  isLoading: state.isLoading,
  loadingMessage: state.loadingMessage,
})

export const useLoadingState = createShallowSelector(selectLoadingState)

// Onboarding state selector with shallow comparison
export const selectOnboardingState = (state: any) => ({
  hasSeenOnboarding: state.hasSeenOnboarding,
  isOnboardingActive: state.isOnboardingActive,
  currentOnboardingStep: state.currentOnboardingStep,
})

export const useOnboardingState = createShallowSelector(selectOnboardingState)

// UI state selector with shallow comparison
export const selectUiState = (state: any) => ({
  currentScope: state.currentScope,
  theme: state.theme,
  sidebarOpen: state.sidebarOpen,
  viewMode: state.viewMode,
})

export const useUiState = createShallowSelector(selectUiState)

// Config state selector with shallow comparison
export const selectConfigState = (state: any) => ({
  configs: state.configs,
  inheritanceMap: state.inheritanceMap,
  inheritanceStats: state.inheritanceStats,
  classifiedEntries: state.classifiedEntries,
})

export const useConfigState = createShallowSelector(selectConfigState)

// Projects state selector with shallow comparison
export const selectProjectsState = (state: any) => ({
  projects: state.projects,
  activeProject: state.activeProject,
  comparison: state.comparison,
})

export const useProjectsState = createShallowSelector(selectProjectsState)

/**
 * Example usage in components:
 *
 * Instead of:
 * ```typescript
 * const { isLoading, loadingMessage } = useUiStore()
 * // Re-renders every time any store field changes
 * ```
 *
 * Use:
 * ```typescript
 * const { isLoading, loadingMessage } = useLoadingState()
 * // Only re-renders when isLoading or loadingMessage changes
 * ```
 *
 * Or with direct shallow comparison:
 * ```typescript
 * const { isLoading, loadingMessage } = useUiStore(
 *   (state) => ({ isLoading: state.isLoading, loadingMessage: state.loadingMessage }),
 *   shallow
 * )
 * ```
 */

/**
 * Optimized selectors for specific use cases
 */

// Single value selectors (no shallow comparison needed)
export const selectCurrentScope = (state: any) => state.currentScope
export const selectIsLoading = (state: any) => state.isLoading
export const selectActiveProject = (state: any) => state.activeProject

// Derived selectors with memoization
export const selectHasActiveProject = createSelector(
  [selectActiveProject],
  (activeProject) => activeProject != null
)

// Complex state selector for capability panel
export const selectCapabilityState = (state: any) => ({
  capabilities: state.capabilities,
  filteredCapabilities: state.filteredCapabilities,
  sortState: state.sortState,
  filterState: state.filterState,
})

export const useCapabilityState = createShallowSelector(selectCapabilityState)
