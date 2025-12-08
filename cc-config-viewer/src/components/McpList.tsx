import React, { useState, useEffect, useMemo } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { McpBadge } from './McpBadge'
import { useConfigStore } from '../stores/configStore'
import type { McpServer } from '../types/mcp'

interface FilterState {
  source?: 'user' | 'project' | 'local'
  type?: 'http' | 'stdio' | 'sse'
  status?: 'active' | 'inactive' | 'error'
  searchQuery?: string
}

interface SortState {
  field: 'name' | 'type' | 'status' | 'source'
  direction: 'asc' | 'desc'
}

interface McpListProps {
  scope: 'user' | 'project'
  projectName?: string
}

export const McpList: React.FC<McpListProps> = ({ scope, projectName }) => {
  const {
    mcpServers,
    mcpServersByScope,
    updateMcpServers,
    filterMcpServers,
    sortMcpServers,
    startMcpStatusRefresh,
    stopMcpStatusRefresh,
    error
  } = useConfigStore()

  const [filters, setFilters] = useState<FilterState>({})
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const ITEMS_PER_PAGE = 20

  // Get servers for current scope
  const currentScopeServers = mcpServersByScope[scope] || []

  // Apply filters and sorting
  const processedServers = useMemo(() => {
    let filtered = [...currentScopeServers]

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    if (filters.source) {
      // Determine source from sourcePath
      filtered = filtered.filter(server => {
        const source = getSourceFromPath(server.sourcePath)
        return source === filters.source
      })
    }

    if (filters.type) {
      filtered = filtered.filter(server => server.type === filters.type)
    }

    if (filters.status) {
      filtered = filtered.filter(server => server.status === filters.status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sort.field) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'source':
          aValue = a.sourcePath
          bValue = b.sourcePath
          break
        default:
          return 0
      }

      const comparison = aValue.localeCompare(bValue)
      return sort.direction === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [currentScopeServers, filters, sort, searchQuery])

  // Paginate servers
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return processedServers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [processedServers, currentPage])

  const totalPages = Math.ceil(processedServers.length / ITEMS_PER_PAGE)

  // Load MCP servers on mount and scope change
  useEffect(() => {
    updateMcpServers()
  }, [scope, updateMcpServers])

  // Start periodic refresh on mount
  useEffect(() => {
    startMcpStatusRefresh()
    return () => {
      stopMcpStatusRefresh()
    }
  }, [startMcpStatusRefresh, stopMcpStatusRefresh])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery])

  const handleSort = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await updateMcpServers()
    } catch (err) {
      console.error('Failed to refresh MCP servers:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }

  const getSourceFromPath = (sourcePath: string): 'user' | 'project' | 'local' => {
    // User-level: ~/.claude.json (absolute path, not starting with ./)
    if (sourcePath.includes('.claude.json') && !sourcePath.startsWith('./')) {
      return 'user'
    }
    // Project-level: ./.mcp.json or ./.claude.json (relative path starting with ./)
    if (sourcePath.startsWith('./')) {
      return 'project'
    }
    // Local/inherited (any other path)
    return 'local'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          MCP Servers <span className="text-sm font-normal text-muted-foreground">({scope} scope)</span>
        </h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          <p className="font-medium">Error loading MCP servers:</p>
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

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <Input
          placeholder="Search servers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Source Filter */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Source:</span>
            <Button
              variant={filters.source === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, source: 'user' }))}
            >
              User
            </Button>
            <Button
              variant={filters.source === 'project' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, source: 'project' }))}
            >
              Project
            </Button>
            <Button
              variant={filters.source === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, source: 'local' }))}
            >
              Local
            </Button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Type:</span>
            <Button
              variant={filters.type === 'http' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, type: 'http' }))}
            >
              HTTP
            </Button>
            <Button
              variant={filters.type === 'stdio' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, type: 'stdio' }))}
            >
              Stdio
            </Button>
            <Button
              variant={filters.type === 'sse' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, type: 'sse' }))}
            >
              SSE
            </Button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Status:</span>
            <Button
              variant={filters.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, status: 'active' }))}
            >
              Active
            </Button>
            <Button
              variant={filters.status === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, status: 'inactive' }))}
            >
              Inactive
            </Button>
            <Button
              variant={filters.status === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, status: 'error' }))}
            >
              Error
            </Button>
          </div>

          {/* Clear Filters */}
          {(filters.source || filters.type || filters.status || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
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
        Showing {paginatedServers.length} of {processedServers.length} servers
      </div>

      {/* Server List */}
      {paginatedServers.length > 0 ? (
        <div className="grid gap-3">
          {paginatedServers.map((server) => (
            <McpBadge
              key={`${server.name}-${server.sourcePath}`}
              server={server}
              source={getSourceFromPath(server.sourcePath)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No MCP servers found</p>
          <p className="text-sm">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Try adjusting your filters or search query'
              : `No MCP servers configured for ${scope} scope`}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              // Ensure pageNum is valid
              if (pageNum < 1 || pageNum > totalPages) {
                return null
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  aria-label={`Go to page ${pageNum}`}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
