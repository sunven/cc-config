import { useEffect, useRef } from 'react'

interface UseScrollSyncOptions {
  threshold?: number // Maximum difference in scroll position to sync (in pixels)
}

/**
 * Hook for synchronizing scroll positions between two scrollable containers
 * Optimized for <16ms lag (60fps)
 */
export function useScrollSync(
  leftRef: React.RefObject<HTMLElement>,
  rightRef: React.RefObject<HTMLElement>,
  options: UseScrollSyncOptions = {}
) {
  const { threshold = 5 } = options
  const isSyncingRef = useRef(false)
  const lastScrollTimeRef = useRef(0)

  useEffect(() => {
    const leftElement = leftRef.current
    const rightElement = rightRef.current

    if (!leftElement || !rightElement) {
      return
    }

    // Sync left to right
    const handleLeftScroll = () => {
      const now = performance.now()
      if (now - lastScrollTimeRef.current < 16) {
        // Throttle to ~60fps
        return
      }

      if (isSyncingRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = leftElement
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight)

      isSyncingRef.current = true
      lastScrollTimeRef.current = now

      const rightScrollTop = scrollPercentage * (rightElement.scrollHeight - rightElement.clientHeight)
      rightElement.scrollTop = rightScrollTop

      // Reset flag after a short delay
      setTimeout(() => {
        isSyncingRef.current = false
      }, 0)
    }

    // Sync right to left
    const handleRightScroll = () => {
      const now = performance.now()
      if (now - lastScrollTimeRef.current < 16) {
        // Throttle to ~60fps
        return
      }

      if (isSyncingRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = rightElement
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight)

      isSyncingRef.current = true
      lastScrollTimeRef.current = now

      const leftScrollTop = scrollPercentage * (leftElement.scrollHeight - leftElement.clientHeight)
      leftElement.scrollTop = leftScrollTop

      // Reset flag after a short delay
      setTimeout(() => {
        isSyncingRef.current = false
      }, 0)
    }

    // Add event listeners
    leftElement.addEventListener('scroll', handleLeftScroll, { passive: true })
    rightElement.addEventListener('scroll', handleRightScroll, { passive: true })

    // Cleanup
    return () => {
      leftElement.removeEventListener('scroll', handleLeftScroll)
      rightElement.removeEventListener('scroll', handleRightScroll)
    }
  }, [leftRef, rightRef, threshold])

  // Manual sync function
  const syncScrollPositions = () => {
    const leftElement = leftRef.current
    const rightElement = rightRef.current

    if (!leftElement || !rightElement) return

    // Sync based on which element has more content
    const leftScrollable = leftElement.scrollHeight > leftElement.clientHeight
    const rightScrollable = rightElement.scrollHeight > rightElement.clientHeight

    if (!leftScrollable || !rightScrollable) return

    // Use the element with larger scroll height as source
    if (leftElement.scrollHeight >= rightElement.scrollHeight) {
      const { scrollTop, scrollHeight, clientHeight } = leftElement
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight)
      const rightScrollTop = scrollPercentage * (rightElement.scrollHeight - rightElement.clientHeight)
      rightElement.scrollTop = rightScrollTop
    } else {
      const { scrollTop, scrollHeight, clientHeight } = rightElement
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight)
      const leftScrollTop = scrollPercentage * (leftElement.scrollHeight - leftElement.clientHeight)
      leftElement.scrollTop = leftScrollTop
    }
  }

  return { syncScrollPositions }
}