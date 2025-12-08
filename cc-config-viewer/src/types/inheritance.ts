/**
 * Types for Inheritance Path Visualization (Story 3.3)
 */

import type { ConfigEntry, ConfigSource } from './config'

// Path visualization entry
export interface PathVisualizationEntry {
  configKey: string
  userValue: any
  projectValue: any
  currentValue: any
  path: Array<{
    level: 'user' | 'project'
    value: any
    source: ConfigSource
  }>
  classification: 'inherited' | 'overridden' | 'project-specific'
  sourceType: ConfigSource['type']
}

// Tooltip data for displaying inheritance path details
export interface TooltipData {
  configKey: string
  path: PathVisualizationEntry['path']
  currentValue: any
  classification: PathVisualizationEntry['classification']
  filePath?: string
  lineNumber?: number
}

// Tree node for inheritance tree view
export interface TreeNode {
  key: string
  label: string
  value: any
  sourceType: ConfigSource['type']
  children: TreeNode[]
  expanded: boolean
  hasInheritance: boolean
  inheritedFrom?: string
}

// Props for InheritancePathVisualizer
export interface InheritancePathVisualizerProps {
  configs: ConfigEntry[]
  className?: string
  onHighlight?: (configKey: string | null) => void
}

// Props for InheritanceTooltip
export interface InheritanceTooltipProps {
  data: TooltipData
  visible: boolean
  position: { x: number; y: number }
  onClose: () => void
}

// Props for InheritanceTreeView
export interface InheritanceTreeViewProps {
  configs: ConfigEntry[]
  className?: string
  onNodeClick?: (nodeKey: string) => void
  initialExpandedKeys?: string[]
}

// Props for PathHighlighter
export interface PathHighlighterProps {
  configKey: string | null
  configs: ConfigEntry[]
  className?: string
}

// Highlight style configuration
export interface HighlightStyle {
  color: string
  intensity: 'low' | 'medium' | 'high'
  animation: boolean
}

// Inheritance path direction types
export type PathDirection = 'user-to-project' | 'project-to-user' | 'bidirectional'