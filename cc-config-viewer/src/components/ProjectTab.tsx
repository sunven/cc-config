import React, { memo, useCallback } from 'react'
import { useUiStore } from '../stores/uiStore'
import { useConfigStore } from '../stores/configStore'
import { Badge } from './ui/badge'
import type { Project } from '../types/project'

interface ProjectTabProps {
  scope: 'user' | 'project'
  project?: Project | null
}

export const ProjectTab: React.FC<ProjectTabProps> = memo(function ProjectTab({ scope, project }) {
  // Use selectors for fine-grained subscriptions - prevent re-renders from unrelated state changes
  const currentScope = useUiStore((state) => state.currentScope)
  const setCurrentScope = useUiStore((state) => state.setCurrentScope)
  const switchToScope = useConfigStore((state) => state.switchToScope)

  const isActive = currentScope === scope
  const label = scope === 'user' ? '用户级' : (project?.name || 'Project')

  // Memoize click handler to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    setCurrentScope(scope)
    // Use switchToScope which serves from cache first (instant switch)
    switchToScope(scope)
  }, [scope, setCurrentScope, switchToScope])

  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors duration-150 ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={handleClick}
    >
      {label}
      {scope === 'user' && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          User
        </Badge>
      )}
      {scope === 'project' && (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Project
        </Badge>
      )}
    </button>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if props change
  return (
    prevProps.scope === nextProps.scope &&
    prevProps.project?.id === nextProps.project?.id &&
    prevProps.project?.name === nextProps.project?.name
  )
})
