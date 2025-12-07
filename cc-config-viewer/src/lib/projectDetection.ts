import { readConfig } from './tauriApi'
import type { Project } from '../types/project'

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
    } catch (mcpError) {
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
      } catch (agentsError) {
        // No project configuration found
        return null
      }
    }
  } catch (error) {
    console.error('Error detecting project:', error)
    return null
  }
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
 * Generate a unique ID for a project based on its path
 */
function generateProjectId(path: string): string {
  // Simple hash function for generating ID from path
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
