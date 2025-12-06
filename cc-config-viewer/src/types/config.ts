export interface ConfigSource {
  type: 'user' | 'project' | 'local'
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
