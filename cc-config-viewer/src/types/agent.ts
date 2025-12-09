export interface Agent {
  id: string
  name: string
  description: string  // Markdown formatted
  model: {
    name: string
    provider?: string
    config?: Record<string, any>
  }
  permissions: PermissionsModel
  status: 'active' | 'inactive' | 'error'
  sourcePath: string
  lastModified?: Date
}

export interface PermissionsModel {
  type: 'read' | 'write' | 'admin' | 'custom'
  scopes: string[]
  restrictions?: string[]
}

export interface AgentParseResult {
  id: string
  name: string
  description: string  // Markdown
  model: {
    name: string
    provider?: string
    config?: Record<string, any>
  }
  permissions: PermissionsModel
  sourcePath: string
  lastModified: Date
}

export interface AgentFilterState {
  source?: 'user' | 'project' | 'local'
  permissions?: 'read' | 'write' | 'admin' | 'custom'
  status?: 'active' | 'inactive' | 'error'
  searchQuery?: string
}

export interface AgentSortState {
  field: 'name' | 'permissions' | 'status' | 'source' | 'lastModified'
  direction: 'asc' | 'desc'
}
