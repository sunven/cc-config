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
      // Config loading is handled by configStore.updateConfigs()
      // which is triggered when scope changes via useUiStore
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
