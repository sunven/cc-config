import { useEffect, useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { useUiStore } from '../stores/uiStore'
import { calculateInheritanceChain } from '../lib/inheritanceCalculator'
import type { InheritanceChain } from '../types'

export function useConfig() {
  const { configs, updateConfig, clearConfigs } = useConfigStore()
  const { currentScope, setCurrentScope } = useUiStore()
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

  async function loadConfig(scope: 'user' | 'project') {
    setLoading(true)
    setError(null)
    try {
      setCurrentScope(scope)
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
    scope: currentScope,
    inheritanceChain,
    loading,
    error,
    setScope: setCurrentScope,
    updateConfig,
    clearConfigs,
    loadConfig,
  }
}
