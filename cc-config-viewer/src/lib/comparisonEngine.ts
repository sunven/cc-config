import type { Capability, DiffResult, DiffStatus, DiffSeverity } from '../types/comparison'

/**
 * Calculate difference between two capability lists
 * Optimized for 100+ capabilities with O(n) complexity
 */
export function calculateDiff(
  leftCapabilities: Capability[],
  rightCapabilities: Capability[]
): DiffResult[] {
  const diffs: DiffResult[] = []

  // Create a map of right capabilities for efficient O(1) lookups
  const rightMap: Map<string, Capability> = new Map()
  for (const cap of rightCapabilities) {
    rightMap.set(cap.id, cap)
  }

  // Process left capabilities
  for (const leftCap of leftCapabilities) {
    const rightCap = rightMap.get(leftCap.id)

    if (rightCap) {
      // Capability exists in both - compare values
      if (isValuesEqual(leftCap.value, rightCap.value)) {
        // Values match
        diffs.push({
          capabilityId: leftCap.id,
          leftValue: leftCap,
          rightValue: rightCap,
          status: 'match',
          severity: 'low',
        })
      } else {
        // Values differ
        diffs.push({
          capabilityId: leftCap.id,
          leftValue: leftCap,
          rightValue: rightCap,
          status: 'different',
          severity: getSeverityFromCapability(leftCap),
        })
      }
    } else {
      // Capability only exists in left
      diffs.push({
        capabilityId: leftCap.id,
        leftValue: leftCap,
        rightValue: undefined,
        status: 'only-left',
        severity: getSeverityFromCapability(leftCap),
      })
    }
  }

  // Process right capabilities that don't exist in left
  const leftMap: Map<string, Capability> = new Map(
    leftCapabilities.map((cap) => [cap.id, cap])
  )

  for (const rightCap of rightCapabilities) {
    if (!leftMap.has(rightCap.id)) {
      // Capability only exists in right
      diffs.push({
        capabilityId: rightCap.id,
        leftValue: undefined,
        rightValue: rightCap,
        status: 'only-right',
        severity: getSeverityFromCapability(rightCap),
      })
    }
  }

  return diffs
}

/**
 * Compare two JSON values for equality
 */
function isValuesEqual(left: any, right: any): boolean {
  // Handle primitive types
  if (left === right) return true

  // Handle null/undefined
  if (left == null || right == null) return left === right

  // Handle different types
  if (typeof left !== typeof right) return false

  // Deep comparison for objects
  if (typeof left === 'object') {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    // Different number of keys
    if (leftKeys.length !== rightKeys.length) return false

    // Compare all keys and values
    for (const key of leftKeys) {
      if (!rightKeys.includes(key)) return false
      if (!isValuesEqual(left[key], right[key])) return false
    }

    return true
  }

  return false
}

/**
 * Determine severity based on capability metadata
 */
function getSeverityFromCapability(capability: Capability): DiffSeverity {
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
 * Group diff results by status for analysis
 */
export function groupDiffsByStatus(diffs: DiffResult[]): {
  matches: DiffResult[]
  differences: DiffResult[]
  conflicts: DiffResult[]
  onlyLeft: DiffResult[]
  onlyRight: DiffResult[]
} {
  return {
    matches: diffs.filter((d) => d.status === 'match'),
    differences: diffs.filter((d) => d.status === 'different'),
    conflicts: diffs.filter((d) => d.status === 'conflict'),
    onlyLeft: diffs.filter((d) => d.status === 'only-left'),
    onlyRight: diffs.filter((d) => d.status === 'only-right'),
  }
}

/**
 * Get summary statistics for diff results
 */
export function getDiffSummary(diffs: DiffResult[]): {
  total: number
  matches: number
  differences: number
  conflicts: number
  onlyLeft: number
  onlyRight: number
  matchPercentage: number
} {
  const grouped = groupDiffsByStatus(diffs)
  const matches = grouped.matches.length
  const total = diffs.length
  const matchPercentage = total > 0 ? Math.round((matches / total) * 100) : 0

  return {
    total,
    matches,
    differences: grouped.differences.length,
    conflicts: grouped.conflicts.length,
    onlyLeft: grouped.onlyLeft.length,
    onlyRight: grouped.onlyRight.length,
    matchPercentage,
  }
}