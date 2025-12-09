import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Folder, FileText, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { DiscoveredProject } from '../types/project'
import type { ProjectHealth } from '../types/health'
import { HealthStatusBadge } from './HealthStatusBadge'
import { SourceIndicator } from './SourceIndicator'

interface ProjectHealthCardProps {
  project: DiscoveredProject
  health?: ProjectHealth
  isSelected?: boolean
  onSelect?: () => void
  onCompare?: () => void
  onViewDetails?: () => void
  className?: string
  tabIndex?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
  'aria-label'?: string
}

/**
 * ProjectHealthCard Component
 * Displays individual project health status with key metrics and actions
 */
export function ProjectHealthCard({
  project,
  health,
  isSelected,
  onSelect,
  onCompare,
  onViewDetails,
  className,
  tabIndex,
  onKeyDown,
  ...rest
}: ProjectHealthCardProps) {
  const formatDate = (dateInput: number | Date) => {
    const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : dateInput
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <article
      className={`
        transition-all duration-200 hover:shadow-md
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${className || ''}
      `}
      role="article"
      aria-label={rest['aria-label'] || `${project.name} project health card`}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      {/* Card Header */}
      <header className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <Folder className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{project.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 truncate">{project.path}</p>
            </div>
          </div>
          {health && (
            <HealthStatusBadge
              status={health.status}
              aria-label={`Project health: ${health.status}, score ${Math.round(health.score)} out of 100`}
            />
          )}
        </div>
      </header>

      {/* Card Content */}
      <CardContent className="pt-0">
        {/* Health Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4" role="group" aria-label="Project metrics">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Configs</span>
            </div>
            <p className="text-lg font-semibold">{project.configFileCount}</p>
            {health && (
              <p
                className="text-xs text-muted-foreground"
                aria-label={`${health.metrics.validConfigs} of ${health.metrics.totalCapabilities} configurations are valid`}
              >
                {health.metrics.validConfigs}/{health.metrics.totalCapabilities} valid
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Last Modified</span>
            </div>
            <p className="text-sm font-medium">{formatDate(project.lastModified)}</p>
            {health && (
              <p
                className="text-xs text-muted-foreground"
                aria-label={`Health last checked on ${new Date(health.metrics.lastChecked).toLocaleDateString()}`}
              >
                Last checked: {new Date(health.metrics.lastChecked).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Health Score */}
        {health && (
          <div className="mb-4" role="group" aria-label={`Health score ${Math.round(health.score)} out of 100, status ${health.status}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Health Score</span>
              <span
                className="text-sm font-semibold"
                aria-label={`${Math.round(health.score)} out of 100`}
              >
                {Math.round(health.score)}/100
              </span>
            </div>
            <div
              className="w-full bg-secondary rounded-full h-2"
              role="progressbar"
              aria-valuenow={Math.round(health.score)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Health score progress: ${Math.round(health.score)} percent`}
            >
              <div
                className={`h-2 rounded-full transition-all ${
                  health.status === 'good'
                    ? 'bg-green-500'
                    : health.status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${health.score}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Configuration Sources */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Configuration Sources</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {project.configSources.user && (
              <SourceIndicator sourceType="user" className="text-xs" />
            )}
            {project.configSources.project && (
              <SourceIndicator sourceType="project" className="text-xs" />
            )}
            {project.configSources.local && (
              <SourceIndicator sourceType="inherited" className="text-xs" />
            )}
          </div>
        </div>

        {/* Issues Summary */}
        {health && (health.metrics.errors > 0 || health.metrics.warnings > 0) && (
          <div className="mb-4" role="group" aria-label="Health issues summary">
            <div className="flex items-center space-x-4 text-sm">
              {health.metrics.errors > 0 && (
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                  <span className="text-red-600 font-medium" aria-label={`${health.metrics.errors} errors found`}>
                    {health.metrics.errors} errors
                  </span>
                </div>
              )}
              {health.metrics.warnings > 0 && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                  <span className="text-yellow-600 font-medium" aria-label={`${health.metrics.warnings} warnings found`}>
                    {health.metrics.warnings} warnings
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2" role="group" aria-label="Project actions">
          {onCompare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCompare}
              className="flex-1"
              disabled={!health || health.status === 'error'}
              aria-label={`Compare ${project.name} with another project`}
            >
              Compare
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="flex-1"
              aria-label={`View detailed capabilities for ${project.name}`}
            >
              View Details
            </Button>
          )}
        </div>

        {/* Empty State */}
        {!health && (
          <div className="text-center text-muted-foreground py-4" role="status" aria-live="polite">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm">No health data available</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onViewDetails}
              aria-label={`Check health for ${project.name}`}
            >
              Check Health
            </Button>
          </div>
        )}
      </CardContent>
    </article>
  )
}