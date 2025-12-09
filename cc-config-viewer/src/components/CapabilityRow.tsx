import React, { memo } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import type { UnifiedCapability } from '../types/capability'

interface CapabilityRowProps {
  capability: UnifiedCapability
}

/**
 * Component for displaying a unified capability (MCP or Agent) in a row
 * Follows the same pattern as McpBadge and AgentBadge
 */
export const CapabilityRow: React.FC<CapabilityRowProps> = memo(function CapabilityRow({
  capability
}) {
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

  const getStatusColor = (status: 'active' | 'inactive' | 'error') => {
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

  const getTypeIcon = () => {
    return capability.type === 'mcp' ? '🔌' : '🤖'
  }

  const getTypeLabel = () => {
    return capability.type === 'mcp' ? 'MCP' : 'Agent'
  }

  const getMetadataPreview = () => {
    if (capability.type === 'mcp' && capability.mcpData) {
      // For MCP servers, show type and config preview
      const configEntries = Object.entries(capability.mcpData.config || {})
      if (configEntries.length === 0) {
        return {
          primary: `Type: ${capability.mcpData.type}`,
          preview: null
        }
      }

      const previewEntries = configEntries.slice(0, 2)
      const preview = previewEntries.map(([key, value]) => {
        const displayValue = typeof value === 'string' ? value : JSON.stringify(value)
        return `${key}: ${displayValue}`
      }).join(', ')

      return {
        primary: `Type: ${capability.mcpData.type}`,
        preview
      }
    } else if (capability.type === 'agent' && capability.agentData) {
      // For agents, show model and permissions
      return {
        primary: `Model: ${capability.agentData.model.name}`,
        secondary: `Permissions: ${capability.agentData.permissions.type}`,
        preview: null
      }
    }

    return {
      primary: '',
      preview: null
    }
  }

  const metadata = getMetadataPreview()

  return (
    <TooltipProvider>
      <Card
        className="p-3 hover:shadow-md transition-shadow"
        role="article"
        aria-label={`${capability.type === 'mcp' ? 'MCP server' : 'Agent'}: ${capability.name}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold truncate">{capability.name}</h3>
              <Badge variant="outline" className={`text-xs ${getSourceColor(capability.source)}`} aria-label={`Source: ${capability.source}`}>
                {capability.source}
              </Badge>
            </div>

            {capability.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {capability.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs" aria-label={`Type: ${capability.type}`}>
                <span className="mr-1" role="img" aria-hidden="true">{getTypeIcon()}</span>
                {getTypeLabel()}
              </Badge>

              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(capability.status)}`}
                  aria-label={`Status: ${capability.status}`}
                  role="status"
                />
                <span className="text-xs text-muted-foreground capitalize" aria-live="polite">
                  {capability.status}
                </span>
              </div>
            </div>

            {metadata.primary && (
              <div className="text-xs text-muted-foreground mb-1">
                {metadata.primary}
                {metadata.secondary && ` • ${metadata.secondary}`}
              </div>
            )}

            {metadata.preview && (
              <p className="text-xs text-muted-foreground truncate" title={metadata.preview}>
                {metadata.preview}
              </p>
            )}
          </div>
        </div>

        {/* Detailed tooltip for full configuration */}
        {capability.type === 'mcp' && capability.mcpData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                View full configuration
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md">
              <div className="text-xs">
                <p className="font-semibold mb-1">{capability.mcpData.name}</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Type:</p>
                    <p>{capability.mcpData.type}</p>
                  </div>
                  {capability.mcpData.description && (
                    <div>
                      <p className="font-medium">Description:</p>
                      <p>{capability.mcpData.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Configuration:</p>
                    <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                      {JSON.stringify(capability.mcpData.config, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {capability.type === 'agent' && capability.agentData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                View full configuration
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md">
              <div className="text-xs">
                <p className="font-semibold mb-1">{capability.agentData.name}</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Model Configuration:</p>
                    <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                      {JSON.stringify(capability.agentData.model.config, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-medium">Permissions:</p>
                    <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                      Type: {capability.agentData.permissions.type}
                      {'\n'}Scopes: {capability.agentData.permissions.scopes.join(', ')}
                      {capability.agentData.permissions.restrictions && `\nRestrictions: ${capability.agentData.permissions.restrictions.join(', ')}`}
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
  // Custom comparison - only re-render if capability content changes
  return (
    prevProps.capability.id === nextProps.capability.id &&
    prevProps.capability.name === nextProps.capability.name &&
    prevProps.capability.description === nextProps.capability.description &&
    prevProps.capability.status === nextProps.capability.status &&
    prevProps.capability.source === nextProps.capability.source &&
    prevProps.capability.sourcePath === nextProps.capability.sourcePath
  )
})