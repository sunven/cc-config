import React, { useState } from 'react'
import { Button } from './ui/button'
import { ExportDialog } from './ExportDialog'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  source: 'project' | 'comparison'
  data: DiscoveredProject | { leftProject: DiscoveredProject; rightProject: DiscoveredProject; diffResults: DiffResult[] } | null
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
  onExportComplete?: (result: any) => void
}

/**
 * ExportButton Component
 * Triggers the export dialog for project or comparison data
 */
export function ExportButton({
  source,
  data,
  variant = 'outline',
  size = 'sm',
  className,
  children,
  onExportComplete,
}: ExportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleExportComplete = (result: any) => {
    onExportComplete?.(result)
    setDialogOpen(false)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
        disabled={!data}
      >
        <Download className="w-4 h-4 mr-2" />
        {children || '导出'}
      </Button>

      {data && (
        <ExportDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          source={source}
          data={data}
          onExportComplete={handleExportComplete}
        />
      )}
    </>
  )
}
