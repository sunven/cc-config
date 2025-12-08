import { memo, useCallback, useEffect, useState } from 'react'
import { FolderOpen, ChevronDown, Server, Bot, Clock, AlertCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project } from '@/types/project'

/**
 * Format relative time from a date (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '从未访问'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return `${diffYears} 年前`
  if (diffMonths > 0) return `${diffMonths} 个月前`
  if (diffDays > 0) return `${diffDays} 天前`
  if (diffHours > 0) return `${diffHours} 小时前`
  if (diffMinutes > 0) return `${diffMinutes} 分钟前`
  return '刚刚'
}

interface ProjectItemProps {
  project: Project
  isSelected: boolean
  onSelect: () => void
}

const ProjectItem = memo(function ProjectItem({
  project,
  isSelected,
  onSelect,
}: ProjectItemProps) {
  const isMissing = project.status === 'missing'

  return (
    <CommandItem
      value={project.name}
      onSelect={onSelect}
      className={`flex flex-col items-start gap-1 py-3 ${isMissing ? 'opacity-60' : ''}`}
      data-testid={`project-item-${project.id}`}
    >
      <div className="flex w-full items-center gap-2">
        <FolderOpen className="h-4 w-4 shrink-0" />
        <span className="font-medium">{project.name}</span>
        {isSelected && (
          <Badge variant="secondary" className="ml-auto text-xs">
            当前
          </Badge>
        )}
        {isMissing && (
          <AlertCircle className="ml-auto h-4 w-4 text-destructive" />
        )}
      </div>

      <div className="flex w-full items-center gap-3 pl-6 text-xs text-muted-foreground">
        {/* MCP Count */}
        <span className="flex items-center gap-1">
          <Server className="h-3 w-3" />
          {project.mcpCount ?? 0} MCP
        </span>

        {/* Agent Count */}
        <span className="flex items-center gap-1">
          <Bot className="h-3 w-3" />
          {project.agentCount ?? 0} Agent
        </span>

        {/* Last Accessed */}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(project.lastAccessed)}
        </span>
      </div>

      {/* Project Path - truncated */}
      <div className="w-full pl-6 text-xs text-muted-foreground truncate">
        {project.path}
      </div>
    </CommandItem>
  )
})

export interface ProjectSelectorProps {
  onProjectSelect?: (project: Project) => void
  className?: string
}

export const ProjectSelector = memo(function ProjectSelector({
  onProjectSelect,
  className,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false)

  // Use selectors for fine-grained subscriptions
  const projects = useProjectsStore((state) => state.projects)
  const activeProject = useProjectsStore((state) => state.activeProject)
  const isLoadingProjects = useProjectsStore((state) => state.isLoadingProjects)
  const setActiveProject = useProjectsStore((state) => state.setActiveProject)
  const updateProjectLastAccessed = useProjectsStore(
    (state) => state.updateProjectLastAccessed
  )
  const loadProjects = useProjectsStore((state) => state.loadProjects)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleSelectProject = useCallback(
    (project: Project) => {
      setActiveProject(project)
      updateProjectLastAccessed(project.id)
      setOpen(false)
      onProjectSelect?.(project)
    },
    [setActiveProject, updateProjectLastAccessed, onProjectSelect]
  )

  // Button display text
  const buttonText = isLoadingProjects
    ? '加载中...'
    : activeProject?.name || '选择项目'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`justify-between min-w-[200px] ${className || ''}`}
        >
          <span className="flex items-center gap-2 truncate">
            <FolderOpen className="h-4 w-4 shrink-0" />
            {buttonText}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索项目..." />
          <CommandList role="listbox">
            <CommandEmpty>未发现项目</CommandEmpty>
            <CommandGroup heading="项目">
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isSelected={activeProject?.id === project.id}
                  onSelect={() => handleSelectProject(project)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
