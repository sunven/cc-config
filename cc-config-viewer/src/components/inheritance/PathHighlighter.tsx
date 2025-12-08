/**
 * PathHighlighter component
 *
 * Provides path highlighting feature to emphasize the source of inherited values.
 *
 * Implements:
 * - AC3: Path highlighting feature to emphasize the source of inherited values
 * - Subtask 3.1: Add visual emphasis for inheritance paths
 * - Subtask 3.2: Highlight source values and their propagation
 * - Subtask 3.3: Support highlighting multiple paths simultaneously
 */

import React from 'react'
import type { ConfigEntry } from '../../types/config'
import type { PathHighlighterProps } from '../../types/inheritance'

export const PathHighlighter: React.FC<PathHighlighterProps> = ({
  configKey,
  configs,
  className
}) => {
  const hasHighlight = configKey !== null

  return (
    <div
      data-testid="path-highlighter"
      className={`path-highlighter ${hasHighlight ? 'has-highlight' : ''} ${className || ''}`}
    >
      {configs.map(config => {
        const isHighlighted = config.key === configKey

        return (
          <div
            key={config.key}
            data-testid={`highlight-${config.key}`}
            data-highlighted={isHighlighted}
            data-classification={config.overridden ? 'override' : config.inherited ? 'inherited' : 'project-specific'}
            className={`path-emphasis transition-all duration-300 ${
              isHighlighted
                ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50'
                : ''
            }`}
          >
            {/* Source highlighting */}
            <div data-testid="source-highlight" className="mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                {config.source.type === 'user' ? 'User Source' : 'Project Source'}
              </h4>
              <p className="text-xs text-gray-600">{config.source.path}</p>
            </div>

            {/* Propagation highlighting */}
            <div data-testid="propagation-highlight">
              <h5 className="text-xs font-medium text-gray-600">Propagation:</h5>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs">{JSON.stringify(config.value)}</span>
                {config.overridden && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Overridden
                  </span>
                )}
                {config.inherited && (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                    Inherited
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}