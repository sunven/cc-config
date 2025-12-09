export interface Project {
  id: string
  name: string
  path: string
  configPath: string
  createdAt: Date
  updatedAt: Date
  // New fields for Story 2.5 - Multi-Project Navigation:
  lastAccessed?: Date | null
  mcpCount?: number
  agentCount?: number
  status?: 'valid' | 'invalid' | 'missing'
}

export interface ProjectSummary {
  project: Project
  mcpCount: number
  agentCount: number
  lastAccessed: Date | null
}

export interface ProjectScope {
  level: 'user' | 'project' | 'local'
  label: string
  description: string
}

// Story 5.1 - Enhanced project discovery
export interface DiscoveredProject {
  id: string
  name: string
  path: string
  configFileCount: number
  lastModified: Date
  configSources: {
    user: boolean
    project: boolean
    local: boolean
  }
  mcpServers?: string[]
  subAgents?: string[]
}
