import React, { useState, useEffect, useMemo, memo } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CapabilityRow } from './CapabilityRow'
import { CapabilityDetails } from './CapabilityDetails'
import { ExportButton } from './ExportButton'
import { useConfigStore } from '../stores/configStore'
import { useProjectsStore } from '../stores/projectsStore'
import type { UnifiedCapability, CapabilityFilterState, CapabilitySortState } from '../types/capability'

interface CapabilityPanelProps {
  scope: 'user' | 'project'
  projectName?: string
}

export const CapabilityPanel: React.FC<CapabilityPanelProps> = ({ scope, projectName }) => {
  const {
    capabilities,
    updateCapabilities,
    filterCapabilities,
    sortCapabilities,
    error
  } = useConfigStore()

  const { projects } = useProjectsStore()

  // Find current project if in project scope
  const currentProject = useMemo(() => {
    if (scope === 'project' && projectName) {
      return projects.find(p => p.name === projectName)
    }
    return null
  }, [scope, projectName, projects])

  const [filters, setFilters] = useState<CapabilityFilterState>({
    type: 'all'
  })
  const [sort, setSort] = useState<CapabilitySortState>({ field: 'name', direction: 'asc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal state for CapabilityDetails
  const [selectedCapability, setSelectedCapability] = useState<UnifiedCapability | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(`capability-panel-${scope}`)
      if (savedState) {
        const parsed = JSON.parse(savedState)
        setFilters(parsed.filters || { type: 'all' })
        setSort(parsed.sort || { field: 'name', direction: 'asc' })
        setSearchQuery(parsed.searchQuery || '')
      }
    } catch (error) {
      console.warn('Failed to load saved capability panel state:', error)
    }
  }, [scope])

  // Save state when it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        `capability-panel-${scope}`,
        JSON.stringify({ filters, sort, searchQuery: debouncedSearchQuery })
      )
    } catch (error) {
      console.warn('Failed to save capability panel state:', error)
    }
  }, [filters, sort, debouncedSearchQuery, scope])

  // Load capabilities on mount and scope change
  useEffect(() => {
    updateCapabilities()
  }, [scope, updateCapabilities])

  // Apply filters, search, and sorting
  const processedCapabilities = useMemo(() => {
    let filtered = [...capabilities]

    // Apply debounced search query first
    if (debouncedSearchQuery.trim()) {
      filtered = filterCapabilities({ ...filters, searchQuery: debouncedSearchQuery })
    } else {
      filtered = filterCapabilities(filters)
    }

    // Apply sorting
    filtered = sortCapabilities(filtered, sort)

    return filtered
  }, [capabilities, filters, sort, debouncedSearchQuery, filterCapabilities, sortCapabilities])

  // Get counts for each type
  const typeCounts = useMemo(() => {
    const counts = {
      all: capabilities.length,
      mcp: capabilities.filter(c => c.type === 'mcp').length,
      agent: capabilities.filter(c => c.type === 'agent').length
    }
    return counts
  }, [capabilities])

  const handleSort = (field: CapabilitySortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await updateCapabilities()
    } catch (err) {
      console.error('Failed to refresh capabilities:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearFilters = () => {
    setFilters({ type: 'all' })
    setSearchQuery('')
  }

  // Handle capability row click to open details modal
  const handleCapabilityClick = (capability: UnifiedCapability) => {
    setSelectedCapability(capability)
    setIsDetailsModalOpen(true)
  }

  // Handle closing the details modal
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedCapability(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Capabilities <span className="text-sm font-normal text-muted-foreground">({scope} scope)</span>
        </h2>
        <div className="flex items-center space-x-2">
          <ExportButton
            source="project"
            data={currentProject}
            variant="outline"
            size="sm"
          >
            导出能力
          </ExportButton>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          <p className="font-medium">Error loading capabilities:</p>
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Search capabilities..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Type Filter Toggle */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium">Type:</span>
        <Button
          variant={filters.type === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
        >
          All ({typeCounts.all})
        </Button>
        <Button
          variant={filters.type === 'mcp' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters(prev => ({ ...prev, type: 'mcp' }))}
        >
          🔌 MCP ({typeCounts.mcp})
        </Button>
        <Button
          variant={filters.type === 'agent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters(prev => ({ ...prev, type: 'agent' }))}
        >
          🤖 Agents ({typeCounts.agent})
        </Button>

        {/* Clear Filters */}
        {(filters.type !== 'all' || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Sort by:</span>
        <Button
          variant={sort.field === 'name' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSort('name')}
        >
          Name {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
        </Button>
        <Button
          variant={sort.field === 'type' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSort('type')}
        >
          Type {sort.field === 'type' && (sort.direction === 'asc' ? '↑' : '↓')}
        </Button>
        <Button
          variant={sort.field === 'status' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSort('status')}
        >
          Status {sort.field === 'status' && (sort.direction === 'asc' ? '↑' : '↓')}
        </Button>
        <Button
          variant={sort.field === 'source' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSort('source')}
        >
          Source {sort.field === 'source' && (sort.direction === 'asc' ? '↑' : '↓')}
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {processedCapabilities.length} of {capabilities.length} capabilities
      </div>

      {/* Capability List */}
      {processedCapabilities.length > 0 ? (
        <div className="grid gap-3">
          {processedCapabilities.map((capability) => (
            <CapabilityRow
              key={capability.id}
              capability={capability}
              onClick={() => handleCapabilityClick(capability)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No capabilities found</p>
          <p className="text-sm">
            {searchQuery || filters.type !== 'all'
              ? 'Try adjusting your filters or search query'
              : `No capabilities configured for ${scope} scope`}
          </p>
        </div>
      )}

      {/* Capability Details Modal */}
      {selectedCapability && (
        <CapabilityDetails
          capability={selectedCapability}
          open={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  )
}

// Memoized export with custom comparison
export const MemoizedCapabilityPanel = memo(CapabilityPanel, (prevProps, nextProps) => {
  // Only re-render if scope or projectName changes
  // These are the only props that affect the data fetching
  // Internal state changes (filters, search, etc.) don't require parent re-renders
  return (
    prevProps.scope === nextProps.scope &&
    prevProps.projectName === nextProps.projectName
  )
})

MemoizedCapabilityPanel.displayName = 'CapabilityPanel'