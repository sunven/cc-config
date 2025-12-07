import React, { memo } from 'react'
import type { ConfigEntry } from '../types'
import { Badge } from './ui/badge'
import { InheritedIndicator } from './InheritedIndicator'

interface ConfigListProps {
  configs: ConfigEntry[]
  title?: string
  isLoading?: boolean
  error?: string | null
}

export const ConfigList: React.FC<ConfigListProps> = memo(function ConfigList({ configs, title = 'Configuration', isLoading, error }) {
  const getSourceBadgeVariant = (sourceType: 'user' | 'project' | 'local') => {
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
  }

  const getSourceBadgeClassName = (sourceType: 'user' | 'project' | 'local') => {
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
  }

  const formatValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading configuration...</div>
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
            <div
              key={config.key}
              className="flex items-start justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{config.key}</span>
                  {config.inherited && (
                    <InheritedIndicator source="user" showTooltip={true} />
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
                  variant={getSourceBadgeVariant(config.source.type)}
                  className={getSourceBadgeClassName(config.source.type)}
                >
                  {config.source.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
