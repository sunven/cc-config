import type { ProjectExportData, ComparisonExportData, ExportOptions } from '../../types/export'
import type { DiscoveredProject } from '../../types/project'
import type { DiffResult } from '../../types/comparison'

/**
 * Convert project data to Markdown format
 * Human-readable format with tables and structured sections
 */
export function toMarkdown(data: ProjectExportData): string {
  const lines: string[] = []

  // Header
  lines.push('# Configuration Export')
  lines.push('')
  lines.push(`**Exported:** ${formatDate(data.metadata.timestamp)}`)
  lines.push(`**Project:** ${data.project.name}`)
  lines.push(`**Path:** ${data.project.path}`)
  lines.push('')

  // Configurations section
  if (data.configurations.mcp && data.metadata.includeMCP) {
    lines.push('## MCP Servers')
    lines.push('')
    lines.push('| Name | Type | Source | Configuration |')
    lines.push('|------|------|--------|---------------|')

    for (const server of data.configurations.mcp) {
      lines.push(
        `| ${server.name || 'N/A'} | ${server.type || 'N/A'} | ${server.source || 'N/A'} | ${formatConfigValue(
          server.config
        )} |`
      )
    }
    lines.push('')
  }

  if (data.configurations.agents && data.metadata.includeAgents) {
    lines.push('## Sub Agents')
    lines.push('')
    lines.push('| Name | Model | Source | Permissions |')
    lines.push('|------|-------|--------|-------------|')

    for (const agent of data.configurations.agents) {
      lines.push(
        `| ${agent.name || 'N/A'} | ${agent.model || 'N/A'} | ${agent.source || 'N/A'} | ${formatConfigValue(
          agent.permissions
        )} |`
      )
    }
    lines.push('')
  }

  if (data.configurations.inherited && data.metadata.includeInherited) {
    lines.push('## Inheritance Chain')
    lines.push('')
    lines.push(`- User Level: ${data.configurations.inherited.filter((i) => i.level === 'user').length} MCP, ${data.configurations.inherited.filter((i) => i.level === 'user').length} Agents`)
    lines.push(`- Project Level: ${data.configurations.inherited.filter((i) => i.level === 'project').length} MCP, ${data.configurations.inherited.filter((i) => i.level === 'project').length} Agents`)
    lines.push('')
  }

  // Metadata section
  if (data.metadata.includeMetadata) {
    lines.push('## Export Metadata')
    lines.push('')
    lines.push(`- **Version:** ${data.metadata.version}`)
    lines.push(`- **Export Format:** ${data.metadata.exportFormat}`)
    lines.push(`- **Record Count:** ${data.metadata.recordCount}`)
    lines.push(`- **File Size:** ${formatFileSize(data.metadata.fileSize)}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Convert comparison data to Markdown format
 */
export function comparisonToMarkdown(data: ComparisonExportData): string {
  const lines: string[] = []

  // Header
  lines.push('# Configuration Comparison Export')
  lines.push('')
  lines.push(`**Exported:** ${formatDate(data.metadata.timestamp)}`)
  lines.push(`**Left Project:** ${data.leftProject.name}`)
  lines.push(`**Right Project:** ${data.rightProject.name}`)
  lines.push('')

  // Summary
  const totalDiffs = data.diffResults.length
  const onlyInLeft = data.diffResults.filter((d) => d.status === 'only-left').length
  const onlyInRight = data.diffResults.filter((d) => d.status === 'only-right').length
  const differentValues = data.diffResults.filter((d) => d.status === 'different').length

  lines.push('## Summary')
  lines.push('')
  lines.push(`- **Total Differences:** ${totalDiffs}`)
  lines.push(`- **Only in Left:** ${onlyInLeft}`)
  lines.push(`- **Only in Right:** ${onlyInRight}`)
  lines.push(`- **Different Values:** ${differentValues}`)
  lines.push('')

  // Differences table
  lines.push('## Differences')
  lines.push('')
  lines.push('| Capability | Status | Severity | Left Value | Right Value |')
  lines.push('|------------|--------|----------|------------|-------------|')

  for (const diff of data.diffResults) {
    const leftValue = diff.leftValue ? formatConfigValue(diff.leftValue.value) : 'N/A'
    const rightValue = diff.rightValue ? formatConfigValue(diff.rightValue.value) : 'N/A'
    const status = formatStatus(diff.status)
    const severity = formatSeverity(diff.severity)

    lines.push(
      `| ${diff.capabilityId} | ${status} | ${severity} | ${leftValue} | ${rightValue} |`
    )
  }
  lines.push('')

  // Metadata
  if (data.metadata.includeMetadata) {
    lines.push('## Export Metadata')
    lines.push('')
    lines.push(`- **Version:** ${data.metadata.version}`)
    lines.push(`- **Export Format:** ${data.metadata.exportFormat}`)
    lines.push(`- **Record Count:** ${data.metadata.recordCount}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Create Markdown export from raw data
 */
export function createMarkdownExport(
  project: DiscoveredProject,
  configurations: any,
  options: ExportOptions
): string {
  const metadata = {
    version: '1.0',
    exportFormat: 'markdown' as const,
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

  return toMarkdown(data)
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format configuration value for table display
 */
function formatConfigValue(value: any): string {
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
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    match: '✓ Match',
    different: '⚠ Different',
    conflict: '✗ Conflict',
    'only-left': '← Only in A',
    'only-right': '→ Only in B',
  }
  return statusMap[status] || status
}

/**
 * Format severity for display
 */
function formatSeverity(severity: string): string {
  const severityMap: Record<string, string> = {
    low: '🟢 Low',
    medium: '🟡 Medium',
    high: '🔴 High',
  }
  return severityMap[severity] || severity
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
 * Validate Markdown export data
 */
export function validateMarkdownExport(data: any): { isValid: boolean; errors: string[] } {
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
 * Create table of contents for large exports
 */
export function createTableOfContents(sections: string[]): string {
  const lines: string[] = []
  lines.push('## Table of Contents')
  lines.push('')

  sections.forEach((section, index) => {
    lines.push(`${index + 1}. [${section}](#${section.toLowerCase().replace(/\s+/g, '-')})`)
  })

  lines.push('')
  return lines.join('\n')
}

/**
 * Add syntax highlighting to code blocks
 */
export function addCodeHighlighting(markdown: string): string {
  return markdown.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (match, language, code) => {
      const lang = language || 'json'
      return `\`\`\`${lang}\n${code.trim()}\n\`\`\``
    }
  )
}
