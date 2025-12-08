import { readConfig } from './tauriApi'
import type { Project } from '../types/project'

/**
 * Generate a unique ID for a project based on its path
 */
export function generateProjectId(path: string): string {
  // Simple hash function for generating ID from path
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Extract project name from path (handles both Unix and Windows paths)
 */
function getProjectNameFromPath(path: string): string {
  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/')
  // Get last segment
  const segments = normalizedPath.split('/').filter(Boolean)
  return segments[segments.length - 1] || 'project'
}

/**
 * Validate that a project path exists by trying to read a config file from it
 */
export async function validateProjectPath(projectPath: string): Promise<boolean> {
  try {
    // Try to read .mcp.json from the project path
    await readConfig(`${projectPath}/.mcp.json`)
    return true
  } catch {
    // If .mcp.json doesn't exist, try .claude directory
    try {
      await readConfig(`${projectPath}/.claude/settings.json`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Count MCP servers in a project's .mcp.json file
 */
export async function countMcpServers(projectPath: string): Promise<number> {
  try {
    const configContent = await readConfig(`${projectPath}/.mcp.json`)
    const config = JSON.parse(configContent)
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      return Object.keys(config.mcpServers).length
    }
    return 0
  } catch {
    return 0
  }
}

/**
 * Count agents in a project's .claude/agents directory
 * Note: This is a simplified implementation - in production we'd need directory listing
 */
export async function countAgents(projectPath: string): Promise<number> {
  try {
    // Try to read the agents directory by checking for common agent file
    await readConfig(`${projectPath}/.claude/agents/agent.md`)
    // If we can read at least one agent file, return 1
    // In a full implementation, we'd list the directory and count .md files
    return 1
  } catch {
    return 0
  }
}

/**
 * Discover all projects from user's Claude configuration
 * Parses ~/.claude.json and validates each project path
 */
export async function discoverProjects(): Promise<Project[]> {
  const projects: Project[] = []

  try {
    // 1. Parse ~/.claude.json for registered projects
    const userConfigContent = await readConfig('~/.claude.json')
    const userConfig = JSON.parse(userConfigContent)

    if (userConfig.projects && typeof userConfig.projects === 'object') {
      // Process each project in parallel for better performance
      const projectEntries = Object.entries(userConfig.projects) as [
        string,
        { path: string; lastOpened?: string }
      ][]

      const projectPromises = projectEntries.map(async ([name, projectData]) => {
        const exists = await validateProjectPath(projectData.path)
        const mcpCount = await countMcpServers(projectData.path)
        const agentCount = await countAgents(projectData.path)

        const project: Project = {
          id: generateProjectId(projectData.path),
          name,
          path: projectData.path,
          configPath: `${projectData.path}/.mcp.json`,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessed: projectData.lastOpened ? new Date(projectData.lastOpened) : null,
          mcpCount,
          agentCount,
          status: exists ? 'valid' : 'missing',
        }

        return project
      })

      const discoveredProjects = await Promise.all(projectPromises)
      projects.push(...discoveredProjects)
    }

    // 2. Add current project if not already in the list
    const currentProject = await detectCurrentProject()
    if (currentProject && !projects.find((p) => p.path === currentProject.path)) {
      projects.unshift(currentProject)
    }

    // 3. Sort projects by lastAccessed timestamp (most recent first)
    projects.sort((a, b) => {
      const aTime = a.lastAccessed?.getTime() ?? 0
      const bTime = b.lastAccessed?.getTime() ?? 0
      return bTime - aTime
    })
  } catch (error) {
    console.warn('Failed to discover projects:', error)
  }

  return projects
}

/**
 * Detect project from current working directory
 * Checks for .mcp.json or .claude/agents/ directory
 */
export async function detectCurrentProject(): Promise<Project | null> {
  try {
    const projectPath = process.cwd?.() || '.'
    const projectName = getProjectNameFromPath(projectPath)

    // Try to read .mcp.json from current directory
    const mcpJsonPath = './.mcp.json'
    try {
      await readConfig(mcpJsonPath)

      // If read succeeds, we have a project
      return {
        id: generateProjectId(projectPath),
        name: projectName,
        path: projectPath,
        configPath: mcpJsonPath,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch {
      // .mcp.json doesn't exist, try .claude/agents/
      const agentsPath = './.claude/agents'
      try {
        // Try to read any file in the agents directory
        // This is a simple check - in production you'd want to list directory
        await readConfig(`${agentsPath}/agent.md`)

        return {
          id: generateProjectId(projectPath),
          name: projectName,
          path: projectPath,
          configPath: agentsPath,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } catch {
        // No project configuration found
        return null
      }
    }
  } catch (error) {
    console.error('Error detecting project:', error)
    return null
  }
}
