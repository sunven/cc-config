/**
 * External Editor Launcher Utility
 *
 * Handles opening files in external editors with line number support.
 * Part of Story 3.4 - Source Trace Functionality.
 */

import type { ExternalEditor, EditorOpenOptions } from '../types/trace'

/// Detects the system's default editor
/// Note: In Tauri, the platform detection is handled in the Rust backend
/// This function provides a fallback for development/testing environments
export function detectSystemEditor(): ExternalEditor {
  // In Tauri context, we can't use process.platform or child_process
  // The backend will handle platform-specific logic
  // This returns a default that can be overridden in the backend
  return 'default'
}

/// Opens a file in the specified or default editor
export async function openFileInEditor(
  filePath: string,
  options: EditorOpenOptions = {}
): Promise<void> {
  const editor = options.editor || detectSystemEditor()
  const lineNumber = options.line_number

  try {
    // Use invoke from Tauri to call the Rust command
    const { invoke } = await import('@tauri-apps/api/core')

    await invoke('open_in_editor', {
      filePath,
      lineNumber,
    })

    console.log(`Opened ${filePath} in ${editor}${lineNumber ? ` at line ${lineNumber}` : ''}`)
  } catch (error) {
    console.error('Failed to open editor:', error)
    throw new Error(`Failed to open file in editor: ${error}`)
  }
}

/// Opens a file in VS Code specifically
export async function openInVSCode(
  filePath: string,
  lineNumber?: number
): Promise<void> {
  await openFileInEditor(filePath, { editor: 'vscode', line_number: lineNumber })
}

/// Opens a file in the system default editor
export async function openInDefaultEditor(filePath: string): Promise<void> {
  await openFileInEditor(filePath, { editor: 'default' })
}

/// Checks if a file path is valid
export function isValidFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false
  }

  // Check for valid characters (basic validation)
  const validPathPattern = /^[a-zA-Z0-9_\-./\\:~]+$/
  return validPathPattern.test(filePath)
}

/// Normalizes a file path for display
export function normalizeFilePath(filePath: string): string {
  // Expand home directory if present
  if (filePath.startsWith('~')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    return filePath.replace('~', homeDir)
  }

  // Convert Windows backslashes to forward slashes for consistency
  // In Tauri, we can't rely on process.platform, so we'll detect by checking the path
  if (filePath.includes('\\')) {
    return filePath.replace(/\\/g, '/')
  }

  return filePath
}

/// Gets the file name from a path
export function getFileName(filePath: string): string {
  const normalized = normalizeFilePath(filePath)
  const parts = normalized.split('/')
  return parts[parts.length - 1] || normalized
}

/// Gets the directory from a file path
export function getDirectory(filePath: string): string {
  const normalized = normalizeFilePath(filePath)
  const parts = normalized.split('/')
  return parts.slice(0, -1).join('/') || '/'
}