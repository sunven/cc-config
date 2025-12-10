import type { ExportData, ProjectExportData, ComparisonExportData, ExportOptions } from '../../types/export'
import type { DiscoveredProject } from '../../types/project'
import type { DiffResult } from '../../types/comparison'

/**
 * Convert project data to JSON format
 * Optimized for performance with string concatenation
 */
export function toJSON(data: ProjectExportData): string {
  const output = {
    exportedAt: data.metadata.timestamp,
    exportType: 'project',
    project: {
      name: data.project.name,
      path: data.project.path,
      configurations: filterConfigurations(data.configurations, data.metadata),
    },
    metadata: {
      version: data.metadata.version,
      exportFormat: 'json' as const,
      recordCount: data.metadata.recordCount,
      sourceType: data.metadata.sourceType,
    },
  }

  return JSON.stringify(output, null, 2)
}

/**
 * Convert comparison data to JSON format
 */
export function comparisonToJSON(data: ComparisonExportData): string {
  const output = {
    exportedAt: data.metadata.timestamp,
    exportType: 'comparison',
    comparison: {
      leftProject: {
        name: data.leftProject.name,
        path: data.leftProject.path,
      },
      rightProject: {
        name: data.rightProject.name,
        path: data.rightProject.path,
      },
      diffResults: data.diffResults.map((diff) => ({
        capabilityId: diff.capabilityId,
        status: diff.status,
        severity: diff.severity,
        leftValue: diff.leftValue,
        rightValue: diff.rightValue,
      })),
    },
    metadata: {
      version: data.metadata.version,
      exportFormat: 'json' as const,
      recordCount: data.metadata.recordCount,
      sourceType: data.metadata.sourceType,
    },
  }

  return JSON.stringify(output, null, 2)
}

/**
 * Filter configurations based on export options
 */
function filterConfigurations(
  configurations: ProjectExportData['configurations'],
  metadata: ProjectExportData['metadata']
): ProjectExportData['configurations'] {
  const filtered: any = {}

  if (metadata.includeMCP && configurations.mcp) {
    filtered.mcp = configurations.mcp
  }

  if (metadata.includeAgents && configurations.agents) {
    filtered.agents = configurations.agents
  }

  if (metadata.includeInherited && configurations.inherited) {
    filtered.inherited = configurations.inherited
  }

  if (metadata.includeMetadata) {
    filtered.metadata = {
      version: metadata.version,
      exportedAt: metadata.timestamp,
      recordCount: metadata.recordCount,
      fileSize: metadata.fileSize,
    }
  }

  return filtered
}

/**
 * Create JSON export data from raw project data
 */
export function createJSONExport(
  project: DiscoveredProject,
  configurations: any,
  options: ExportOptions
): string {
  const metadata = {
    version: '1.0',
    exportFormat: 'json' as const,
    timestamp: new Date().toISOString(),
    sourceType: 'project' as const,
    recordCount: getRecordCount(configurations, options),
    fileSize: 0,
    includeInherited: options.includeInherited,
    includeMCP: options.includeMCP,
    includeAgents: options.includeAgents,
    includeMetadata: options.includeMetadata,
  }

  const data: ProjectExportData = {
    project,
    configurations,
    metadata,
  }

  return toJSON(data)
}

/**
 * Get total record count for export
 */
function getRecordCount(configurations: any, options: ExportOptions): number {
  let count = 0

  if (options.includeMCP && configurations.mcp) {
    count += configurations.mcp.length
  }

  if (options.includeAgents && configurations.agents) {
    count += configurations.agents.length
  }

  if (options.includeInherited && configurations.inherited) {
    count += configurations.inherited.length
  }

  return count
}

/**
 * Validate JSON export data
 */
export function validateJSONExport(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data) {
    errors.push('Export data is required')
  }

  if (typeof data !== 'object') {
    errors.push('Export data must be an object')
  }

  if (!data.project || !data.project.name) {
    errors.push('Project name is required')
  }

  if (!data.project || !data.project.path) {
    errors.push('Project path is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Pretty print JSON with custom formatting
 */
export function prettyPrintJSON(jsonString: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, indent)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error}`)
  }
}

/**
 * Minify JSON for smaller file sizes
 */
export function minifyJSON(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error}`)
  }
}

/**
 * Create JSON schema for export validation
 */
export function getJSONSchema(): object {
  return {
    type: 'object',
    required: ['exportedAt', 'exportType', 'project', 'metadata'],
    properties: {
      exportedAt: {
        type: 'string',
        format: 'date-time',
      },
      exportType: {
        type: 'string',
        enum: ['project', 'comparison'],
      },
      project: {
        type: 'object',
        required: ['name', 'path'],
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          configurations: { type: 'object' },
        },
      },
      metadata: {
        type: 'object',
        required: ['version', 'exportFormat'],
        properties: {
          version: { type: 'string' },
          exportFormat: { type: 'string', enum: ['json', 'markdown', 'csv'] },
        },
      },
    },
  }
}
