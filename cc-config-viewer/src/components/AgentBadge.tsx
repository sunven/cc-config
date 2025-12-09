import React, { memo } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import type { Agent } from '../types/agent'

interface AgentBadgeProps {
  agent: Agent
  source: 'user' | 'project' | 'local'
}

export const AgentBadge: React.FC<AgentBadgeProps> = memo(function AgentBadge({ agent, source }) {
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

  const getPermissionsColor = (type: Agent['permissions']['type']) => {
    switch (type) {
      case 'read':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'write':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'custom':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: Agent['status']) => {
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
    const configEntries = Object.entries(agent.model.config || {})
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
      <Card className="p-3 hover:shadow-md transition-shadow" role="article" aria-label={`Agent: ${agent.name}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold truncate">{agent.name}</h3>
              <Badge variant="outline" className={`text-xs ${getSourceColor(source)}`} aria-label={`Source: ${source}`}>
                {source}
              </Badge>
            </div>

            {agent.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {agent.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={`text-xs ${getPermissionsColor(agent.permissions.type)}`} aria-label={`Permissions: ${agent.permissions.type}`}>
                {agent.permissions.type}
              </Badge>

              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}
                  aria-label={`Status: ${agent.status}`}
                  role="status"
                />
                <span className="text-xs text-muted-foreground capitalize" aria-live="polite">
                  {agent.status}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">Model:</span> {agent.model.name}
              {agent.model.provider && ` (${agent.model.provider})`}
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
                <p className="font-semibold mb-1">{agent.name}</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Model Configuration:</p>
                    <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                      {JSON.stringify(agent.model.config, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-medium">Permissions:</p>
                    <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                      Type: {agent.permissions.type}
                      {'\n'}Scopes: {agent.permissions.scopes.join(', ')}
                      {agent.permissions.restrictions && `\nRestrictions: ${agent.permissions.restrictions.join(', ')}`}
                    </pre>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </Card>
    </TooltipProvider>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if agent content or source changes
  return (
    prevProps.agent.id === nextProps.agent.id &&
    prevProps.agent.name === nextProps.agent.name &&
    prevProps.agent.description === nextProps.agent.description &&
    prevProps.agent.model.name === nextProps.agent.model.name &&
    prevProps.agent.model.provider === nextProps.agent.model.provider &&
    prevProps.agent.permissions.type === nextProps.agent.permissions.type &&
    prevProps.agent.status === nextProps.agent.status &&
    prevProps.agent.sourcePath === nextProps.agent.sourcePath &&
    prevProps.source === nextProps.source
  )
})
