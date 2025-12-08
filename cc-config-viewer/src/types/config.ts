export interface ConfigSource {
  type: 'user' | 'project' | 'inherited'
  path: string
  priority: number
}

export interface ConfigEntry {
  key: string
  value: any
  source: ConfigSource
  inherited?: boolean
  overridden?: boolean
}

export interface InheritanceChain {
  entries: ConfigEntry[]
  resolved: Record<string, any>
}

// New inheritance chain item interface for Story 3.2
export interface InheritanceChainItem {
  configKey: string
  currentValue: unknown
  classification: 'inherited' | 'override' | 'project-specific'
  sourceType: ConfigSource['type']
  inheritedFrom?: string  // e.g., "~/.claude.json"
  originalValue?: unknown // For overrides, the user-level value
  isOverridden: boolean
}

export type InheritanceMap = Map<string, InheritanceChainItem>

// Inheritance calculation result
export interface InheritanceResult {
  inherited: ConfigEntry[]
  overridden: ConfigEntry[]
  projectSpecific: ConfigEntry[]
}
