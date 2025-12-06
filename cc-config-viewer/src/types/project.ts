export interface Project {
  id: string
  name: string
  path: string
  configPath: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectScope {
  level: 'user' | 'project' | 'local'
  label: string
  description: string
}
