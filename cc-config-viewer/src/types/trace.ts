/**
 * Source tracing types for Story 3.4
 *
 * Defines types for tracing configuration items back to their source files.
 * Integrates with Story 3.3's inheritance path visualization.
 */

import type { ConfigEntry } from './config'

/// Represents the location where a configuration item was defined
export interface SourceLocation {
  file_path: string
  line_number?: number
  column_number?: number
  context?: string
}

/// Request for tracing a configuration item
export interface TraceSourceRequest {
  config_key: string
  search_paths: string[]
}

/// Source location cache entry
export interface SourceLocationCache {
  [configKey: string]: SourceLocation
}

/// Extended ConfigEntry with source location information
export interface ConfigEntryWithSource extends ConfigEntry {
  source_location?: SourceLocation
}

/// Supported external editors
export type ExternalEditor = 'vscode' | 'vim' | 'default' | 'custom'

/// Editor opening options
export interface EditorOpenOptions {
  editor?: ExternalEditor
  line_number?: number
}

/// Clipboard operation result
export interface ClipboardResult {
  success: boolean
  error?: string
}

/// Source trace state for UI
export interface SourceTraceState {
  locations: SourceLocationCache
  isLoading: boolean
  error: string | null
}

/// Source trace actions
export interface SourceTraceActions {
  traceSource: (key: string, searchPaths: string[]) => Promise<SourceLocation | null>
  openInEditor: (filePath: string, lineNumber?: number) => Promise<void>
  copyToClipboard: (text: string) => Promise<boolean>
  clearCache: () => void
  getCachedLocation: (key: string) => SourceLocation | undefined
}