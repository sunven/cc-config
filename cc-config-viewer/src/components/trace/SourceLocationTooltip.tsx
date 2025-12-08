/**
 * SourceLocationTooltip component
 *
 * Displays a tooltip showing file path and line number for a configuration item.
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import React from 'react'
import { Copy, ExternalLink, FileText } from 'lucide-react'
import type { SourceLocation } from '../../types/trace'
import { formatSourceLocation } from '../../utils/sourceTracker'
import { Button } from '../ui/button'

interface SourceLocationTooltipProps {
  location: SourceLocation
  visible: boolean
  position: { x: number; y: number }
  onClose: () => void
  onOpenEditor?: (filePath: string, lineNumber?: number) => void
  onCopy?: (text: string) => void
  className?: string
}

export const SourceLocationTooltip: React.FC<SourceLocationTooltipProps> = ({
  location,
  visible,
  position,
  onClose,
  onOpenEditor,
  onCopy,
  className = '',
}) => {
  if (!visible) return null

  const { displayPath, displayLine } = formatSourceLocation(location)

  const handleOpenEditor = () => {
    if (onOpenEditor) {
      onOpenEditor(location.file_path, location.line_number)
    }
    onClose()
  }

  const handleCopyPath = () => {
    if (onCopy) {
      onCopy(location.file_path)
    }
  }

  const handleCopyFullLocation = () => {
    const fullLocation = displayLine
      ? `${displayPath} (${displayLine})`
      : displayPath
    if (onCopy) {
      onCopy(fullLocation)
    }
  }

  return (
    <div
      className={`source-location-tooltip fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] ${className}`}
      style={{
        left: position.x,
        top: position.y,
      }}
      data-testid="source-location-tooltip"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Source Location
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close tooltip"
        >
          ×
        </button>
      </div>

      {/* File Path */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">File:</p>
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1 truncate">
            {displayPath}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyPath}
            className="h-6 w-6 p-0"
            title="Copy file path"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Line Number */}
      {location.line_number && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Line:</p>
          <p className="text-sm text-gray-900 dark:text-gray-100">{location.line_number}</p>
        </div>
      )}

      {/* Context (if available) */}
      {location.context && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Context:</p>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
            {location.context}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyFullLocation}
          className="flex items-center space-x-1"
        >
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleOpenEditor}
          className="flex items-center space-x-1"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Open in Editor</span>
        </Button>
      </div>
    </div>
  )
}