/**
 * SourceTraceContext component
 *
 * Provides a context menu for tracing configuration items to their source files.
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import React, { useState } from 'react'
import { Search, Copy, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import type { SourceLocation } from '../../types/trace'
import { sourceTracker, formatSourceLocation } from '../../utils/sourceTracker'
import { openFileInEditor } from '../../utils/externalEditorLauncher'
import { SourceLocationTooltip } from './SourceLocationTooltip'

interface SourceTraceContextProps {
  configKey: string
  configValue?: any
  projectPath?: string
  className?: string
  children: React.ReactNode
}

interface ContextMenuState {
  visible: boolean
  position: { x: number; y: number }
  sourceLocation: SourceLocation | null
  isLoading: boolean
  error: string | null
}

export const SourceTraceContext: React.FC<SourceTraceContextProps> = ({
  configKey,
  configValue,
  projectPath,
  className = '',
  children,
}) => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    sourceLocation: null,
    isLoading: false,
    error: null,
  })

  const [tooltipState, setTooltipState] = useState<{
    visible: boolean
    position: { x: number; y: number }
    location: SourceLocation | null
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    location: null,
  })

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenuState({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      sourceLocation: null,
      isLoading: false,
      error: null,
    })
  }

  const handleClickOutside = () => {
    setMenuState(prev => ({ ...prev, visible: false }))
    setTooltipState(prev => ({ ...prev, visible: false }))
  }

  const handleTraceSource = async () => {
    setMenuState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const location = await sourceTracker.traceSource(configKey, [])

      if (location) {
        setMenuState(prev => ({
          ...prev,
          sourceLocation: location,
          isLoading: false,
        }))
      } else {
        setMenuState(prev => ({
          ...prev,
          sourceLocation: null,
          isLoading: false,
          error: 'Source location not found',
        }))
      }
    } catch (error) {
      console.error('Failed to trace source:', error)
      setMenuState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  const handleCopyPath = async () => {
    try {
      if (menuState.sourceLocation) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('copy_to_clipboard', {
          text: menuState.sourceLocation.file_path,
        })
        console.log('File path copied to clipboard')
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      setMenuState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to copy to clipboard',
      }))
    }
  }

  const handleOpenInEditor = async () => {
    if (!menuState.sourceLocation) return

    try {
      await openFileInEditor(
        menuState.sourceLocation.file_path,
        menuState.sourceLocation.line_number
      )
    } catch (error) {
      console.error('Failed to open in editor:', error)
      setMenuState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to open editor',
      }))
    }
  }

  const handleShowTooltip = () => {
    if (!menuState.sourceLocation) return

    setTooltipState({
      visible: true,
      position: {
        x: menuState.position.x + 200, // Offset from context menu
        y: menuState.position.y,
      },
      location: menuState.sourceLocation,
    })
  }

  // Close menus when clicking outside
  React.useEffect(() => {
    if (menuState.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuState.visible])

  return (
    <>
      <div
        className={`source-trace-context ${className}`}
        onContextMenu={handleRightClick}
        data-testid="source-trace-context"
      >
        {children}
      </div>

      {/* Context Menu */}
      {menuState.visible && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{
            left: menuState.position.x,
            top: menuState.position.y,
          }}
          data-testid="source-trace-context-menu"
        >
          {/* Menu Item: Trace Source */}
          <button
            onClick={handleTraceSource}
            disabled={menuState.isLoading}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{menuState.isLoading ? 'Tracing...' : 'Trace Source'}</span>
          </button>

          {/* Menu Item: Copy Path */}
          <button
            onClick={handleCopyPath}
            disabled={!menuState.sourceLocation}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            <span>Copy File Path</span>
          </button>

          {/* Menu Item: Open in Editor */}
          <button
            onClick={handleOpenInEditor}
            disabled={!menuState.sourceLocation}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Editor</span>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Status Display */}
          {menuState.error && (
            <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400">
              {menuState.error}
            </div>
          )}

          {menuState.sourceLocation && (
            <button
              onClick={handleShowTooltip}
              className="w-full px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Show details...
            </button>
          )}
        </div>
      )}

      {/* Tooltip */}
      {tooltipState.visible && tooltipState.location && (
        <SourceLocationTooltip
          location={tooltipState.location}
          visible={tooltipState.visible}
          position={tooltipState.position}
          onClose={() => setTooltipState(prev => ({ ...prev, visible: false }))}
          onOpenEditor={openFileInEditor}
          onCopy={async (text) => {
            try {
              const { invoke } = await import('@tauri-apps/api/core')
              await invoke('copy_to_clipboard', { text })
              console.log('Copied to clipboard:', text)
            } catch (error) {
              console.error('Failed to copy:', error)
            }
          }}
        />
      )}
    </>
  )
}