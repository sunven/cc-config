import type { ConfigEntry, InheritanceChain } from '../types'
import equal from 'fast-deep-equal'

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
