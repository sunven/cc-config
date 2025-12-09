import type { DiffResult, HighlightFilters, SummaryStats, HIGHLIGHT_CLASSES } from '../types/comparison'

/**
 * Categorize differences with highlighting metadata
 * Extends the comparisonEngine's calculateDiff function
 */
export function categorizeDifferences(diffResults: DiffResult[]): DiffResult[] {
  return diffResults.map((diff) => ({
    ...diff,
    highlightClass: getHighlightClass(diff.status),
  }))
}

/**
 * Get highlight class based on diff status
 */
export function getHighlightClass(status: string): string {
  switch (status) {
    case 'only-left':
      return 'bg-blue-100 text-blue-800' // Blue for only in A
    case 'only-right':
      return 'bg-green-100 text-green-800' // Green for only in B
    case 'different':
      return 'bg-yellow-100 text-yellow-800' // Yellow for different values
    case 'conflict':
      return 'bg-yellow-100 text-yellow-800' // Yellow for conflicts
    case 'match':
      return '' // No highlighting for matches
    default:
      return ''
  }
}

/**
 * Calculate summary statistics from diff results
 */
export function calculateSummaryStats(diffResults: DiffResult[]): SummaryStats {
  let onlyInA = 0
  let onlyInB = 0
  let differentValues = 0

  for (const diff of diffResults) {
    switch (diff.status) {
      case 'only-left':
        onlyInA += 1
        break
      case 'only-right':
        onlyInB += 1
        break
      case 'different':
      case 'conflict':
        differentValues += 1
        break
      case 'match':
        // Matches don't count toward differences
        break
    }
  }

  const totalDifferences = onlyInA + onlyInB + differentValues

  return {
    totalDifferences,
    onlyInA,
    onlyInB,
    differentValues,
  }
}

/**
 * Filter diff results based on highlighting filters
 */
export function filterDifferences(
  diffResults: DiffResult[],
  filters: HighlightFilters
): DiffResult[] {
  return diffResults.filter((diff) => {
    // Check individual filter toggles first
    const matchesBlue = filters.showBlueOnly && diff.status === 'only-left'
    const matchesGreen = filters.showGreenOnly && diff.status === 'only-right'
    const matchesYellow = filters.showYellowOnly && (diff.status === 'different' || diff.status === 'conflict')
    const matchesMatch = diff.status === 'match'

    // If showOnlyDifferences is true, exclude matches
    if (filters.showOnlyDifferences && matchesMatch) {
      return false
    }

    // If showOnlyDifferences is false and at least one type filter is enabled,
    // only show matching types
    if (!filters.showOnlyDifferences) {
      const anyFilterEnabled = filters.showBlueOnly || filters.showGreenOnly || filters.showYellowOnly

      if (anyFilterEnabled) {
        // Only show items that match the enabled filters
        // If all three type filters are enabled, also include matches
        const allTypeFiltersEnabled = filters.showBlueOnly && filters.showGreenOnly && filters.showYellowOnly
        if (allTypeFiltersEnabled) {
          return matchesBlue || matchesGreen || matchesYellow || matchesMatch
        }
        return matchesBlue || matchesGreen || matchesYellow
      }

      // If no filters are explicitly enabled (all false), show all
      return true
    }

    // If showOnlyDifferences is true, show differences based on individual filters
    const anyFilterEnabled = filters.showBlueOnly || filters.showGreenOnly || filters.showYellowOnly

    if (anyFilterEnabled) {
      // If at least one type filter is enabled, show matching types
      return matchesBlue || matchesGreen || matchesYellow
    }

    // If no individual filters are enabled, show all differences
    return !matchesMatch
  })
}

/**
 * Get severity from capability (extends comparisonEngine logic)
 */
export function getSeverityFromCapability(capability: { key: string; source: string }): 'low' | 'medium' | 'high' {
  // High severity for critical configurations
  if (capability.key.includes('security') || capability.key.includes('auth')) {
    return 'high'
  }

  // Medium severity for project-level configs
  if (capability.source === 'project') {
    return 'medium'
  }

  // Default to medium
  return 'medium'
}

/**
 * Performance-optimized categorization for large datasets
 * Target: <100ms for 100+ capabilities (extends Epic 5.2's 0.05ms)
 */
export function categorizeDifferencesOptimized(diffResults: DiffResult[]): DiffResult[] {
  const startTime = performance.now()

  // Single-pass categorization for optimal performance
  const categorized = diffResults.map((diff) => ({
    ...diff,
    highlightClass: getHighlightClass(diff.status),
  }))

  const endTime = performance.now()
  const executionTime = endTime - startTime

  // Log performance metrics (in production, this could be sent to analytics)
  if (executionTime > 100) {
    console.warn(`Highlighting categorization took ${executionTime.toFixed(2)}ms (target: <100ms)`)
  }

  return categorized
}

/**
 * Validate highlighting configuration
 */
export function validateHighlightFilters(filters: HighlightFilters): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate boolean fields
  if (typeof filters.showOnlyDifferences !== 'boolean') {
    errors.push('showOnlyDifferences must be a boolean')
  }
  if (typeof filters.showBlueOnly !== 'boolean') {
    errors.push('showBlueOnly must be a boolean')
  }
  if (typeof filters.showGreenOnly !== 'boolean') {
    errors.push('showGreenOnly must be a boolean')
  }
  if (typeof filters.showYellowOnly !== 'boolean') {
    errors.push('showYellowOnly must be a boolean')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}