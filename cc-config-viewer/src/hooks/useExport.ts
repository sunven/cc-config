import { useState } from 'react'
import { exportConfiguration } from '../lib/exportService'
import type { ExportFormat, ExportOptions, ExportResult } from '../types/export'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'

interface UseExportReturn {
  isExporting: boolean
  exportResult: ExportResult | null
  error: string | null
  exportToClipboard: (source: 'project' | 'comparison', data: any, options: ExportOptions) => Promise<void>
  exportToFile: (source: 'project' | 'comparison', data: any, options: ExportOptions) => Promise<void>
  reset: () => void
}

/**
 * useExport Hook
 * Manages export state and operations
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportToClipboard = async (
    source: 'project' | 'comparison',
    data: DiscoveredProject | { leftProject: DiscoveredProject; rightProject: DiscoveredProject; diffResults: DiffResult[] },
    options: ExportOptions
  ) => {
    setIsExporting(true)
    setError(null)

    try {
      const result = await exportConfiguration(source, data as any, options)

      if (result.success && result.content) {
        await navigator.clipboard.writeText(result.content)
        setExportResult(result)
      } else {
        setError(result.error?.message || 'Export failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToFile = async (
    source: 'project' | 'comparison',
    data: DiscoveredProject | { leftProject: DiscoveredProject; rightProject: DiscoveredProject; diffResults: DiffResult[] },
    options: ExportOptions
  ) => {
    setIsExporting(true)
    setError(null)

    try {
      const result = await exportConfiguration(source, data as any, options)

      if (result.success && result.content) {
        // TODO: Implement file download using Tauri API
        setExportResult(result)
      } else {
        setError(result.error?.message || 'Export failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const reset = () => {
    setIsExporting(false)
    setExportResult(null)
    setError(null)
  }

  return {
    isExporting,
    exportResult,
    error,
    exportToClipboard,
    exportToFile,
    reset,
  }
}
