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
}

export type DiffStatus = 'match' | 'different' | 'conflict' | 'only-left' | 'only-right'

export type DiffSeverity = 'low' | 'medium' | 'high'

export interface Capability {
  id: string
  key: string
  value: any
  source: string
}

// Re-export DiscoveredProject from project.ts for convenience
import type { DiscoveredProject } from './project'
export type { DiscoveredProject }