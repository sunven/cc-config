/**
 * pathHighlighter utility
 *
 * Provides utilities for highlighting inheritance paths.
 *
 * Implements:
 * - Subtask 3.1: Add visual emphasis for inheritance paths
 * - Subtask 3.2: Highlight source values and their propagation
 * - Subtask 3.3: Support highlighting multiple paths simultaneously
 */

import type { ConfigEntry } from '../types/config'
import type { HighlightStyle } from '../types/inheritance'

/**
 * Get appropriate highlight style for a configuration source type
 */
export function getHighlightStyle(
  sourceType: 'user' | 'project' | 'inherited',
  intensity: 'low' | 'medium' | 'high' = 'medium',
  animation: boolean = true
): HighlightStyle {
  const colorMap = {
    user: '#3B82F6',    // Blue
    project: '#10B981',  // Green
    inherited: '#6B7280'  // Gray
  }

  return {
    color: colorMap[sourceType],
    intensity,
    animation
  }
}

/**
 * Highlight a specific path for a config key
 */
export function highlightPath(configs: ConfigEntry[], configKey: string | null) {
  return configs.map(config => ({
    ...config,
    highlighted: configKey !== null && config.key === configKey
  }))
}

/**
 * Clear all highlights from configs
 */
export function clearHighlight(configs: Array<ConfigEntry & { highlighted?: boolean }>) {
  return configs.map(config => ({
    ...config,
    highlighted: false
  }))
}