import React from 'react'
import { Badge } from './ui/badge'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { HealthStatus } from '../types/health'

interface HealthStatusBadgeProps {
  status: HealthStatus
  className?: string
}

/**
 * HealthStatusBadge Component
 * Displays health status with appropriate color coding and icon
 */
export function HealthStatusBadge({ status, className }: HealthStatusBadgeProps) {
  const getStatusConfig = (status: HealthStatus) => {
    switch (status) {
      case 'good':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
          icon: CheckCircle,
          label: 'Good',
        }
      case 'warning':
        return {
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
          icon: AlertTriangle,
          label: 'Warning',
        }
      case 'error':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
          icon: XCircle,
          label: 'Error',
        }
      default:
        return {
          variant: 'outline' as const,
          className: '',
          icon: AlertTriangle,
          label: 'Unknown',
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={`flex items-center space-x-1 ${config.className} ${className || ''}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  )
}