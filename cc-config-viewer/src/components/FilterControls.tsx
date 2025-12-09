import React from 'react'
import { useProjectsStore } from '../stores/projectsStore'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Filter, RotateCcw } from 'lucide-react'

/**
 * FilterControls Component
 * Provides controls for filtering differences by type
 */
export function FilterControls() {
  const { comparison, setHighlightFilters } = useProjectsStore()
  const { highlighting } = comparison
  const { filters } = highlighting

  const handleFilterToggle = (filterName: keyof typeof filters) => {
    setHighlightFilters({
      [filterName]: !filters[filterName],
    })
  }

  const handleReset = () => {
    setHighlightFilters({
      showOnlyDifferences: false,
      showBlueOnly: true,
      showGreenOnly: true,
      showYellowOnly: true,
    })
  }

  const activeFilterCount = [
    filters.showBlueOnly,
    filters.showGreenOnly,
    filters.showYellowOnly,
  ].filter(Boolean).length

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filters:</span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Blue filter - Only in A */}
      <Button
        variant={filters.showBlueOnly ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterToggle('showBlueOnly')}
        className="h-8 px-2"
        title="Toggle highlighting for capabilities only in Project A"
      >
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs">A only</span>
        </div>
      </Button>

      {/* Green filter - Only in B */}
      <Button
        variant={filters.showGreenOnly ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterToggle('showGreenOnly')}
        className="h-8 px-2"
        title="Toggle highlighting for capabilities only in Project B"
      >
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs">B only</span>
        </div>
      </Button>

      {/* Yellow filter - Different values */}
      <Button
        variant={filters.showYellowOnly ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterToggle('showYellowOnly')}
        className="h-8 px-2"
        title="Toggle highlighting for capabilities with different values"
      >
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs">Different</span>
        </div>
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Reset button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="h-8 px-2"
        title="Reset all filters to default"
      >
        <RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  )
}