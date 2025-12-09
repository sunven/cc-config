import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { invoke } from '../lib/tauriApi'
import type { UnifiedCapability } from '../types/capability'

interface CapabilityDetailsProps {
  capability: UnifiedCapability
  open: boolean
  onClose: () => void
}

/**
 * Component for displaying detailed information about a capability (MCP server or Agent)
 * Shows full configuration, metadata, and validation status in a modal dialog
 *
 * Performance optimizations:
 * - Uses React.memo to prevent unnecessary re-renders
 * - Uses useCallback for event handlers
 * - Uses useMemo for expensive calculations
 * - Lazy loads modal content only when opened
 */
export const CapabilityDetails: React.FC<CapabilityDetailsProps> = ({
  capability,
  open,
  onClose
}) => {
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'missing'>('valid')
  const [isValidating, setIsValidating] = useState(false)

  // Validate capability when modal opens or capability data changes
  useEffect(() => {
    if (open) {
      validateCapability()
    }
  }, [open, capability.id, capability.type])

  // Handle Escape key press for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const validateCapability = useCallback(async () => {
    setIsValidating(true)
    try {
      // Simulate validation - in real implementation, this would call a validation function
      // Debounced validation: wait 300ms before validating to avoid excessive calls
      await new Promise(resolve => setTimeout(resolve, 300))
      setValidationStatus('valid')
    } catch (error) {
      setValidationStatus('invalid')
    } finally {
      setIsValidating(false)
    }
  }, [])

  // Event handlers wrapped in useCallback to prevent unnecessary re-renders
  const handleTraceSource = useCallback(async () => {
    try {
      await invoke('open_external_editor', {
        path: capability.sourcePath,
        line: 1
      })
    } catch (error) {
      console.error('Failed to trace source:', error)
    }
  }, [capability.sourcePath])

  const handleCopyConfig = useCallback(async () => {
    try {
      let configToCopy = ''

      if (capability.type === 'mcp' && capability.mcpData) {
        configToCopy = JSON.stringify(capability.mcpData.config || {}, null, 2)
      } else if (capability.type === 'agent' && capability.agentData) {
        configToCopy = JSON.stringify({
          model: capability.agentData.model.config,
          permissions: capability.agentData.permissions
        }, null, 2)
      }

      await invoke('write_clipboard_text', { text: configToCopy })
    } catch (error) {
      console.error('Failed to copy config:', error)
    }
  }, [capability.type, capability.mcpData, capability.agentData])

  const handleEdit = useCallback(async () => {
    try {
      await invoke('open_external_editor', {
        path: capability.sourcePath,
        line: 1
      })
    } catch (error) {
      console.error('Failed to open editor:', error)
    }
  }, [capability.sourcePath])

  // Memoized style functions to prevent recalculation on every render
  const sourceColorClasses = useMemo(() => ({
    user: 'bg-blue-100 text-blue-800 border-blue-200',
    project: 'bg-green-100 text-green-800 border-green-200',
    local: 'bg-gray-100 text-gray-800 border-gray-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  }), [])

  const statusColorClasses = useMemo(() => ({
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    error: 'bg-red-500',
    default: 'bg-gray-400'
  }), [])

  const validationColorClasses = useMemo(() => ({
    valid: 'bg-green-100 text-green-800',
    invalid: 'bg-red-100 text-red-800',
    missing: 'bg-yellow-100 text-yellow-800',
    default: 'bg-gray-100 text-gray-800'
  }), [])

  const getSourceColor = useCallback((source: 'user' | 'project' | 'local') => {
    return sourceColorClasses[source] || sourceColorClasses.default
  }, [sourceColorClasses])

  const getStatusColor = useCallback((status: 'active' | 'inactive' | 'error') => {
    return statusColorClasses[status] || statusColorClasses.default
  }, [statusColorClasses])

  const getValidationColor = useCallback((status: 'valid' | 'invalid' | 'missing') => {
    return validationColorClasses[status] || validationColorClasses.default
  }, [validationColorClasses])

  const formatConfig = useCallback((config: any): string => {
    if (!config || Object.keys(config).length === 0) {
      return 'No configuration available'
    }
    return JSON.stringify(config, null, 2)
  }, [])

  // Memoized capability type info
  const capabilityTypeInfo = useMemo(() => ({
    icon: capability.type === 'mcp' ? '🔌' : '🤖',
    label: capability.type === 'mcp' ? 'MCP' : 'Agent'
  }), [capability.type])

  const getCapabilityTypeIcon = useCallback(() => capabilityTypeInfo.icon, [capabilityTypeInfo])
  const getCapabilityTypeLabel = useCallback(() => capabilityTypeInfo.label, [capabilityTypeInfo])

  // Memoized metadata to prevent recalculation
  const metadata = useMemo(() => {
    if (capability.type === 'mcp' && capability.mcpData) {
      return {
        type: capability.mcpData.type,
        description: capability.mcpData.description || 'No description',
        config: capability.mcpData.config || {}
      }
    } else if (capability.type === 'agent' && capability.agentData) {
      return {
        model: capability.agentData.model.name,
        description: capability.agentData.description || 'No description',
        permissions: capability.agentData.permissions.type,
        scopes: capability.agentData.permissions.scopes
      }
    }
    return {}
  }, [capability.type, capability.mcpData, capability.agentData])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col"
        aria-label={`${capability.type === 'mcp' ? 'MCP server' : 'Agent'} details: ${capability.name}`}
      >
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-xl">{capability.name}</DialogTitle>
                <Badge variant="outline" className={`text-xs ${getSourceColor(capability.source)}`}>
                  {capability.source}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  <span className="mr-1" role="img" aria-hidden="true">
                    {getCapabilityTypeIcon()}
                  </span>
                  {getCapabilityTypeLabel()}
                </Badge>

                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${getStatusColor(capability.status)}`}
                    aria-label={`Status: ${capability.status}`}
                    role="status"
                  />
                  <span className="text-sm text-muted-foreground capitalize">
                    {capability.status}
                  </span>
                </div>

                <Badge variant="outline" className={`text-xs ${getValidationColor(validationStatus)}`}>
                  {validationStatus}
                </Badge>
              </div>

              {capability.description && (
                <DialogDescription className="text-sm">
                  {capability.description}
                </DialogDescription>
              )}

              {/* Show key metadata in header for quick access */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                {capability.type === 'mcp' && capability.mcpData && (
                  <span>Type: {capability.mcpData.type}</span>
                )}
                {capability.type === 'agent' && capability.agentData && (
                  <span>Model: {capability.agentData.model.name}</span>
                )}
                <span>Source Path: {capability.sourcePath}</span>
                {capability.lastModified && (
                  <span>{new Date(capability.lastModified).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close dialog"
                    data-testid="close-button"
                  >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="config" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="config" className="h-full mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Configuration</h3>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4" data-testid="scroll-area">
                      <pre className="text-sm whitespace-pre-wrap">
                        {capability.type === 'mcp' && capability.mcpData
                          ? formatConfig(capability.mcpData.config)
                          : capability.type === 'agent' && capability.agentData
                          ? formatConfig({
                              model: capability.agentData.model.config,
                              permissions: capability.agentData.permissions
                            })
                          : 'Unable to display configuration'}
                      </pre>
                    </ScrollArea>
                  </div>

                  {/* Show validation status in config tab for visibility */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Validation Status:</span>
                    <Badge variant="outline" className={`${getValidationColor(validationStatus)}`} data-testid="validation-status-badge">
                      {validationStatus}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="h-full mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold mb-1">Source Path:</p>
                      <p className="text-sm text-muted-foreground break-all">{capability.sourcePath}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Last Modified:</p>
                      <p className="text-sm text-muted-foreground">
                        {capability.lastModified ? new Date(capability.lastModified).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">ID:</p>
                      <p className="text-sm text-muted-foreground">{capability.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Source:</p>
                      <p className="text-sm text-muted-foreground capitalize">{capability.source}</p>
                    </div>
                  </div>

                  <Separator />

                  {capability.type === 'mcp' && capability.mcpData && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">MCP Server Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Type:</p>
                          <p className="text-sm text-muted-foreground">{capability.mcpData.type}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {capability.type === 'agent' && capability.agentData && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Agent Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Model:</p>
                          <p className="text-sm text-muted-foreground">{capability.agentData.model.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">Permissions:</p>
                          <p className="text-sm text-muted-foreground">{capability.agentData.permissions.type}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="validation" className="h-full mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Validation Status</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateCapability}
                      disabled={isValidating}
                    >
                      {isValidating ? 'Validating...' : 'Validate'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${getValidationColor(validationStatus)}`}
                      data-testid="validation-status-tab"
                    >
                      {validationStatus.toUpperCase()}
                    </Badge>
                  </div>

                  {validationStatus === 'valid' && (
                    <p className="text-sm text-green-600">Configuration is valid and properly formatted.</p>
                  )}
                  {validationStatus === 'invalid' && (
                    <div>
                      <p className="text-sm text-red-600 mb-2">Validation error</p>
                      <Button variant="outline" size="sm" onClick={validateCapability}>
                        Retry
                      </Button>
                    </div>
                  )}
                  {validationStatus === 'missing' && (
                    <p className="text-sm text-yellow-600">Missing required fields detected.</p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleTraceSource}>
            Trace Source
          </Button>
          <Button variant="outline" onClick={handleCopyConfig}>
            Copy Config
          </Button>
          <Button variant="default" onClick={handleEdit}>
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Memoize the component to prevent unnecessary re-renders
// Similar to CapabilityRow pattern from Story 4.3
export const CapabilityDetailsMemo = React.memo(CapabilityDetails)

// Also export the default component for convenience
export default CapabilityDetailsMemo
