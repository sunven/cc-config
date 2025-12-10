import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { FormatSelector } from './FormatSelector'
import { ExportOptions } from './ExportOptions'
import { ExportPreview } from './ExportPreview'
import { exportConfiguration, createExportPreview } from '../lib/exportService'
import { getDefaultExportOptions } from '../lib/exportService'
import type { ExportFormat, ExportOptions as ExportOptionsType, ExportResult, ExportPreview as ExportPreviewType } from '../types/export'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'
import { Download, Copy, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type ExportData = DiscoveredProject | {
  leftProject: DiscoveredProject
  rightProject: DiscoveredProject
  diffResults: DiffResult[]
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: 'project' | 'comparison'
  data: ExportData | null
  onExportComplete?: (result: ExportResult) => void
}

interface ExportState {
  isExporting: boolean
  exportResult: ExportResult | null
  error: string | null
  preview: ExportPreviewType | null
}

/**
 * ExportDialog Component
 * Main modal for configuring and executing configuration exports
 */
export function ExportDialog({
  open,
  onOpenChange,
  source,
  data,
  onExportComplete,
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptionsType>(getDefaultExportOptions())
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    exportResult: null,
    error: null,
    preview: null,
  })

  // Reset state when dialog opens
  useEffect(() => {
    if (open && data) {
      setState({
        isExporting: false,
        exportResult: null,
        error: null,
        preview: null,
      })
      setOptions(getDefaultExportOptions())
    }
  }, [open, data])

  // Create preview when options change
  useEffect(() => {
    if (data && open) {
      try {
        const preview = createExportPreview(source, data as ExportData, options)
        setState((prev) => ({ ...prev, preview, error: null }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create preview',
          preview: null,
        }))
      }
    }
  }, [options, data, source, open])

  const handleFormatChange = (format: ExportFormat) => {
    setOptions((prev) => ({ ...prev, format }))
  }

  const handleOptionsChange = (newOptions: Partial<ExportOptionsType>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }))
  }

  const handleExport = async (method: 'download' | 'clipboard') => {
    if (!data) return

    setState((prev) => ({ ...prev, isExporting: true, error: null }))

    try {
      const result = await exportConfiguration(source, data as ExportData, options)

      if (result.success && result.content) {
        if (method === 'clipboard') {
          await navigator.clipboard.writeText(result.content)
        } else if (method === 'download') {
          // Generate filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const sourceLabel = getSourceLabel().replace(/[^a-z0-9]/gi, '-').toLowerCase()
          const filename = `${sourceLabel}-config-${timestamp}.${options.format}`

          // Create blob and trigger download
          const blob = new Blob([result.content], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }

        setState((prev) => ({
          ...prev,
          isExporting: false,
          exportResult: result,
          error: null,
        }))

        onExportComplete?.(result)
      } else {
        setState((prev) => ({
          ...prev,
          isExporting: false,
          error: result.error?.message || 'Export failed',
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed',
      }))
    }
  }

  const getSourceLabel = () => {
    if (!data) return ''
    if (source === 'project') {
      return data.name
    } else {
      const comparison = data as {
        leftProject: DiscoveredProject
        rightProject: DiscoveredProject
      }
      return `${comparison.leftProject.name} vs ${comparison.rightProject.name}`
    }
  }

  const getRecordCount = () => {
    return state.preview?.recordCount || 0
  }

  const getEstimatedSize = () => {
    const size = state.preview?.estimatedSize || 0
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            导出配置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">导出源</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{getSourceLabel()}</p>
                  <p className="text-sm text-muted-foreground">
                    {source === 'project' ? '项目配置' : '比较结果'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    {getRecordCount()} 条记录
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    预计大小: {getEstimatedSize()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">导出格式</CardTitle>
            </CardHeader>
            <CardContent>
              <FormatSelector
                value={options.format}
                onChange={handleFormatChange}
              />
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">导出选项</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportOptions
                value={options}
                onChange={handleOptionsChange}
              />
            </CardContent>
          </Card>

          {/* Preview */}
          {state.preview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">预览</CardTitle>
              </CardHeader>
              <CardContent>
                <ExportPreview
                  preview={state.preview}
                  options={options}
                />
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {state.error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{state.error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Display */}
          {state.exportResult && state.exportResult.success && (
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">
                    导出成功！
                    {state.exportResult.stats && (
                      <span className="ml-2">
                        {state.exportResult.stats.recordCount} 条记录，
                        {getEstimatedSize()}，
                        {state.exportResult.stats.duration}ms
                      </span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={state.isExporting}
          >
            取消
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('clipboard')}
            disabled={state.isExporting || !state.preview}
          >
            {state.isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            复制到剪贴板
          </Button>
          <Button
            onClick={() => handleExport('download')}
            disabled={state.isExporting || !state.preview}
          >
            {state.isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            下载文件
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
