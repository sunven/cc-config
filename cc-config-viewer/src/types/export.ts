// Export format types
export type ExportFormat = 'json' | 'markdown' | 'csv'

// Export configuration options
export interface ExportOptions {
  format: ExportFormat
  includeInherited: boolean
  includeMCP: boolean
  includeAgents: boolean
  includeMetadata: boolean
}

// Export data structure
export interface ExportData {
  exportedAt: string
  exportType: 'project' | 'comparison'
  project: {
    name: string
    path: string
    configurations: {
      mcp?: any[]
      agents?: any[]
      inherited?: any[]
    }
  }
  metadata: {
    version: string
    exportFormat: ExportFormat
  }
}

// Enhanced export result interface
export interface ExportResult {
  success: boolean
  filePath?: string
  content?: string
  format: ExportFormat
  error?: AppError
  stats?: {
    recordCount: number
    fileSize: number
    duration: number
  }
}

// Validation result for export data
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// AppError extension for export operations
export interface ExportError {
  type: 'filesystem' | 'permission' | 'validation' | 'export' | 'clipboard'
  message: string
  code?: string
  details?: any
}

// Export metadata for tracking
export interface ExportMetadata {
  version: string
  exportFormat: ExportFormat
  timestamp: string
  sourceType: 'project' | 'comparison'
  recordCount: number
  fileSize: number
  includeInherited: boolean
  includeMCP: boolean
  includeAgents: boolean
  includeMetadata: boolean
}

// Export statistics
export interface ExportStats {
  totalExports: number
  successfulExports: number
  failedExports: number
  averageFileSize: number
  mostUsedFormat: ExportFormat
}

// Import type from index.ts
import type { DiscoveredProject } from './project'
import type { DiffResult } from './comparison'
import type { AppError } from './index'

// Project export data
export interface ProjectExportData {
  project: DiscoveredProject
  configurations: {
    mcp?: any[]
    agents?: any[]
    inherited?: any[]
  }
  metadata: ExportMetadata
}

// Comparison export data
export interface ComparisonExportData {
  leftProject: DiscoveredProject
  rightProject: DiscoveredProject
  diffResults: DiffResult[]
  metadata: ExportMetadata
}

// Export preview data
export interface ExportPreview {
  format: ExportFormat
  content: string
  recordCount: number
  estimatedSize: number
  options: ExportOptions
}
