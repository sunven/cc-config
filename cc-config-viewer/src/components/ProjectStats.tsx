import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Folder, FileText, Users, Activity } from 'lucide-react'
import type { DiscoveredProject } from '../types/project'

interface ProjectStatsProps {
  projects: DiscoveredProject[]
}

/**
 * ProjectStats Component
 * Displays statistics about discovered projects
 */
export function ProjectStats({ projects }: ProjectStatsProps) {
  // Calculate statistics
  const totalProjects = projects.length
  const projectsWithConfig = projects.filter((p) => p.configFileCount > 0).length
  const projectsWithAgents = projects.filter((p) => p.subAgents && p.subAgents.length > 0).length
  const projectsWithMcpServers = projects.filter((p) => p.mcpServers && p.mcpServers.length > 0).length

  const totalConfigFiles = projects.reduce((sum, p) => sum + p.configFileCount, 0)
  const totalMcpServers = projects.reduce((sum, p) => {
    if (!p.mcpServers) return sum
    return sum + p.mcpServers.reduce((serverSum, serverStr) => {
      const match = serverStr.match(/(\d+)/)
      return serverSum + (match ? parseInt(match[1], 10) : 0)
    }, 0)
  }, 0)

  const stats = [
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: Folder,
      color: 'text-blue-600'
    },
    {
      label: 'With Config',
      value: projectsWithConfig,
      icon: FileText,
      color: 'text-green-600'
    },
    {
      label: 'With Agents',
      value: projectsWithAgents,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: 'Active Servers',
      value: totalMcpServers,
      icon: Activity,
      color: 'text-orange-600'
    }
  ]

  if (totalProjects === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No projects to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.label === 'Total Projects' && projectsWithConfig > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {projectsWithConfig} with configuration files
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Additional Summary Card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {totalConfigFiles} total config files
            </Badge>
            {projectsWithConfig > 0 && (
              <Badge variant="outline">
                {Math.round((projectsWithConfig / totalProjects) * 100)}% have configuration
              </Badge>
            )}
            {projectsWithAgents > 0 && (
              <Badge variant="outline">
                {Math.round((projectsWithAgents / totalProjects) * 100)}% have agents
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
