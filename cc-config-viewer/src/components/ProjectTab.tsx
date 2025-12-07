import React, { memo } from 'react'
import { useUiStore } from '../stores/uiStore'
import { useConfigStore } from '../stores/configStore'
import { Badge } from './ui/badge'
import type { Project } from '../types/project'

interface ProjectTabProps {
  scope: 'user' | 'project'
  project?: Project | null
}

export const ProjectTab: React.FC<ProjectTabProps> = memo(({ scope, project }) => {
  const { currentScope, setCurrentScope } = useUiStore()
  const { updateConfigs } = useConfigStore()

  const isActive = currentScope === scope
  const label = scope === 'user' ? '用户级' : (project?.name || 'Project')

  const handleClick = () => {
    setCurrentScope(scope)
    // Update configs when switching to this scope
    updateConfigs()
  }

  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
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
})
