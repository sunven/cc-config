import React, { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { TrendingUp, Database, Bot, GitBranch } from 'lucide-react'
import type { CapabilityStats as CapabilityStatsType } from '../lib/capabilityStats'

// Simple progress bar component
interface ProgressBarProps {
  value: number
  color?: 'blue' | 'green'
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600'
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

interface CapabilityStatsProps {
  stats: CapabilityStatsType | undefined
  scope: 'user' | 'project'
  compact?: boolean
}

/**
 * Component for displaying capability statistics (MCP servers and Agents)
 * Shows comprehensive stats including counts, breakdowns, and percentages
 *
 * Performance optimizations:
 * - Uses React.memo to prevent unnecessary re-renders
 * - Uses useMemo for expensive calculations
 * - Memoized style functions and color classes
 */
export const CapabilityStats: React.FC<CapabilityStatsProps> = ({
  stats,
  scope,
  compact = false
}) => {
  // Handle undefined or null stats
  if (!stats) {
    return (
      <Card className="capability-stats border-l-4 border-l-blue-500" aria-label="Capability Statistics Loading">
        <CardHeader>
          <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
            <Database className="h-5 w-5" aria-hidden="true" />
            Capability Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground" role="status">Loading statistics...</p>
        </CardContent>
      </Card>
    )
  }
  // Memoized color classes to prevent recalculation
  const colorClasses = useMemo(() => ({
    mcp: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'text-blue-600'
    },
    agents: {
      badge: 'bg-green-100 text-green-800 border-green-200',
      icon: 'text-green-600'
    },
    stats: {
      card: 'border-l-4 border-l-blue-500',
      header: 'text-blue-700'
    }
  }), [])

  // Memoized stats display values
  const displayStats = useMemo(() => {
    const { totalMcp, totalAgents, totalCount, mostUsedType, unique, inherited, overridden } = stats

    return {
      totalMcp,
      totalAgents,
      totalCount,
      mostUsedType,
      mostUsedLabel: mostUsedType === 'equal' ? 'Equal' : mostUsedType.toUpperCase(),
      unique,
      inherited,
      overridden,
      // Format display with proper labeling
      mcpDisplay: `MCP (${totalMcp})`,
      agentsDisplay: `Agents (${totalAgents})`,
      uniqueDisplay: `Unique (${unique})`,
      inheritedDisplay: `Inherited (${inherited})`,
      overriddenDisplay: `Overridden (${overridden})`
    }
  }, [stats])

  // Memoized percentage display
  const percentageDisplay = useMemo(() => {
    return {
      mcp: `${stats.percentages.mcp}%`,
      agents: `${stats.percentages.agents}%`,
      unique: `${stats.percentages.unique}%`,
      inherited: `${stats.percentages.inherited}%`,
      overridden: `${stats.percentages.overridden}%`
    }
  }, [stats.percentages])

  // Handle empty stats
  if (stats.totalCount === 0) {
    return (
      <Card className={`capability-stats ${colorClasses.stats.card}`} role="region" aria-label="Capability Statistics">
        <CardHeader>
          <CardTitle className={`text-lg ${colorClasses.stats.header} flex items-center gap-2`}>
            <Database className="h-5 w-5" aria-hidden="true" />
            Capability Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground" role="status">No capabilities found in this scope.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Capabilities will appear here once you add MCP servers or Agents to your configuration.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`capability-stats ${colorClasses.stats.card}`} role="region" aria-label="Capability Statistics">
      <CardHeader>
        <CardTitle className={`text-lg ${colorClasses.stats.header} flex items-center gap-2`}>
          <Database className="h-5 w-5" aria-hidden="true" />
          Capability Statistics
          <Badge variant="outline" className="ml-auto" aria-label={`Current scope: ${scope}`}>
            {scope}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" role="region" aria-labelledby="capability-stats-content">
        {/* AC #1: Total MCP count & Total Agents count */}
        <div className="space-y-3">
          <h3 id="total-counts" className="text-sm font-semibold text-muted-foreground">Total Counts</h3>
          <div className="grid grid-cols-2 gap-4" role="group" aria-labelledby="total-counts">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Bot className={`h-5 w-5 ${colorClasses.mcp.icon}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">MCP Servers</p>
                <p className="text-2xl font-bold text-blue-700">{displayStats.totalMcp}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
              <GitBranch className={`h-5 w-5 ${colorClasses.agents.icon}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Agents</p>
                <p className="text-2xl font-bold text-green-700">{displayStats.totalAgents}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* AC #2: Most used capability type */}
        <div className="space-y-3">
          <h3 id="distribution" className="text-sm font-semibold text-muted-foreground">Distribution</h3>
          <div className="space-y-2" role="group" aria-labelledby="distribution">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className={`h-4 w-4 ${colorClasses.mcp.icon}`} />
                <span className="text-sm">MCP</span>
              </div>
              <Badge variant="outline" className={colorClasses.mcp.badge}>
                {percentageDisplay.mcp}
              </Badge>
            </div>
            <ProgressBar
              value={stats.percentages.mcp}
              color="blue"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className={`h-4 w-4 ${colorClasses.agents.icon}`} />
                <span className="text-sm">Agents</span>
              </div>
              <Badge variant="outline" className={colorClasses.agents.badge}>
                {percentageDisplay.agents}
              </Badge>
            </div>
            <ProgressBar
              value={stats.percentages.agents}
              color="green"
            />
          </div>

          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Most Used Type:</p>
            <p className="text-lg font-bold">{displayStats.mostUsedLabel}</p>
            {stats.mostUsedType !== 'equal' && (
              <p className="text-xs text-muted-foreground mt-1">
                {displayStats.mostUsedType === 'mcp' ? percentageDisplay.mcp : percentageDisplay.agents} of total capabilities
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* AC #3: Capabilities unique to this scope vs inherited */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Scope Analysis</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-2xl font-bold text-green-700">{displayStats.unique}</p>
              <p className="text-xs text-muted-foreground mt-1">Unique</p>
              <p className="text-xs text-green-600 mt-1">{percentageDisplay.unique}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{displayStats.inherited}</p>
              <p className="text-xs text-muted-foreground mt-1">Inherited</p>
              <p className="text-xs text-blue-600 mt-1">{percentageDisplay.inherited}</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-2xl font-bold text-yellow-700">{displayStats.overridden}</p>
              <p className="text-xs text-muted-foreground mt-1">Overridden</p>
              <p className="text-xs text-yellow-600 mt-1">{percentageDisplay.overridden}</p>
            </div>
          </div>

          {/* Breakdown by scope */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Breakdown by Source:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-muted rounded">
                <p className="font-semibold">User Scope</p>
                <p className="text-muted-foreground">Total: {stats.breakdown.user.total}</p>
                <p className="text-muted-foreground">MCP: {stats.breakdown.user.mcp}</p>
                <p className="text-muted-foreground">Agents: {stats.breakdown.user.agents}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-semibold">Project Scope</p>
                <p className="text-muted-foreground">Total: {stats.breakdown.project.total}</p>
                <p className="text-muted-foreground">MCP: {stats.breakdown.project.mcp}</p>
                <p className="text-muted-foreground">Agents: {stats.breakdown.project.agents}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-semibold">Local Scope</p>
                <p className="text-muted-foreground">Total: {stats.breakdown.local.total}</p>
                <p className="text-muted-foreground">MCP: {stats.breakdown.local.mcp}</p>
                <p className="text-muted-foreground">Agents: {stats.breakdown.local.agents}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* AC #4: Growth over time (future feature note) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Growth Tracking</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            📊 Based on current configuration
          </p>
          <p className="text-xs text-muted-foreground">
            Historical tracking coming in future release
          </p>
        </div>

        {/* Last updated */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Last updated: {stats.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const CapabilityStatsMemo = React.memo(CapabilityStats)

// Also export the default component for convenience
export default CapabilityStatsMemo