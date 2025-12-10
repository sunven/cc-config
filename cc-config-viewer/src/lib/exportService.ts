import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportData,
  ValidationResult,
  ExportPreview,
  ProjectExportData,
  ComparisonExportData,
} from '../types/export'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'

// Import formatters
import { toJSON, createJSONExport, validateJSONExport } from './formatters/jsonFormatter'
import {
  toMarkdown,
  createMarkdownExport,
  validateMarkdownExport,
} from './formatters/markdownFormatter'
import { toCSV, createCSVExport, validateCSVExport } from './formatters/csvFormatter'

/**
 * Core export service for configuration data
 * Supports multiple formats and provides validation and error handling
 */

export interface ExportContext {
  source: 'project' | 'comparison'
  data: DiscoveredProject | ComparisonExportData
  options: ExportOptions
}

/**
 * Main export function - converts data to specified format
 */
export async function exportConfiguration(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = performance.now()
  let content = ''
  let recordCount = 0

  try {
    // Validate input data
    const validation = validateExportData(source, data)
    if (!validation.isValid) {
      const duration = performance.now() - startTime
      return {
        success: false,
        format: options.format,
        error: {
          type: 'validation',
          message: `Export validation failed: ${validation.errors.join(', ')}`,
        },
        stats: {
          recordCount: 0,
          fileSize: 0,
          duration,
        },
      }
    }

    // Generate content based on format
    switch (options.format) {
      case 'json':
        content = await exportAsJSON(source, data, options)
        break
      case 'markdown':
        content = await exportAsMarkdown(source, data, options)
        break
      case 'csv':
        content = await exportAsCSV(source, data, options)
        break
      default:
        return {
          success: false,
          format: options.format,
          error: {
            type: 'export',
            message: `Unsupported export format: ${options.format}`,
          },
        }
    }

    // Calculate record count
    recordCount = calculateRecordCount(source, data, options)

    // Calculate file size
    const fileSize = new Blob([content]).size

    const duration = performance.now() - startTime

    return {
      success: true,
      content,
      format: options.format,
      stats: {
        recordCount,
        fileSize,
        duration,
      },
    }
  } catch (error) {
    const duration = performance.now() - startTime
    return {
      success: false,
      format: options.format,
      error: {
        type: 'export',
        message: `Export failed: ${error}`,
        details: error,
      },
      stats: {
        recordCount,
        fileSize: 0,
        duration,
      },
    }
  }
}

/**
 * Export as JSON format
 */
async function exportAsJSON(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): Promise<string> {
  if (source === 'project') {
    return createJSONExport(data as DiscoveredProject, extractConfigurations(data), options)
  } else {
    const comparisonData = data as ComparisonExportData
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        exportType: 'comparison',
        comparison: {
          leftProject: comparisonData.leftProject.name,
          rightProject: comparisonData.rightProject.name,
          diffResults: comparisonData.diffResults,
        },
        metadata: {
          version: '1.0',
          exportFormat: 'json',
        },
      },
      null,
      2
    )
  }
}

/**
 * Export as Markdown format
 */
async function exportAsMarkdown(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): Promise<string> {
  if (source === 'project') {
    return createMarkdownExport(data as DiscoveredProject, extractConfigurations(data), options)
  } else {
    const comparisonData = data as ComparisonExportData
    return `# Configuration Comparison

**Exported:** ${new Date().toLocaleString('zh-CN')}
**Left Project:** ${comparisonData.leftProject.name}
**Right Project:** ${comparisonData.rightProject.name}

## Differences

| Capability | Status | Severity | Left Value | Right Value |
|------------|--------|----------|------------|-------------|

${comparisonData.diffResults
  .map(
    (diff) =>
      `| ${diff.capabilityId} | ${diff.status} | ${diff.severity} | ${formatValue(diff.leftValue?.value)} | ${formatValue(diff.rightValue?.value)} |`
  )
  .join('\n')}`
  }
}

/**
 * Export as CSV format
 */
