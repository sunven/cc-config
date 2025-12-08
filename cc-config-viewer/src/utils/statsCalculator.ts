/**
 * statsCalculator utility for Story 3.5 - Inheritance Chain Summary
 *
 * Calculates statistics from inheritance chain data including:
 * - Counts and percentages for inherited/project-specific/new configurations
 * - Quick stats: most inherited MCP servers, most added agents
 */

import type { InheritanceChainItem } from '../types/config'

/// Statistics for a classification type
export interface ClassificationStats {
  count: number
  percentage: number
}

/// Quick statistics for additional insights
export interface QuickStats {
  mostInheritedMcp?: string
  mostAddedAgent?: string
}

/// Complete inheritance statistics
export interface InheritanceStats {
  totalCount: number
  inherited: ClassificationStats
  projectSpecific: ClassificationStats
  new: ClassificationStats
  quickStats?: QuickStats
}

/// Result of analyzing MCP or agent occurrences
interface OccurrenceCount {
  [key: string]: number
}

/**
 * Calculate comprehensive statistics from an inheritance chain
 *
 * @param classifiedEntries - Array of classified inheritance entries
 * @returns InheritanceStats object with counts, percentages, and quick stats
 */
export function calculateStats(classifiedEntries: InheritanceChainItem[]): InheritanceStats {
  // Handle empty chain
  if (!classifiedEntries || classifiedEntries.length === 0) {
    return {
      totalCount: 0,
      inherited: { count: 0, percentage: 0 },
      projectSpecific: { count: 0, percentage: 0 },
      new: { count: 0, percentage: 0 }
    }
  }

  const entries = classifiedEntries

  // Count configurations by classification
  let inheritedCount = 0
  let projectSpecificCount = 0
  let newCount = 0

  // Track MCP and Agent occurrences for quick stats
  const mcpInheritanceCounts: OccurrenceCount = {}
  const agentProjectCounts: OccurrenceCount = {}

  for (const entry of entries) {
    // Classify the entry
    if (entry.classification === 'inherited') {
      inheritedCount++

      // Track MCP servers (inherited)
      if (entry.configKey.startsWith('mcpServers.')) {
        const mcpKey = entry.configKey.replace('mcpServers.', '')
        mcpInheritanceCounts[mcpKey] = (mcpInheritanceCounts[mcpKey] || 0) + 1
      }
    } else if (entry.classification === 'override') {
      // Override counts as project-specific (it's new configuration)
      projectSpecificCount++
    } else if (entry.classification === 'project-specific') {
      projectSpecificCount++

      // Track Agents (added at project level)
      if (entry.configKey.startsWith('agents.')) {
        const agentKey = entry.configKey.replace('agents.', '')
        agentProjectCounts[agentKey] = (agentProjectCounts[agentKey] || 0) + 1
      }
    }
  }

  const totalCount = entries.length

  // Calculate percentages (handle division by zero)
  const inheritedPercentage = totalCount > 0 ? (inheritedCount / totalCount) * 100 : 0
  const projectSpecificPercentage = totalCount > 0 ? (projectSpecificCount / totalCount) * 100 : 0
  const newPercentage = totalCount > 0 ? (newCount / totalCount) * 100 : 0

  // Find most inherited MCP server
  let mostInheritedMcp: string | undefined
  let maxMcpCount = 0
  for (const [mcpKey, count] of Object.entries(mcpInheritanceCounts)) {
    if (count > maxMcpCount) {
      maxMcpCount = count
      mostInheritedMcp = mcpKey
    }
  }

  // Find most added agent
  let mostAddedAgent: string | undefined
  let maxAgentCount = 0
  for (const [agentKey, count] of Object.entries(agentProjectCounts)) {
    if (count > maxAgentCount) {
      maxAgentCount = count
      mostAddedAgent = agentKey
    }
  }

  return {
    totalCount,
    inherited: {
      count: inheritedCount,
      percentage: Math.round(inheritedPercentage * 100) / 100
    },
    projectSpecific: {
      count: projectSpecificCount,
      percentage: Math.round(projectSpecificPercentage * 100) / 100
    },
    new: {
      count: newCount,
      percentage: Math.round(newPercentage * 100) / 100
    },
    quickStats: {
      mostInheritedMcp,
      mostAddedAgent
    }
  }
}