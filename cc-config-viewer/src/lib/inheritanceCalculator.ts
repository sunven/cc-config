import type { ConfigEntry, InheritanceChain } from '../types'
// weakref types are global, imported via typescript's DOM library or weakref.d.ts
import equal from 'fast-deep-equal'

// Memoization cache for inheritance chain calculations with WeakRef
interface CacheEntry {
  hash: string
  result: WeakRef<InheritanceChain>
  timestamp: number
}

const CACHE_MAX_SIZE = 10
const CACHE_TTL_MS = 60000 // 1 minute

// WeakRef-based cache with automatic cleanup
const inheritanceChainCache: CacheEntry[] = []
const weakRefRegistry = new FinalizationRegistry<string>((hash) => {
  // Clean up cache entry when object is garbage collected
  const index = inheritanceChainCache.findIndex(e => e.hash === hash)
  if (index !== -1) {
    inheritanceChainCache.splice(index, 1)
    console.debug('[InheritanceCache] Auto-cleaned entry for hash:', hash)
  }
})

function generateCacheHash(entries: ConfigEntry[]): string {
  return entries.map(e => `${e.key}:${JSON.stringify(e.value)}`).join('|')
}

function cleanExpiredCache(): void {
  const now = Date.now()
  for (let i = inheritanceChainCache.length - 1; i >= 0; i--) {
    if (now - inheritanceChainCache[i].timestamp > CACHE_TTL_MS) {
      inheritanceChainCache.splice(i, 1)
    }
  }
}

function getCachedResult(hash: string): InheritanceChain | null {
  const entry = inheritanceChainCache.find(e => e.hash === hash)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    // Dereference WeakRef to get the actual object
    const result = entry.result.deref()
    if (result) {
      return result
    } else {
      // Object was garbage collected, remove the entry
      const index = inheritanceChainCache.indexOf(entry)
      if (index !== -1) {
        inheritanceChainCache.splice(index, 1)
      }
    }
  }
  return null
}

function setCachedResult(hash: string, result: InheritanceChain): void {
  cleanExpiredCache()
  if (inheritanceChainCache.length >= CACHE_MAX_SIZE) {
    inheritanceChainCache.shift() // Remove oldest entry
  }

  // Wrap result in WeakRef
  const weakResult: WeakRef<InheritanceChain> = new WeakRef(result)
  inheritanceChainCache.push({ hash, result: weakResult, timestamp: Date.now() })

  // Register for auto-cleanup when object is GC'd
  weakRefRegistry.register(result, hash)
}

/**
 * Get resolved config value from inheritance chain
 */
export function getConfigValue(key: string, chain: InheritanceChain): any {
  return chain.resolved[key]
}

/**
 * Get config source type from inheritance chain
 */
export function getConfigSource(key: string, chain: InheritanceChain): string | undefined {
  const entry = chain.entries.find((e) => e.key === key)
  return entry?.source.type
}

interface ConfigItem {
  key: string
  value: any
}

interface InheritanceResult {
  inherited: (ConfigItem & { originalValue?: any })[]
  overridden: (ConfigItem & { originalValue: any })[]
  projectSpecific: ConfigItem[]
}

/**
 * Calculate inheritance between user and project configurations
 * O(n) algorithm using Map for efficient lookups
 */
export function calculateInheritance(
  userConfigs: ConfigItem[],
  projectConfigs: ConfigItem[]
): InheritanceResult {
  const userMap = new Map(userConfigs.map(c => [c.key, c]))

  const result: InheritanceResult = {
    inherited: [],
    overridden: [],
    projectSpecific: []
  }

  for (const projectConfig of projectConfigs) {
    const userConfig = userMap.get(projectConfig.key)
    if (!userConfig) {
      result.projectSpecific.push(projectConfig)
    } else if (!equal(userConfig.value, projectConfig.value)) {
      result.overridden.push({
        ...projectConfig,
        originalValue: userConfig.value
      })
    } else {
      result.inherited.push(userConfig)
    }
    userMap.delete(projectConfig.key)
  }

  result.inherited = result.inherited.concat(Array.from(userMap.values()))
  return result
}

/**
 * Calculate inheritance chain from config entries with memoization
 * Caches results based on entry content hash for performance
 */
export function calculateInheritanceChain(entries: ConfigEntry[]): InheritanceChain {
  const hash = generateCacheHash(entries)
  const cached = getCachedResult(hash)
  if (cached) {
    return cached
  }

  const resolved: Record<string, any> = {}
  for (const entry of entries) {
    resolved[entry.key] = entry.value
  }

  const result: InheritanceChain = {
    entries,
    resolved
  }

  setCachedResult(hash, result)
  return result
}

/**
 * Clear the inheritance chain cache (for testing or memory management)
 */
export function clearInheritanceCache(): void {
  inheritanceChainCache.length = 0
}
