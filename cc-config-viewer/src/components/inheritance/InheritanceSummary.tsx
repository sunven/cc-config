/**
 * InheritanceSummary component for Story 3.5
 *
 * Displays inheritance chain summary statistics including:
 * - Total configuration count
 * - Inherited vs Project-specific breakdown
 * - Percentage distributions
 * - Quick stats (most inherited MCP, most added agents)
 */

import React from 'react'
import type { InheritanceStats } from '../../utils/statsCalculator'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface InheritanceSummaryProps {
  stats: InheritanceStats | null
  isLoading?: boolean
  error?: string | null
  compact?: boolean
  theme?: 'light' | 'dark'
}

export function InheritanceSummary({
  stats,
  isLoading = false,
  error = null,
  compact = false,
  theme = 'light'
}: InheritanceSummaryProps) {
  // Loading state
  if (isLoading) {
    return (
      <div role="region" aria-label="Inheritance Summary" data-testid="summary-container">
        <div data-testid="skeleton-loading" className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div role="region" aria-label="Inheritance Summary">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    )
  }

  // Empty state
  if (!stats) {
    return (
      <div role="region" aria-label="Inheritance Summary">
        <div className="text-gray-500 text-sm">No statistics available</div>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Inheritance Summary"
      data-testid="summary-container"
      className={`space-y-4 ${compact ? 'text-sm' : 'text-base'} ${theme === 'dark' ? 'dark' : ''}`}
    >
      {/* Summary Header */}
      <div className={`flex items-center justify-between ${compact ? 'text-sm' : 'text-base'}`}>
        <h3 className="font-semibold">Inheritance Summary</h3>
        <Badge variant="outline">
          Total: {stats.totalCount}
        </Badge>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Inherited Card */}
        <div data-testid="stat-card" className="border-l-4 border-blue-500 pl-3">
          <div className="text-sm text-gray-600">Inherited</div>
          <div className={`font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>
            {stats.inherited.count}
          </div>
          <div className="text-sm text-gray-500">
            {stats.inherited.percentage}%
          </div>
        </div>

        {/* Project-Specific Card */}
        <div data-testid="stat-card" className="border-l-4 border-green-500 pl-3">
          <div className="text-sm text-gray-600">Project-specific</div>
          <div className={`font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>
            {stats.projectSpecific.count}
          </div>
          <div className="text-sm text-gray-500">
            {stats.projectSpecific.percentage}%
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {(stats.quickStats?.mostInheritedMcp || stats.quickStats?.mostAddedAgent) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Stats</h4>
          {stats.quickStats?.mostInheritedMcp && (
            <div className="text-sm">
              <span className="text-gray-600">Most inherited MCP: </span>
              <Badge variant="secondary">{stats.quickStats.mostInheritedMcp}</Badge>
            </div>
          )}
          {stats.quickStats?.mostAddedAgent && (
            <div className="text-sm">
              <span className="text-gray-600">Most added Agent: </span>
              <Badge variant="secondary">{stats.quickStats.mostAddedAgent}</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}