import React from 'react'
import { Button } from './ui/button'
import {
  Eye,
  GitCompare,
  Settings,
  RefreshCw,
  FolderOpen
} from 'lucide-react'

interface QuickActionsProps {
  onOpenProject?: () => void
  onCompare?: () => void
  onViewDetails?: () => void
  onRefresh?: () => void
  disabled?: boolean
  isRefreshing?: boolean
  className?: string
}

/**
 * QuickActions Component
 * Displays action buttons for common operations on a project
 */
export function QuickActions({
  onOpenProject,
  onCompare,
  onViewDetails,
  onRefresh,
  disabled = false,
  isRefreshing = false,
  className,
}: QuickActionsProps) {
  const actions = [
    {
      icon: FolderOpen,
      label: 'Open',
      onClick: onOpenProject,
      variant: 'ghost' as const,
      show: !!onOpenProject,
    },
    {
      icon: GitCompare,
      label: 'Compare',
      onClick: onCompare,
      variant: 'outline' as const,
      show: !!onCompare,
    },
    {
      icon: Settings,
      label: 'Details',
      onClick: onViewDetails,
      variant: 'outline' as const,
      show: !!onViewDetails,
    },
    {
      icon: RefreshCw,
      label: 'Refresh',
      onClick: onRefresh,
      variant: 'ghost' as const,
      show: !!onRefresh,
      isSpinning: isRefreshing,
    },
  ].filter((action) => action.show)

  return (
    <div className={`flex space-x-2 ${className || ''}`}>
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            disabled={disabled || (action.isSpinning ?? false)}
            className="flex items-center space-x-1"
          >
            <Icon
              className={`h-4 w-4 ${action.isSpinning ? 'animate-spin' : ''}`}
            />
            <span>{action.label}</span>
          </Button>
        )
      })}
    </div>
  )
}