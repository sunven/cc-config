export interface ComparisonView {
  leftProject: DiscoveredProject | null
  rightProject: DiscoveredProject | null
  diffResults: DiffResult[]
  comparisonMode: ComparisonMode
  isComparing: boolean
}

export type ComparisonMode = 'capabilities' | 'settings' | 'all'

export interface DiffResult {
  capabilityId: string
  leftValue?: Capability
  rightValue?: Capability
  status: DiffStatus
  severity: DiffSeverity
  highlightClass?: string // CSS class for visual highlighting
}

export type DiffStatus = 'match' | 'different' | 'conflict' | 'only-left' | 'only-right'

export type DiffSeverity = 'low' | 'medium' | 'high'

export interface Capability {
  id: string
  key: string
  value: any
  source: string
}

// Highlighting configuration for difference visualization
export interface HighlightFilters {
  showOnlyDifferences: boolean
  showBlueOnly: boolean // Only in A
  showGreenOnly: boolean // Only in B
  showYellowOnly: boolean // Different values
}

// Summary statistics for difference highlighting
export interface SummaryStats {
  totalDifferences: number
  onlyInA: number
  onlyInB: number
  differentValues: number
}

// Difference highlighting configuration and state
export interface DifferenceHighlighting {
  diffResults: DiffResult[]
  filters: HighlightFilters
  summary: SummaryStats
}

// Highlighting CSS class constants
export const HIGHLIGHT_CLASSES = {
  BLUE: 'bg-blue-100 text-blue-800', // Only in A
  GREEN: 'bg-green-100 text-green-800', // Only in B
  YELLOW: 'bg-yellow-100 text-yellow-800', // Different values
  NONE: '', // No highlighting for matches
} as const

// Re-export DiscoveredProject from project.ts for convenience
import type { DiscoveredProject } from './project'
export type { DiscoveredProject }