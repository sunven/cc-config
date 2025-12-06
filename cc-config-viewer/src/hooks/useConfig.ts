import { useEffect, useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { calculateInheritanceChain } from '../lib/inheritanceCalculator'
import type { InheritanceChain } from '../types'

export function useConfig() {
  const { configs, scope, setScope, updateConfig, clearConfigs } = useConfigStore()
  const [inheritanceChain, setInheritanceChain] = useState<InheritanceChain | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const entries = Object.values(configs)
    if (entries.length > 0) {
      const chain = calculateInheritanceChain(entries)
      setInheritanceChain(chain)
    }
  }, [configs])

  async function loadConfig(scope: 'user' | 'project' | 'local') {
    setLoading(true)
    setError(null)
    try {
      setScope(scope)
      // TODO: Implement config loading
      // This will be implemented in Story 1.7
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  return {
    configs,
    scope,
    inheritanceChain,
    loading,
    error,
    setScope,
    updateConfig,
    clearConfigs,
    loadConfig,
  }
}
