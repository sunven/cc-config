import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ProjectSkeleton } from './ProjectSkeleton'
import { getDiscoveredProjects } from '../lib/projectDetection'
import type { DiscoveredProject } from '../types/project'
import { Folder, FileText, Clock, Search } from 'lucide-react'

interface ProjectListProps {
  onProjectSelect?: (project: DiscoveredProject) => void
}

/**
 * ProjectList Component
 * Displays a list of discovered projects with search and filtering
 */
export function ProjectList({ onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<DiscoveredProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<DiscoveredProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterConfig, setFilterConfig] = useState<'all' | 'has-mcp' | 'has-agents'>('all')

  // Load projects on component mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Filter projects based on search query and config filter
  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery, filterConfig])

  async function loadProjects() {
    setLoading(true)
    setError(null)
    try {
      const discoveredProjects = await getDiscoveredProjects()
      setProjects(discoveredProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  function filterProjects() {
    let filtered = [...projects]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.path.toLowerCase().includes(query)
      )
    }

    // Apply config filter
    if (filterConfig === 'has-mcp') {
      filtered = filtered.filter((project) => project.configFileCount > 0)
    } else if (filterConfig === 'has-agents') {
      filtered = filtered.filter((project) => project.subAgents && project.subAgents.length > 0)
    }

    setFilteredProjects(filtered)
  }

  function handleProjectClick(project: DiscoveredProject) {
    if (onProjectSelect) {
      onProjectSelect(project)
    }
  }

  function formatLastModified(date: Date): string {
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          </CardContent>
        </Card>
        <ProjectSkeleton count={6} layout="grid" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading projects: {error}</p>
            <Button onClick={loadProjects} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by name or path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterConfig === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterConfig('all')}
              >
                All
              </Button>
              <Button
                variant={filterConfig === 'has-mcp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterConfig('has-mcp')}
              >
                Has Config
              </Button>
              <Button
                variant={filterConfig === 'has-agents' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterConfig('has-agents')}
              >
                Has Agents
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Folder className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No projects found</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
              formatLastModified={formatLastModified}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectCardProps {
  project: DiscoveredProject
  onClick: () => void
  formatLastModified: (date: Date) => string
}

function ProjectCard({ project, onClick, formatLastModified }: ProjectCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
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
      </CardContent>
    </Card>
  )
}
