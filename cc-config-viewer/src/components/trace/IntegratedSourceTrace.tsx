/**
 * Integrated Source Trace Component
 *
 * Combines source tracing with Story 3.1's color-coded indicators
 * and Story 3.3's inheritance path visualization for complete context.
 *
 * Implements:
 * - AC7: Integration with color-coded source indicators (Story 3.1)
 * - AC8: Support for inheritance path visualization (Story 3.3)
 */

import React from 'react'
import { Search, GitBranch } from 'lucide-react'
import { SourceIndicator } from '../SourceIndicator'
import type { ConfigEntry } from '../../types/config'
import type { SourceLocation } from '../../types/trace'
import { formatSourceLocation } from '../../utils/sourceTracker'

interface IntegratedSourceTraceProps {
  configKey: string
  configValue?: any
  sourceType?: 'user' | 'project' | 'inherited'
  sourceLocation?: SourceLocation | null
  isLoading?: boolean
  onTraceSource?: () => void
  className?: string
}

/**
 * Shows the source location with color-coded indicators from Story 3.1
 * and inheritance context from Story 3.3
 */
export const IntegratedSourceTrace: React.FC<IntegratedSourceTraceProps> = ({
  configKey,
  configValue,
  sourceType = 'user',
  sourceLocation,
  isLoading = false,
  onTraceSource,
  className = '',
}) => {
  const { displayPath, displayLine } = sourceLocation
    ? formatSourceLocation(sourceLocation)
    : { displayPath: null, displayLine: null }

  return (
    <div
      className={`integrated-source-trace flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      data-testid="integrated-source-trace"
    >
      {/* Left: Source Indicator from Story 3.1 */}
      <div className="flex-shrink-0">
        <SourceIndicator sourceType={sourceType} />
      </div>

      {/* Middle: Config Key and Value */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm text-gray-900 dark:text-gray-100 truncate">
            {configKey}
          </span>
          {sourceType === 'inherited' && (
            <GitBranch className="w-4 h-4 text-gray-500" title="Inherited value" />
          )}
        </div>
        {configValue !== undefined && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {JSON.stringify(configValue)}
          </div>
        )}
      </div>

      {/* Right: Source Location (AC2-3) */}
      <div className="flex-shrink-0">
        {isLoading ? (
          <button
            onClick={onTraceSource}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <Search className="w-4 h-4 animate-pulse" />
            <span>Tracing...</span>
          </button>
        ) : sourceLocation ? (
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Search className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {displayLine ? `${displayPath} (${displayLine})` : displayPath}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onTraceSource}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="Trace source location"
          >
            <Search className="w-3 h-3" />
            <span>Trace Source</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default IntegratedSourceTrace