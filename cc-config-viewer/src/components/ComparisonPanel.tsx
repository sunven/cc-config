import React from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Folder, FileText } from 'lucide-react'
import { DifferenceHighlight } from './DifferenceHighlight'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'

interface ComparisonPanelProps {
  project: DiscoveredProject
  diffResults: DiffResult[]
  side: 'left' | 'right'
  className?: string
}

/**
 * ComparisonPanel Component
 * Individual panel for left or right side of comparison view
 */
export function ComparisonPanel({
  project,
  diffResults,
  side,
  className,
}: ComparisonPanelProps) {
  return (
    <div className={`flex flex-col border-r ${className || ''}`}>
      {/* Panel Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {side === 'left' && <Badge variant="outline">Left</Badge>}
            {side === 'right' && <Badge variant="outline">Right</Badge>}
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{project.configFileCount} config files</span>
        </div>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
            {diffResults.map((diffResult) => (
              <DifferenceHighlight
                key={diffResult.capabilityId}
                diffResult={diffResult}
                side={side}
              />
            ))}
            {diffResults.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>No capabilities to display</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  )
}