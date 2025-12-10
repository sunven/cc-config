import React, { memo, useMemo } from 'react'
import equal from 'fast-deep-equal'
import type { ConfigEntry } from '../types'
import { Badge } from './ui/badge'
import { SourceIndicator } from './SourceIndicator'
import { ConfigSkeleton } from './ConfigSkeleton'
import { useConfigStore } from '../stores/configStore'
import { useUiStore } from '../stores/uiStore'

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
  formatValue,
  inheritanceMap
}: {
  config: ConfigEntry
  formatValue: (value: any) => string
  inheritanceMap: Map<string, any>
}) {
  const inheritanceData = inheritanceMap.get(config.key)

  // Determine classification and display appropriate labels with inheritance chain
  const getClassificationBadge = () => {
    if (!inheritanceData) return null

    switch (inheritanceData.classification) {
      case 'override':
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
              Override
            </Badge>
            <span className="text-xs text-gray-500">User → Project</span>
          </div>
        )
      case 'project-specific':
        return (
          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
            Project Specific
          </Badge>
        )
      case 'inherited':
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
              Inherited
            </Badge>
            <span className="text-xs text-gray-500">User → Project</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="flex items-start justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-150"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{config.key}</span>
          {getClassificationBadge()}
          {config.overridden && !inheritanceData && (
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
        <SourceIndicator sourceType={config.source.type} />
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if config content changes
  // Use fast-deep-equal for efficient value comparison (Story 3.1 Code Review Fix)
  const prevInheritance = prevProps.inheritanceMap?.get(prevProps.config.key)
  const nextInheritance = nextProps.inheritanceMap?.get(nextProps.config.key)

  return (
    prevProps.config.key === nextProps.config.key &&
    prevProps.config.source.type === nextProps.config.source.type &&
    equal(prevProps.config.value, nextProps.config.value) &&
    prevProps.config.inherited === nextProps.config.inherited &&
    prevProps.config.overridden === nextProps.config.overridden &&
    equal(prevInheritance, nextInheritance)
  )
})

export const ConfigList: React.FC<ConfigListProps> = memo(function ConfigList({
  configs,
  title = 'Configuration',
  isLoading,
  error
}) {
  // Get inheritance data from store
  const inheritanceMap = useConfigStore((state) => state.inheritanceMap)

  // Log warning if list is large (future optimization opportunity)
  if (process.env.NODE_ENV === 'development' && configs.length > VIRTUALIZATION_THRESHOLD) {
    console.warn(
      `[ConfigList] Large list detected (${configs.length} items). ` +
      `Consider implementing virtualization for lists > ${VIRTUALIZATION_THRESHOLD} items.`
    )
  }

  // Memoize helper functions to prevent re-creation on each render
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
        <ConfigSkeleton count={5} />
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
              formatValue={formatValue}
              inheritanceMap={inheritanceMap}
            />
          ))}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization (Story 3.1 Code Review Fix)
  // Only re-render if meaningful changes occur
  if (prevProps.isLoading !== nextProps.isLoading) return false
  if (prevProps.error !== nextProps.error) return false
  if (prevProps.title !== nextProps.title) return false
  if (prevProps.configs.length !== nextProps.configs.length) return false

  // Compare inheritance maps
  const prevInheritanceMap = prevProps.inheritanceMap
  const nextInheritanceMap = nextProps.inheritanceMap

  // If maps have different sizes or one is undefined, re-render
  if (!prevInheritanceMap || !nextInheritanceMap) return false
  if (prevInheritanceMap.size !== nextInheritanceMap.size) return false

  // Check if any key's inheritance data changed
  for (const [key, prevInheritance] of prevInheritanceMap) {
    const nextInheritance = nextInheritanceMap.get(key)
    if (!equal(prevInheritance, nextInheritance)) {
      return false
    }
  }

  // Use fast-deep-equal for efficient deep comparison
  for (let i = 0; i < prevProps.configs.length; i++) {
    const prevConfig = prevProps.configs[i]
    const nextConfig = nextProps.configs[i]
    if (
      prevConfig.key !== nextConfig.key ||
      prevConfig.source.type !== nextConfig.source.type ||
      !equal(prevConfig.value, nextConfig.value)
    ) {
      return false
    }
  }

  return true
})
