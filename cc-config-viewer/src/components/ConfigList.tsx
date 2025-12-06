import React from 'react'
import type { ConfigEntry } from '../types'

interface ConfigListProps {
  configs: ConfigEntry[]
  title?: string
}

export const ConfigList: React.FC<ConfigListProps> = ({ configs, title = 'Configuration' }) => {
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
              className="flex items-center justify-between p-2 border-b last:border-b-0"
            >
              <div className="flex-1">
                <span className="font-medium">{config.key}</span>
                <span className="ml-2 text-sm text-gray-600">
                  {typeof config.value === 'object'
                    ? JSON.stringify(config.value)
                    : String(config.value)}
                </span>
                {config.inherited && (
                  <span className="ml-2 text-xs text-blue-600">(inherited)</span>
                )}
                {config.overridden && (
                  <span className="ml-2 text-xs text-orange-600">(overridden)</span>
                )}
              </div>
              <span className="text-xs text-gray-500">{config.source.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
