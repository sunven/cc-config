import type { ConfigEntry } from '../types'

export function trackConfigSource(
  entries: ConfigEntry[],
  key: string
): ConfigEntry | undefined {
  return entries.find((entry) => entry.key === key)
}

export function getSourceHierarchy(entries: ConfigEntry[]): Record<string, string[]> {
  const hierarchy: Record<string, string[]> = {}

  entries.forEach((entry) => {
    if (!hierarchy[entry.source.type]) {
      hierarchy[entry.source.type] = []
    }
    hierarchy[entry.source.type].push(entry.key)
  })

  return hierarchy
}

export function findConflictingKeys(entries: ConfigEntry[]): string[] {
  const keyCounts: Record<string, number> = {}
  const conflicts: Set<string> = new Set()

  entries.forEach((entry) => {
    keyCounts[entry.key] = (keyCounts[entry.key] || 0) + 1
  })

  Object.entries(keyCounts).forEach(([key, count]) => {
    if (count > 1) {
      conflicts.add(key)
    }
  })

  return Array.from(conflicts)
}
