import React from 'react'
import { Card, CardContent } from './ui/card'
import { FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { ProjectHealth } from '../types/health'

interface ProjectMetricsProps {
  health: ProjectHealth
  className?: string
}

/**
 * ProjectMetrics Component
 * Displays detailed health metrics for a project
 */
export function ProjectMetrics({ health, className }: ProjectMetricsProps) {
  const { metrics } = health

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const metricsData = [
    {
      label: 'Total Capabilities',
      value: metrics.totalCapabilities,
      icon: FileText,
      className: 'text-muted-foreground',
    },
    {
      label: 'Valid Configs',
      value: metrics.validConfigs,
      icon: CheckCircle,
      className: 'text-green-600',
    },
    {
      label: 'Invalid Configs',
      value: metrics.invalidConfigs,
      icon: XCircle,
      className: 'text-red-600',
    },
    {
      label: 'Warnings',
      value: metrics.warnings,
      icon: AlertTriangle,
      className: 'text-yellow-600',
    },
    {
      label: 'Errors',
      value: metrics.errors,
      icon: XCircle,
      className: 'text-red-600 font-semibold',
    },
  ]

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Health Metrics</h3>

        <div className="grid grid-cols-2 gap-4">
          {metricsData.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-secondary ${metric.className}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className={`text-lg font-medium ${metric.className}`}>
                    {metric.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Checked:</span>
            <span className="font-medium">{formatDate(metrics.lastChecked)}</span>
          </div>
          {metrics.lastAccessed && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Accessed:</span>
              <span className="font-medium">{formatDate(metrics.lastAccessed)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}