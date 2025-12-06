import type { ConfigEntry, InheritanceChain } from '../types'

export function calculateInheritanceChain(entries: ConfigEntry[]): InheritanceChain {
  // Sort by priority (lower number = higher priority)
  const sortedEntries = [...entries].sort((a, b) => a.source.priority - b.source.priority)

  const resolved: Record<string, any> = {}
  const resolvedEntries: ConfigEntry[] = []

  // Process from lowest to highest priority
  for (const entry of sortedEntries) {
    if (entry.key in resolved) {
      // This key is overridden
      resolvedEntries.push({ ...entry, overridden: true })
    } else {
      // This key is inherited
      resolvedEntries.push({ ...entry, inherited: true })
      resolved[entry.key] = entry.value
    }
  }

  return {
    entries: resolvedEntries,
    resolved,
  }
}

export function getConfigValue(key: string, chain: InheritanceChain): any {
  return chain.resolved[key]
}

export function getConfigSource(key: string, chain: InheritanceChain): string | undefined {
  const entry = chain.entries.find((e) => e.key === key)
  return entry?.source.type
}
