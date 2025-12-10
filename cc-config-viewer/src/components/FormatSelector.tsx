import React from 'react'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Card, CardContent } from './ui/card'
import type { ExportFormat } from '../types/export'
import { FileText, File, Table } from 'lucide-react'

interface FormatSelectorProps {
  value: ExportFormat
  onChange: (format: ExportFormat) => void
}

/**
 * FormatSelector Component
 * Radio group for selecting export format (JSON/Markdown/CSV)
 */
export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const formats = [
    {
      value: 'json' as ExportFormat,
      label: 'JSON',
      description: '机器可读格式，适合程序处理',
      icon: FileText,
      recommended: true,
    },
    {
      value: 'markdown' as ExportFormat,
      label: 'Markdown',
      description: '人类可读格式，适合文档',
      icon: File,
      recommended: false,
    },
    {
      value: 'csv' as ExportFormat,
      label: 'CSV',
      description: '表格格式，适合电子表格',
      icon: Table,
      recommended: false,
    },
  ]

  return (
    <RadioGroup value={value} onValueChange={(val) => onChange(val as ExportFormat)}>
      <div className="grid gap-3">
        {formats.map((format) => {
          const Icon = format.icon
          return (
            <div
              key={format.value}
              className="cursor-pointer"
              onClick={() => onChange(format.value)}
            >
              <Card
                className={`transition-all hover:shadow-md ${
                  value === format.value
                    ? 'ring-2 ring-primary border-primary'
                    : 'border-border'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <RadioGroupItem value={format.value} id={format.value} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{format.label}</span>
                        {format.recommended && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            推荐
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </RadioGroup>
  )
}
