import React from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import { Badge } from './ui/badge'
import { Eye, EyeOff } from 'lucide-react'

/**
 * SummaryBadge Component
 * Displays the number of differences found with filtering capabilities
 */
export function SummaryBadge() {
  const { comparison, toggleDifferenceFilter } = useProjectsStore()
  const { highlighting } = comparison
  const { summary, filters } = highlighting

  const handleClick = () => {
    toggleDifferenceFilter()
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge
        variant="secondary"
        className={`cursor-pointer hover:opacity-80 transition-opacity ${
          filters.showOnlyDifferences ? 'bg-primary text-primary-foreground' : ''
        }`}
        onClick={handleClick}
        title="Click to toggle showing only differences"
      >
        {summary.totalDifferences > 0 ? (
          <>
            {summary.totalDifferences} {summary.totalDifferences === 1 ? 'difference' : 'differences'} found
            {filters.showOnlyDifferences ? <EyeOff className="ml-1 h-3 w-3" /> : <Eye className="ml-1 h-3 w-3" />}
          </>
        ) : (
          <>No differences found</>
        )}
      </Badge>

      {summary.totalDifferences > 0 && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {summary.onlyInA > 0 && (
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
              {summary.onlyInA} only in A
            </span>
          )}
          {summary.onlyInB > 0 && (
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              {summary.onlyInB} only in B
            </span>
          )}
          {summary.differentValues > 0 && (
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
              {summary.differentValues} different
            </span>
          )}
        </div>
      )}
    </div>
  )
}