import React, { useEffect, useMemo } from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import { ComparisonPanel } from './ComparisonPanel'
import { SummaryBadge } from './SummaryBadge'
import { FilterControls } from './FilterControls'
import { Button } from './ui/button'
import { X, GitCompare } from 'lucide-react'
import { filterDifferences } from '../lib/highlightEngine'
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
    categorizeDifferences,
    calculateSummaryStats,
  } = useProjectsStore()

  const { leftProject, rightProject, isComparing, diffResults, highlighting } = comparison
  const filters = highlighting?.filters || {
    showOnlyDifferences: false,
    showBlueOnly: true,
    showGreenOnly: true,
    showYellowOnly: true,
  }

  // Auto-calculate diff when projects are set
  useEffect(() => {
    if (leftProject && rightProject) {
      calculateDiff()
    }
  }, [leftProject, rightProject, calculateDiff])

  // Categorize differences and calculate summary stats when diffResults change
  useEffect(() => {
    if (diffResults.length > 0 && highlighting) {
      categorizeDifferences()
      calculateSummaryStats()
    }
  }, [diffResults, highlighting, categorizeDifferences, calculateSummaryStats])

  // Filter diff results based on current filters
  const filteredDiffResults = useMemo(() => {
    if (diffResults.length === 0) return diffResults
    return filterDifferences(diffResults, filters)
  }, [diffResults, filters])

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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Project Comparison</h2>
          </div>
          {highlighting && <SummaryBadge />}
        </div>
        <div className="flex items-center space-x-2">
          {highlighting && <FilterControls />}
          <Button variant="ghost" size="sm" onClick={clearComparison}>
            <X className="h-4 w-4 mr-1" />
            Exit Comparison
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <ComparisonPanel
          project={leftProject}
          diffResults={filteredDiffResults.filter((d) => d.leftValue?.id === d.capabilityId)}
          side="left"
          className="flex-1"
        />

        {/* Right Panel */}
        <ComparisonPanel
          project={rightProject}
          diffResults={filteredDiffResults.filter((d) => d.rightValue?.id === d.capabilityId)}
          side="right"
          className="flex-1"
        />
      </div>

      </div>
  )
}