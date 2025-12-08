import React from 'react'
import { Badge } from './ui/badge'
import type { ConfigSource } from '../types/config'

interface SourceIndicatorProps {
  sourceType: ConfigSource['type']
  label?: string
  className?: string
}

/**
 * SourceIndicator component that displays the source of a configuration item
 * with color-coded badges for easy identification.
 *
 * Color coding (per Story 3.1 AC1-3):
 * - Blue (bg-blue-100 text-blue-800 border-blue-200): User-level configurations
 * - Green (bg-green-100 text-green-800 border-green-200): Project-level configurations
 * - Gray (bg-gray-100 text-gray-800 border-gray-200): Inherited configurations
 *
 * Descriptive labels (per Story 3.1 AC4):
 * - "User Level" for user configurations
 * - "Project Specific" for project configurations
 * - "Inherited from User" for inherited configurations
 */
export const SourceIndicator: React.FC<SourceIndicatorProps> = ({
  sourceType,
  label,
  className
}) => {
  // Get badge variant based on source type
  const getBadgeVariant = (type: ConfigSource['type']): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'user':
        return 'default'
      case 'project':
        return 'secondary'
      case 'inherited':
        return 'outline'
      default:
        // Exhaustiveness check - ensures all cases are handled
        const _exhaustiveCheck: never = type
        return 'outline'
    }
  }

  // Get CSS classes based on source type
  const getSourceStyles = (type: ConfigSource['type']): string => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'project':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inherited':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        // Exhaustiveness check - ensures all cases are handled
        const _exhaustiveCheck: never = type
        return ''
    }
  }

  // Get descriptive label text based on source type (AC4)
  const getDescriptiveLabel = (type: ConfigSource['type']): string => {
    switch (type) {
      case 'user':
        return 'User Level'
      case 'project':
        return 'Project Specific'
      case 'inherited':
        return 'Inherited from User'
      default:
        const _exhaustiveCheck: never = type
        return type
    }
  }

  const displayLabel = label || getDescriptiveLabel(sourceType)
  const badgeVariant = getBadgeVariant(sourceType)
  const sourceStyles = getSourceStyles(sourceType)

  return (
    <Badge
      variant={badgeVariant}
      className={`${sourceStyles} ${className || ''}`}
      data-variant={badgeVariant}
      data-testid={`source-indicator-${sourceType}`}
    >
      {displayLabel}
    </Badge>
  )
}
