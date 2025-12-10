import type { ProjectExportData, ComparisonExportData, ExportOptions } from '../../types/export'
import type { DiscoveredProject } from '../../types/project'
import type { DiffResult } from '../../types/comparison'

/**
 * Convert project data to CSV format
 * Flattened structure for spreadsheet analysis
 */
export function toCSV(data: ProjectExportData): string {
  const rows: string[] = []

  // Header row
  rows.push('Type,Name,Source,Configuration,InheritedFrom')

  // MCP servers
  if (data.configurations.mcp && data.metadata.includeMCP) {
    for (const server of data.configurations.mcp) {
      rows.push(
        [
          'MCP',
          escapeCSV(server.name || 'N/A'),
          escapeCSV(server.source || 'N/A'),
          escapeCSV(formatConfigForCSV(server.config)),
          escapeCSV(server.inheritedFrom || 'N/A'),
        ].join(',')
      )
    }
  }

  // Agents
  if (data.configurations.agents && data.metadata.includeAgents) {
    for (const agent of data.configurations.agents) {
      rows.push(
        [
          'Agent',
          escapeCSV(agent.name || 'N/A'),
          escapeCSV(agent.source || 'N/A'),
          escapeCSV(formatConfigForCSV(agent.permissions)),
          escapeCSV(agent.inheritedFrom || 'N/A'),
        ].join(',')
      )
    }
  }

  // Inherited configurations
  if (data.configurations.inherited && data.metadata.includeInherited) {
    for (const inherited of data.configurations.inherited) {
      rows.push(
        [
          'Inherited',
          escapeCSV(inherited.name || 'N/A'),
          escapeCSV(inherited.level || 'N/A'),
          escapeCSV(formatConfigForCSV(inherited.config)),
          escapeCSV(inherited.source || 'N/A'),
        ].join(',')
      )
    }
  }

  return rows.join('\n')
}

/**
 * Convert comparison data to CSV format
 */
export function comparisonToCSV(data: ComparisonExportData): string {
  const rows: string[] = []

  // Header row
  rows.push(
    'CapabilityID,Status,Severity,LeftProject,LeftValue,RightProject,RightValue,Difference'
  )

  for (const diff of data.diffResults) {
    const leftValue = diff.leftValue ? formatConfigForCSV(diff.leftValue.value) : 'N/A'
    const rightValue = diff.rightValue ? formatConfigForCSV(diff.rightValue.value) : 'N/A'
    const difference = formatDifference(diff)

    rows.push(
      [
        escapeCSV(diff.capabilityId),
        escapeCSV(diff.status),
        escapeCSV(diff.severity),
        escapeCSV(data.leftProject.name),
        escapeCSV(leftValue),
        escapeCSV(data.rightProject.name),
        escapeCSV(rightValue),
        escapeCSV(difference),
      ].join(',')
    )
  }

  return rows.join('\n')
}

/**
 * Create CSV export from raw data
 */
export function createCSVExport(
  project: DiscoveredProject,
  configurations: any,
  options: ExportOptions
): string {
  const metadata = {
    version: '1.0',
    exportFormat: 'csv' as const,
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

  return toCSV(data)
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape double quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Format configuration value for CSV display
 */
function formatConfigForCSV(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Format difference for CSV display
 */
function formatDifference(diff: DiffResult): string {
  switch (diff.status) {
    case 'only-left':
      return `Only in ${diff.leftValue?.source || 'A'}`
    case 'only-right':
      return `Only in ${diff.rightValue?.source || 'B'}`
    case 'different':
      return `${diff.leftValue?.value} → ${diff.rightValue?.value}`
    case 'match':
      return 'Match'
    case 'conflict':
      return 'Conflict'
    default:
      return 'Unknown'
  }
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
 * Validate CSV export data
 */
export function validateCSVExport(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data) {
    errors.push('Export data is required')
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
 * Create CSV with custom delimiter
 */
export function createCSVWithDelimiter(
  data: ProjectExportData,
  delimiter: string = ','
): string {
  const rows = toCSV(data)
  return rows.replace(/,/g, delimiter)
}

/**
 * Parse CSV string back to data structure
 */
export function parseCSV(csvString: string): any[] {
  const lines = csvString.split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const row: any = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row)
  }

  return rows
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  values.push(current.trim())

  return values
}

/**
 * Create summary statistics from CSV data
 */
export function createCSVStatistics(csvString: string): {
  totalRows: number
  columnCount: number
  headers: string[]
} {
  const lines = csvString.split('\n').filter((line) => line.trim())
  const headers = lines[0] ? lines[0].split(',').map((h) => h.trim()) : []
  const totalRows = Math.max(0, lines.length - 1)

  return {
    totalRows,
    columnCount: headers.length,
    headers,
  }
}

/**
 * Filter CSV data by column value
 */
export function filterCSVByColumn(
  csvString: string,
  columnName: string,
  filterValue: string
): string {
  const lines = csvString.split('\n')
  const headers = lines[0].split(',')
  const columnIndex = headers.findIndex((h) => h.trim() === columnName)

  if (columnIndex === -1) {
    throw new Error(`Column "${columnName}" not found`)
  }

  const filteredLines = [lines[0]] // Keep header

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values[columnIndex] === filterValue) {
      filteredLines.push(lines[i])
    }
  }

  return filteredLines.join('\n')
}
