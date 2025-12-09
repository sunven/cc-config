import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search, Filter, X } from 'lucide-react'

interface ProjectFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterConfig: 'all' | 'has-mcp' | 'has-agents'
  onFilterChange: (filter: 'all' | 'has-mcp' | 'has-agents') => void
  totalCount: number
  filteredCount: number
}

/**
 * ProjectFilter Component
 * Provides search and filtering controls for project list
 */
export function ProjectFilter({
  searchQuery,
  onSearchChange,
  filterConfig,
  onFilterChange,
  totalCount,
  filteredCount
}: ProjectFilterProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name or path..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filterConfig === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            <Filter className="h-4 w-4 mr-2" />
            All Projects
          </Button>
          <Button
            variant={filterConfig === 'has-mcp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('has-mcp')}
          >
            Has Config
          </Button>
          <Button
            variant={filterConfig === 'has-agents' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('has-agents')}
          >
            Has Agents
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredCount === totalCount ? (
          <span>Showing all {totalCount} projects</span>
        ) : (
          <span>
            Showing {filteredCount} of {totalCount} projects
          </span>
        )}
        {searchQuery && (
          <span className="ml-2 text-xs">
            (filtered by: "{searchQuery}")
          </span>
        )}
      </div>
    </div>
  )
}
