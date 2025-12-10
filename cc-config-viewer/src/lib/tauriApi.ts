import { invoke } from '@tauri-apps/api/core'
import type { AppError } from '../types'
import type { DiffResult } from '../types/comparison'
import type { ProjectHealth, HealthMetrics } from '../types/health'

// Rust AppError is serialized as { Filesystem: "msg" } | { Permission: "msg" } | { Parse: "msg" }
interface RustAppError {
  Filesystem?: string
  Permission?: string
  Parse?: string
  Network?: string
}

function convertRustError(error: unknown): AppError {
  const rustError = error as RustAppError

  if (rustError.Permission) {
    return {
      type: 'permission',
      message: `Permission denied: ${rustError.Permission}`,
      details: error,
    }
  } else if (rustError.Filesystem) {
    return {
      type: 'filesystem',
      message: `File system error: ${rustError.Filesystem}`,
      details: error,
    }
  } else if (rustError.Parse) {
    return {
      type: 'parse',
      message: `Parse error: ${rustError.Parse}`,
      details: error,
    }
  } else if (rustError.Network) {
    return {
      type: 'network',
      message: `Network error: ${rustError.Network}`,
      details: error,
    }
  } else {
    return {
      type: 'filesystem',
      message: `Unknown error: ${error}`,
      details: error,
    }
  }
}

export async function readConfigFile(path: string): Promise<string> {
  try {
    return await invoke<string>('read_config', { path })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function parseConfigData(content: string): Promise<Record<string, any>> {
  try {
    return await invoke<Record<string, any>>('parse_config', { content })
  } catch (error) {
    throw convertRustError(error)
  }
}

// Keep backwards compatibility with old function names
export async function readConfig(path: string): Promise<string> {
  return readConfigFile(path)
}

export async function parseConfig(content: string): Promise<any> {
  return parseConfigData(content)
}

export async function watchConfig(path: string, callback: (path: string) => void): Promise<void> {
  try {
    await invoke('watch_config', { path, callback })
  } catch (error) {
    throw convertRustError(error)
  }
}

// Project discovery commands
export interface DiscoveredProject {
  id: string
  name: string
  path: string
  config_file_count: number
  last_modified: number
  config_sources: {
    user: boolean
    project: boolean
    local: boolean
  }
  mcp_servers?: string[]
  sub_agents?: string[]
}

export async function listProjects(): Promise<DiscoveredProject[]> {
  try {
    return await invoke<DiscoveredProject[]>('list_projects')
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function scanProjects(depth: number = 3): Promise<DiscoveredProject[]> {
  try {
    return await invoke<DiscoveredProject[]>('scan_projects', { depth })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function watchProjects(): Promise<void> {
  try {
    await invoke('watch_projects')
  } catch (error) {
    throw convertRustError(error)
  }
}

// Project comparison commands (Story 5.2)
export async function compareProjects(leftPath: string, rightPath: string): Promise<DiffResult[]> {
  try {
    return await invoke<DiffResult[]>('compare_projects', { leftPath, rightPath })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function calculateDiff(
  leftCapabilities: any[],
  rightCapabilities: any[]
): Promise<DiffResult[]> {
  try {
    return await invoke<DiffResult[]>('calculate_diff', { leftCapabilities, rightCapabilities })
  } catch (error) {
    throw convertRustError(error)
  }
}

// Health check commands (Story 5.4)
export async function healthCheckProject(projectPath: string): Promise<ProjectHealth> {
  try {
    return await invoke<ProjectHealth>('health_check_project', { projectPath })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function calculateHealthMetrics(
  projects: DiscoveredProject[]
): Promise<ProjectHealth[]> {
  try {
    return await invoke<ProjectHealth[]>('calculate_health_metrics', { projects })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function refreshAllProjectHealth(
  projects: DiscoveredProject[]
): Promise<ProjectHealth[]> {
  try {
    return await invoke<ProjectHealth[]>('refresh_all_project_health', { projects })
  } catch (error) {
    throw convertRustError(error)
  }
}

// Export commands (Story 5.5)
export interface ExportResult {
  success: boolean
  file_path?: string
  content?: string
  format: string
  error?: {
    type: string
    message: string
    details?: any
  }
  stats?: {
    recordCount: number
    fileSize: number
    duration: number
  }
}

export async function saveExportFile(
  content: string,
  filename: string,
  format: string
): Promise<ExportResult> {
  try {
    return await invoke<ExportResult>('save_export_file', { content, filename, format })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function getDownloadsPath(): Promise<string> {
  try {
    return await invoke<string>('get_downloads_path')
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function validateExportData(data: any): Promise<{ isValid: boolean; errors?: string[] }> {
  try {
    return await invoke<{ isValid: boolean; errors?: string[] }>('validate_export_data', { data })
  } catch (error) {
    throw convertRustError(error)
  }
}
