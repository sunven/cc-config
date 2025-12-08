import React, { memo } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import type { McpServer } from '../types/mcp'

interface McpBadgeProps {
  server: McpServer
  source: 'user' | 'project' | 'local'
}

export const McpBadge: React.FC<McpBadgeProps> = memo(function McpBadge({ server, source }) {
  const getSourceColor = (source: 'user' | 'project' | 'local') => {
    switch (source) {
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'project':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'local':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: McpServer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-400'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getConfigPreview = () => {
    const configEntries = Object.entries(server.config || {})
    if (configEntries.length === 0) return null

    // Show first 2-3 key settings
    const previewEntries = configEntries.slice(0, 3)
    return previewEntries.map(([key, value]) => {
      const displayValue = typeof value === 'string' ? value : JSON.stringify(value)
      return `${key}: ${displayValue}`
    }).join(', ')
  }

  const configPreview = getConfigPreview()

  return (
    <TooltipProvider>
      <Card className="p-3 hover:shadow-md transition-shadow" role="article" aria-label={`MCP server: ${server.name}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold truncate">{server.name}</h3>
              <Badge variant="outline" className={`text-xs ${getSourceColor(source)}`} aria-label={`Source: ${source}`}>
                {source}
              </Badge>
            </div>

            {server.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {server.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs" aria-label={`Type: ${server.type}`}>
                {server.type}
              </Badge>

              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`}
                  aria-label={`Status: ${server.status}`}
                  role="status"
                />
                <span className="text-xs text-muted-foreground capitalize" aria-live="polite">
                  {server.status}
                </span>
              </div>
            </div>

            {configPreview && (
              <p className="text-xs text-muted-foreground truncate" title={configPreview}>
                {configPreview}
              </p>
            )}
          </div>
        </div>

        {configPreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                View full configuration
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md">
              <div className="text-xs">
                <p className="font-semibold mb-1">{server.name}</p>
                <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                  {JSON.stringify(server.config, null, 2)}
                </pre>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </Card>
    </TooltipProvider>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if server content or source changes
  return (
    prevProps.server.name === nextProps.server.name &&
    prevProps.server.type === nextProps.server.type &&
    prevProps.server.description === nextProps.server.description &&
    prevProps.server.status === nextProps.server.status &&
    prevProps.server.config === nextProps.server.config &&
    prevProps.server.sourcePath === nextProps.server.sourcePath &&
    prevProps.source === nextProps.source
  )
})
