import React from 'react'
import { Checkbox } from './ui/checkbox'
import { Card, CardContent } from './ui/card'
import type { ExportOptions as ExportOptionsType } from '../types/export'
import { Settings, Database, Users, Layers } from 'lucide-react'

interface ExportOptionsProps {
  value: ExportOptionsType
  onChange: (options: Partial<ExportOptionsType>) => void
}

/**
 * ExportOptions Component
 * Checkboxes for configuring export filters and options
 */
export function ExportOptions({ value, onChange }: ExportOptionsProps) {
  const handleCheckboxChange = (key: keyof ExportOptionsType, checked: boolean) => {
    onChange({ [key]: checked })
  }

  const options = [
    {
      key: 'includeMetadata' as keyof ExportOptionsType,
      label: '包含元数据',
      description: '导出版本、时间戳等信息',
      icon: Settings,
    },
    {
      key: 'includeInherited' as keyof ExportOptionsType,
      label: '包含继承配置',
      description: '包含从用户级别继承的配置',
      icon: Layers,
    },
    {
      key: 'includeMCP' as keyof ExportOptionsType,
      label: '包含MCP服务器',
      description: '导出MCP服务器配置',
      icon: Database,
    },
    {
      key: 'includeAgents' as keyof ExportOptionsType,
      label: '包含子代理',
      description: '导出子代理配置',
      icon: Users,
    },
  ]

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const Icon = option.icon
        return (
          <Card key={option.key} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={option.key}
                  checked={value[option.key] as boolean}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(option.key, checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <label
                      htmlFor={option.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
