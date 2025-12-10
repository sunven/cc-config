import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import type { ExportPreview as ExportPreviewType, ExportOptions } from '../types/export'
import { Eye, EyeOff, FileText } from 'lucide-react'

interface ExportPreviewProps {
  preview: ExportPreviewType
  options: ExportOptions
}

/**
 * ExportPreview Component
 * Shows a preview of the export content before downloading
 */
export function ExportPreview({ preview, options }: ExportPreviewProps) {
  const [showFullPreview, setShowFullPreview] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getPreviewContent = () => {
    if (showFullPreview) {
      return preview.content
    }

    // Show only first 500 characters for preview
    if (preview.content.length > 500) {
      return preview.content.substring(0, 500) + '\n\n... (预览已截断)'
    }

    return preview.content
  }

  const getLanguageClass = () => {
    switch (preview.format) {
      case 'json':
        return 'language-json'
      case 'markdown':
        return 'language-markdown'
      case 'csv':
        return 'language-csv'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{preview.recordCount}</div>
              <p className="text-xs text-muted-foreground">记录数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatFileSize(preview.estimatedSize)}</div>
              <p className="text-xs text-muted-foreground">预计大小</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                {preview.format.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">格式</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              内容预览
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullPreview(!showFullPreview)}
            >
              {showFullPreview ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  收起
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  显示全部
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded border">
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
              <code className={getLanguageClass()}>
                {getPreviewContent()}
              </code>
            </pre>
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-2">
            {showFullPreview
              ? `显示全部 ${preview.content.length} 字符`
              : `显示前 500 字符，共 ${preview.content.length} 字符`}
          </p>
        </CardContent>
      </Card>

      {/* Filter Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">导出过滤器</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {options.includeMetadata && (
              <Badge variant="outline">元数据</Badge>
            )}
            {options.includeInherited && (
              <Badge variant="outline">继承配置</Badge>
            )}
            {options.includeMCP && (
              <Badge variant="outline">MCP服务器</Badge>
            )}
            {options.includeAgents && (
              <Badge variant="outline">子代理</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
