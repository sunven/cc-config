import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Folder, FileText, Clock } from 'lucide-react'
import type { DiscoveredProject } from '../types/project'

interface ProjectCardProps {
  project: DiscoveredProject
  onClick?: () => void
  className?: string
}

/**
 * ProjectCard Component
 * Displays individual project information
 */
export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  const formatLastModified = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className || ''}`} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge variant="outline">{project.configFileCount} files</Badge>
        </div>
        <CardDescription className="font-mono text-xs break-all">
          {project.path}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatLastModified(project.lastModified)}</span>
            </div>
            {project.mcpServers && project.mcpServers.length > 0 && (
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{project.mcpServers.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Config Source Indicators */}
        <div className="flex gap-2 mt-3">
          {project.configSources.user && (
            <Badge variant="secondary" className="text-xs">
              User
            </Badge>
          )}
          {project.configSources.project && (
            <Badge variant="secondary" className="text-xs">
              Project
            </Badge>
          )}
          {project.configSources.local && (
            <Badge variant="secondary" className="text-xs">
              Local
            </Badge>
          )}
        </div>

        {/* Sub-agents Information */}
        {project.subAgents && project.subAgents.length > 0 && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {project.subAgents.join(', ')}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
