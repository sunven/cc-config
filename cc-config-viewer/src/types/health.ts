// Health types for project health dashboard
// Extends project types for health calculation and display

export interface ProjectHealth {
  projectId: string
  status: 'good' | 'warning' | 'error'
  score: number  // 0-100
  metrics: {
    totalCapabilities: number
    validConfigs: number
    invalidConfigs: number
    warnings: number
    errors: number
    lastChecked: string // ISO date string
    lastAccessed?: string // ISO date string
  }
  issues: HealthIssue[]
  recommendations: string[]
}

export interface HealthIssue {
  id: string
  type: 'warning' | 'error'
  severity: 'low' | 'medium' | 'high'
  message: string
  details?: string
  projectId: string
}

export interface HealthMetrics {
  projectId: string
  totalCapabilities: number
  validConfigs: number
  invalidConfigs: number
  warningCount: number
  errorCount: number
  lastModified: string
  healthScore: number
}

export type HealthStatus = 'good' | 'warning' | 'error'

export type SortBy = 'health' | 'name' | 'lastAccessed'

export type FilterBy = 'all' | 'good' | 'warning' | 'error'

export interface DashboardFilters {
  sortBy: SortBy
  filterBy: FilterBy
  selectedProjects: string[]
}

export interface HealthSummary {
  totalProjects: number
  goodCount: number
  warningCount: number
  errorCount: number
  averageHealthScore: number
}