async function exportAsCSV(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): Promise<string> {
  if (source === 'project') {
    return createCSVExport(data as DiscoveredProject, extractConfigurations(data), options)
  } else {
    const comparisonData = data as ComparisonExportData
    const rows = ['CapabilityID,Status,Severity,LeftValue,RightValue']

    for (const diff of comparisonData.diffResults) {
      rows.push(
        [
          diff.capabilityId,
          diff.status,
          diff.severity,
          formatValue(diff.leftValue?.value),
          formatValue(diff.rightValue?.value),
        ].join(',')
      )
    }

    return rows.join('\n')
  }
}

/**
 * Create export preview without full export
 */
export function createExportPreview(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): ExportPreview {
  // Generate a sample of the content
  const sampleContent = generateSampleContent(source, data, options)
  const recordCount = calculateRecordCount(source, data, options)
  const estimatedSize = new Blob([sampleContent]).size

  return {
    format: options.format,
    content: sampleContent,
    recordCount,
    estimatedSize,
    options,
  }
}

/**
 * Validate export data
 */
function validateExportData(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data) {
    errors.push('Data is required')
    return { isValid: false, errors, warnings }
  }

  if (source === 'project') {
    const project = data as DiscoveredProject
    if (!project.name) errors.push('Project name is required')
    if (!project.path) errors.push('Project path is required')
    if (!project.id) errors.push('Project ID is required')
  } else {
    const comparison = data as ComparisonExportData
    if (!comparison.leftProject) errors.push('Left project is required')
    if (!comparison.rightProject) errors.push('Right project is required')
    if (!comparison.diffResults) errors.push('Diff results are required')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Extract configurations from project data
 */
function extractConfigurations(data: any): any {
  if (data.configurations) {
    return data.configurations
  }

  // Extract MCP servers and agents from project data
  const mcp = Array.isArray(data.mcpServers)
    ? data.mcpServers.map((name: string) => ({
        name,
        source: 'project',
        config: {},
        inheritedFrom: null,
      }))
    : []

  const agents = Array.isArray(data.subAgents)
    ? data.subAgents.map((name: string) => ({
        name,
        source: 'project',
        permissions: {},
        inheritedFrom: null,
      }))
    : []

  // Default structure if not provided
  return {
    mcp,
    agents,
    inherited: [],
  }
}

/**
 * Calculate record count for export
 */
function calculateRecordCount(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): number {
  if (source === 'project') {
    const project = data as DiscoveredProject
    let count = 0

    if (options.includeMCP && project.mcpServers) {
      count += project.mcpServers.length
    }

    if (options.includeAgents && project.subAgents) {
      count += project.subAgents.length
    }

    return count
  } else {
    const comparison = data as ComparisonExportData
    return comparison.diffResults.length
  }
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
  }

  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }

  return String(value)
}

/**
 * Generate sample content for preview
 */
function generateSampleContent(
  source: 'project' | 'comparison',
  data: DiscoveredProject | ComparisonExportData,
  options: ExportOptions
): string {
  const sampleData = {
    exportedAt: new Date().toISOString(),
    exportType: source,
    project: {
      name: source === 'project' ? (data as DiscoveredProject).name : 'Sample Project',
      path: source === 'project' ? (data as DiscoveredProject).path : '/path/to/project',
    },
    metadata: {
      version: '1.0',
      exportFormat: options.format,
    },
  }

  switch (options.format) {
    case 'json':
      return JSON.stringify(sampleData, null, 2)
    case 'markdown':
      return `# Configuration Export

**Exported:** ${new Date().toLocaleString('zh-CN')}
**Project:** ${sampleData.project.name}

## Sample Content
This is a preview of the export content.`
    case 'csv':
      return 'Type,Name,Source,Configuration\nMCP,sample-server,Project,{...}'
    default:
      return 'Unsupported format'
  }
}

/**
 * Validate export format
 */
export function isValidExportFormat(format: string): format is ExportFormat {
  return ['json', 'markdown', 'csv'].includes(format)
}

/**
 * Get default export options
 */
export function getDefaultExportOptions(): ExportOptions {
  return {
    format: 'json',
    includeInherited: true,
    includeMCP: true,
    includeAgents: true,
    includeMetadata: true,
  }
}

/**
 * Sanitize filename for export
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 100)
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  projectName: string,
  format: ExportFormat,
  timestamp: Date = new Date()
): string {
  const date = timestamp.toISOString().split('T')[0]
  const sanitizedName = sanitizeFilename(projectName)
  return `${sanitizedName}-config-${date}.${format}`
}
