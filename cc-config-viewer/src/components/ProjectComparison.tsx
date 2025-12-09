import React, { useEffect } from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import { ComparisonPanel } from './ComparisonPanel'
import { Button } from './ui/button'
import { X, GitCompare } from 'lucide-react'
import type { DiscoveredProject } from '../types/project'

interface ProjectComparisonProps {
  className?: string
}

/**
 * ProjectComparison Component
 * Main side-by-side comparison view for two projects
 */
export function ProjectComparison({ className }: ProjectComparisonProps) {
  const {
    comparison,
    clearComparison,
    calculateDiff,
  } = useProjectsStore()

  const { leftProject, rightProject, isComparing, diffResults } = comparison

  // Auto-calculate diff when projects are set
  useEffect(() => {
    if (leftProject && rightProject) {
      calculateDiff()
    }
  }, [leftProject, rightProject, calculateDiff])

  if (!isComparing || !leftProject || !rightProject) {
    return (
      <div className={`flex items-center justify-center h-64 ${className || ''}`}>
        <div className="text-center text-muted-foreground">
          <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select two projects to compare</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Project Comparison</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={clearComparison}>
          <X className="h-4 w-4 mr-1" />
          Exit Comparison
        </Button>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <ComparisonPanel
          project={leftProject}
          diffResults={diffResults.filter((d) => d.leftValue?.id === d.capabilityId)}
          side="left"
          className="flex-1"
        />

        {/* Right Panel */}
        <ComparisonPanel
          project={rightProject}
          diffResults={diffResults.filter((d) => d.rightValue?.id === d.capabilityId)}
          side="right"
          className="flex-1"
        />
      </div>

      {/* Summary Footer */}
      {diffResults.length > 0 && (
        <div className="p-4 border-t bg-muted/50">
          <ComparisonSummary diffResults={diffResults} />
        </div>
      )}
    </div>
  )
}

/**
 * Summary component showing comparison statistics
 */
function ComparisonSummary({ diffResults }: { diffResults: any[] }) {
  const matches = diffResults.filter((d) => d.status === 'match').length
  const differences = diffResults.filter((d) => d.status === 'different').length
  const onlyLeft = diffResults.filter((d) => d.status === 'only-left').length
  const onlyRight = diffResults.filter((d) => d.status === 'only-right').length
  const total = diffResults.length

  return (
    <div className="flex items-center justify-center space-x-6 text-sm">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span>{matches} matches</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <span>{differences} differences</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span>{onlyLeft} only in left</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-purple-500" />
        <span>{onlyRight} only in right</span>
      </div>
      <div className="text-muted-foreground">Total: {total} capabilities</div>
    </div>
  )
}