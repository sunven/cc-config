import { invoke } from '@tauri-apps/api/core'
import { readConfig, listProjects, scanProjects, type DiscoveredProject as RustDiscoveredProject } from './tauriApi'
import type { Project, DiscoveredProject } from '../types/project'

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
 * Convert Rust DiscoveredProject to frontend Project format
 */
function convertToProject(rustProject: RustDiscoveredProject): Project {
  // Extract server and agent counts from arrays
  const mcpCount = rustProject.mcp_servers?.reduce((count, serverStr) => {
    const match = serverStr.match(/(\d+)/)
    return count + (match ? parseInt(match[1], 10) : 0)
  }, 0) || 0

  const agentCount = rustProject.sub_agents?.reduce((count, agentStr) => {
    const match = agentStr.match(/(\d+)/)
    return count + (match ? parseInt(match[1], 10) : 0)
  }, 0) || 0

  return {
    id: rustProject.id,
    name: rustProject.name,
    path: rustProject.path,
    configPath: `${rustProject.path}/.mcp.json`,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAccessed: null,
    mcpCount,
    agentCount,
    status: rustProject.config_file_count > 0 ? 'valid' : 'missing'
  }
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
 * Discover all projects from filesystem using Tauri commands
 * This is the enhanced implementation for Story 5.1
 */
export async function discoverProjects(): Promise<Project[]> {
  try {
    // Use Tauri command to scan filesystem for projects
    const discoveredProjects = await listProjects()

    // Convert Rust projects to frontend format
    const projects = discoveredProjects.map(convertToProject)

    // Sort projects alphabetically by default
    projects.sort((a, b) => a.name.localeCompare(b.name))

    return projects
  } catch (error) {
    console.error('Failed to discover projects:', error)
    return []
  }
}

/**
 * Discover projects with custom scan depth
 */
export async function discoverProjectsWithDepth(depth: number): Promise<Project[]> {
  try {
    const discoveredProjects = await scanProjects(depth)
    const projects = discoveredProjects.map(convertToProject)

    // Sort projects alphabetically
    projects.sort((a, b) => a.name.localeCompare(b.name))

    return projects
  } catch (error) {
    console.error('Failed to discover projects:', error)
    return []
  }
}

/**
 * Get raw discovered projects (Story 5.1 format)
 */
export async function getDiscoveredProjects(): Promise<DiscoveredProject[]> {
  try {
    const discoveredProjects = await listProjects()

    // Convert to frontend format
    return discoveredProjects.map((rp) => ({
      id: rp.id,
      name: rp.name,
      path: rp.path,
      configFileCount: rp.config_file_count,
      lastModified: new Date(rp.last_modified * 1000),
      configSources: rp.config_sources,
      mcpServers: rp.mcp_servers,
      subAgents: rp.sub_agents
    }))
  } catch (error) {
    console.error('Failed to get discovered projects:', error)
    return []
  }
}

/**
 * Get current working directory using Tauri API
 * Falls back to '.' if the API is not available
 */
async function getCurrentDirectory(): Promise<string> {
  try {
    // Use Tauri command to get current directory from Rust backend
    return await invoke<string>('get_current_dir')
  } catch {
    // Fallback to relative path if Tauri command not available
    return '.'
  }
}

/**
 * Detect project from current working directory
 * Checks for .mcp.json or .claude/agents/ directory
 */
export async function detectCurrentProject(): Promise<Project | null> {
  try {
    const projectPath = await getCurrentDirectory()
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
