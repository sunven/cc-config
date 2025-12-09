/**
 * capabilityStats utility for Story 4.5 - Capability Statistics
 *
 * Calculates statistics from capability data including:
 * - Total MCP and Agent counts
 * - Most used capability type
 * - Unique vs inherited vs overridden capabilities
 * - Percentages and breakdown by scope
 */

import type { UnifiedCapability } from '../types/capability'

/// Statistics for capability breakdown by source
export interface StatsBreakdown {
  total: number
  mcp: number
  agents: number
}

/// Complete capability statistics
export interface CapabilityStats {
  totalMcp: number
  totalAgents: number
  totalCount: number
  mostUsedType: 'mcp' | 'agents' | 'equal'
  unique: number
  inherited: number
  overridden: number
  percentages: {
    mcp: number
    agents: number
    unique: number
    inherited: number
    overridden: number
  }
  breakdown: {
    user: StatsBreakdown
    project: StatsBreakdown
    local: StatsBreakdown
  }
  lastUpdated: Date
}

/// Filter capabilities by scope (user, project, or local)
/**
 * Filter capabilities by scope
 *
 * @param capabilities - Array of unified capabilities
 * @param scope - Optional scope filter ('user', 'project', 'local')
 * @returns Filtered capabilities array
 */
export function getStatsForScope(
  capabilities: UnifiedCapability[],
  scope?: 'user' | 'project' | 'local'
): UnifiedCapability[] {
  if (!scope) {
    return capabilities
  }
  return capabilities.filter(cap => cap.source === scope)
}

/**
 * Calculate comprehensive statistics from capability data
 *
 * @param capabilities - Array of unified capabilities
 * @param scope - Optional scope filter ('user', 'project', 'local')
 * @param inheritanceMap - Optional map of inheritance relationships (capabilityId -> source)
 * @returns CapabilityStats object with counts, percentages, and breakdown
 */
export function calculateCapabilityStats(
  capabilities: UnifiedCapability[],
  scope?: 'user' | 'project' | 'local',
  inheritanceMap?: Map<string, string>
): CapabilityStats {
  // Handle empty or undefined capabilities
  if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
    return {
      totalMcp: 0,
      totalAgents: 0,
      totalCount: 0,
      mostUsedType: 'equal',
      unique: 0,
      inherited: 0,
      overridden: 0,
      percentages: {
        mcp: 0,
        agents: 0,
        unique: 0,
        inherited: 0,
        overridden: 0
      },
      breakdown: {
        user: { total: 0, mcp: 0, agents: 0 },
        project: { total: 0, mcp: 0, agents: 0 },
        local: { total: 0, mcp: 0, agents: 0 }
      },
      lastUpdated: new Date()
    }
  }

  // Filter by scope if specified
  const filteredCapabilities = getStatsForScope(capabilities, scope)
  const entries = filteredCapabilities

  // Count capabilities by type
  let mcpCount = 0
  let agentCount = 0

  // Initialize breakdown counters
  const breakdown = {
    user: { total: 0, mcp: 0, agents: 0 },
    project: { total: 0, mcp: 0, agents: 0 },
    local: { total: 0, mcp: 0, agents: 0 }
  }

  for (const entry of entries) {
    // Count by type
    if (entry.type === 'mcp') {
      mcpCount++
    } else if (entry.type === 'agent') {
      agentCount++
    }

    // Count by source for breakdown
    breakdown[entry.source].total++
    if (entry.type === 'mcp') {
      breakdown[entry.source].mcp++
    } else {
      breakdown[entry.source].agents++
    }
  }

  const totalCount = entries.length

  // Determine most used type
  let mostUsedType: 'mcp' | 'agents' | 'equal'
  if (mcpCount > agentCount) {
    mostUsedType = 'mcp'
  } else if (agentCount > mcpCount) {
    mostUsedType = 'agents'
  } else {
    mostUsedType = 'equal'
  }

  // Calculate unique, inherited, and overridden using actual inheritance data
  let uniqueCount = 0
  let inheritedCount = 0
  let overriddenCount = 0

  // Create a map of capabilities by source for faster lookup
  const capabilitiesBySource = {
    user: entries.filter(e => e.source === 'user'),
    project: entries.filter(e => e.source === 'project'),
    local: entries.filter(e => e.source === 'local')
  }

  for (const entry of entries) {
    if (inheritanceMap && inheritanceMap.has(entry.id)) {
      // This capability has inheritance information
      const originalSource = inheritanceMap.get(entry.id)
      if (originalSource && originalSource !== entry.source) {
        // The capability exists in another source and is different here = overridden
        overriddenCount++
      } else {
        // Same source = unique
        uniqueCount++
      }
    } else {
      // No inheritance map, use source-based heuristic:
      // - 'user' source = unique to user scope
      // - 'project' source = could be unique or overridden
      // - 'local' source = inherited
      if (entry.source === 'local') {
        // Local source = inherited from elsewhere
        inheritedCount++
      } else {
        // User or project = check if it exists in lower scopes
        const hasInLowerScope = capabilitiesBySource.user.some(
          e => e.name === entry.name && e.source === 'user' && entry.source === 'project'
        )
        if (hasInLowerScope && entry.source === 'project') {
          // Project capability that exists in user scope = overridden
          overriddenCount++
        } else {
          // Otherwise it's unique
          uniqueCount++
        }
      }
    }
  }

  // Calculate percentages (handle division by zero)
  const mcpPercentage = totalCount > 0 ? Math.round((mcpCount / totalCount) * 100) : 0
  const agentsPercentage = totalCount > 0 ? Math.round((agentCount / totalCount) * 100) : 0
  const uniquePercentage = totalCount > 0 ? Math.round((uniqueCount / totalCount) * 100) : 0
  const inheritedPercentage = totalCount > 0 ? Math.round((inheritedCount / totalCount) * 100) : 0
  const overriddenPercentage = totalCount > 0 ? Math.round((overriddenCount / totalCount) * 100) : 0

  return {
    totalMcp: mcpCount,
    totalAgents: agentCount,
    totalCount,
    mostUsedType,
    unique: uniqueCount,
    inherited: inheritedCount,
    overridden: overriddenCount,
    percentages: {
      mcp: mcpPercentage,
      agents: agentsPercentage,
      unique: uniquePercentage,
      inherited: inheritedPercentage,
      overridden: overriddenPercentage
    },
    breakdown,
    lastUpdated: new Date()
  }
}