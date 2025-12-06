import type { ConfigEntry } from '../types'

export function parseConfigFile(content: string): Record<string, any> {
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error}`)
  }
}

export function stringifyConfig(config: Record<string, any>): string {
  return JSON.stringify(config, null, 2)
}

export function extractConfigEntries(
  config: Record<string, any>,
  source: 'user' | 'project' | 'local'
): ConfigEntry[] {
  return Object.entries(config).map(([key, value]) => ({
    key,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}
