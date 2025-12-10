import { useState, useCallback } from 'react'

interface UseVirtualizedListOptions {
  /**
   * The number of items in the list
   */
  count: number

  /**
   * The estimated size of each item in pixels
   */
  estimateSize?: number

  /**
   * Whether to overscan items for smoother scrolling
   */
  overscan?: number

  /**
   * Whether to enable virtualization
   */
  enabled?: boolean

  /**
   * Threshold above which to enable virtualization
   */
  threshold?: number
}

/**
 * Hook to determine if virtualization should be used for a list
 * Based on the list size and configuration options
 */
export function useVirtualizedList(options: UseVirtualizedListOptions) {
  const {
    count,
    estimateSize = 60,
    overscan = 5,
    enabled = true,
    threshold = 50
  } = options

  const [scrollPosition, setScrollPosition] = useState(0)

  // Determine if virtualization should be enabled
  const shouldVirtualize = enabled && count > threshold

  // Get the item size (estimated or actual)
  const getItemSize = useCallback(() => {
    return estimateSize
  }, [estimateSize])

  // Handle scroll position updates
  const handleScroll = useCallback((offset: number) => {
    setScrollPosition(offset)
  }, [])

  // Get virtualization configuration
  const getVirtualizerConfig = useCallback(() => {
    if (!shouldVirtualize) {
      return null
    }

    return {
      count,
      estimateSize,
      overscan
    }
  }, [shouldVirtualize, count, estimateSize, overscan])

  return {
    shouldVirtualize,
    scrollPosition,
    handleScroll,
    getItemSize,
    getVirtualizerConfig,
    threshold
  }
}

export default useVirtualizedList
