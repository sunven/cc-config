/**
 * Type definitions for Story 3.5 - Inheritance Chain Summary
 *
 * Defines types for inheritance statistics and summary display components.
 */

import type { InheritanceStats } from '../utils/statsCalculator'

/// State for inheritance statistics in the config store
export interface InheritanceStatsState {
  stats: InheritanceStats | null
  isCalculating: boolean
  lastUpdated: number | null
  error: string | null
}

/// Selector for calculating stats (memoized for performance)
export interface CalculateStatsSelector {
  selector: (state: any) => InheritanceStats | null
  dependencies: any[]
}

/// Actions for managing inheritance statistics
export interface InheritanceStatsActions {
  updateStats: (stats: InheritanceStats) => void
  setCalculating: (isCalculating: boolean) => void
  setError: (error: string | null) => void
  clearStats: () => void
}