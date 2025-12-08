import React, { memo, useMemo } from 'react'
import type { ConfigEntry } from '../types'
import { Badge } from './ui/badge'
import { InheritedIndicator } from './InheritedIndicator'

/**
 * Virtualization threshold - consider implementing react-window if list exceeds this.
 * Based on Story 2.4 Task 4 evaluation:
 * - Typical Claude config files have <50 items
 * - React.memo with custom comparison handles small lists efficiently
 * - Virtualization overhead may exceed benefits for lists under 100 items
 *
 * Future implementation: If configs.length > VIRTUALIZATION_THRESHOLD,
 * consider using react-window's FixedSizeList or VariableSizeList
 */
const VIRTUALIZATION_THRESHOLD = 100

interface ConfigListProps {
  configs: ConfigEntry[]
  title?: string
  isLoading?: boolean
  error?: string | null
}

// Memoized config item component for better performance with large lists
const ConfigItem = memo(function ConfigItem({
  config,
  getSourceBadgeVariant,
  getSourceBadgeClassName,
  formatValue
}: {
  config: ConfigEntry
  getSourceBadgeVariant: (sourceType: 'user' | 'project' | 'local') => string
  getSourceBadgeClassName: (sourceType: 'user' | 'project' | 'local') => string
  formatValue: (value: any) => string
}) {
  return (
    <div
      className="flex items-start justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-150"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{config.key}</span>
          {config.inherited && config.source.type !== 'local' && (
            <InheritedIndicator source={config.source.type} showTooltip={true} />
          )}
          {config.overridden && (
            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
              Overridden
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded overflow-x-auto">
          {formatValue(config.value)}
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        <Badge
          variant={getSourceBadgeVariant(config.source.type) as any}
          className={getSourceBadgeClassName(config.source.type)}
        >
          {config.source.type}
        </Badge>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if config content changes
  return (
    prevProps.config.key === nextProps.config.key &&
    prevProps.config.source.type === nextProps.config.source.type &&
    JSON.stringify(prevProps.config.value) === JSON.stringify(nextProps.config.value) &&
    prevProps.config.inherited === nextProps.config.inherited &&
    prevProps.config.overridden === nextProps.config.overridden
  )
})

export const ConfigList: React.FC<ConfigListProps> = memo(function ConfigList({
  configs,
  title = 'Configuration',
  isLoading,
  error
}) {
  // Log warning if list is large (future optimization opportunity)
  if (process.env.NODE_ENV === 'development' && configs.length > VIRTUALIZATION_THRESHOLD) {
    console.warn(
      `[ConfigList] Large list detected (${configs.length} items). ` +
      `Consider implementing virtualization for lists > ${VIRTUALIZATION_THRESHOLD} items.`
    )
  }

  // Memoize helper functions to prevent re-creation on each render
  const getSourceBadgeVariant = useMemo(() => (sourceType: 'user' | 'project' | 'local') => {
    switch (sourceType) {
      case 'user':
        return 'default'
      case 'project':
        return 'secondary'
      case 'local':
        return 'outline'
      default:
        return 'outline'
    }
  }, [])

  const getSourceBadgeClassName = useMemo(() => (sourceType: 'user' | 'project' | 'local') => {
    switch (sourceType) {
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'project':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'local':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return ''
    }
  }, [])

  const formatValue = useMemo(() => (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500" data-testid="loading-spinner">Loading configuration...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {configs.length === 0 ? (
        <p className="text-gray-500 text-sm">No configuration entries found</p>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <ConfigItem
              key={config.key}
              config={config}
              getSourceBadgeVariant={getSourceBadgeVariant}
              getSourceBadgeClassName={getSourceBadgeClassName}
              formatValue={formatValue}
            />
          ))}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  // Only re-render if meaningful changes occur
  if (prevProps.isLoading !== nextProps.isLoading) return false
  if (prevProps.error !== nextProps.error) return false
  if (prevProps.title !== nextProps.title) return false
  if (prevProps.configs.length !== nextProps.configs.length) return false

  // Deep comparison of config keys and values
  for (let i = 0; i < prevProps.configs.length; i++) {
    const prevConfig = prevProps.configs[i]
    const nextConfig = nextProps.configs[i]
    if (
      prevConfig.key !== nextConfig.key ||
      prevConfig.source.type !== nextConfig.source.type ||
      JSON.stringify(prevConfig.value) !== JSON.stringify(nextConfig.value)
    ) {
      return false
    }
  }

  return true
})
