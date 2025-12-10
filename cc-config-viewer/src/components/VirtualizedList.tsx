import React, { useRef, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ReactNode } from 'react'

interface VirtualizedListProps {
  /**
   * The total number of items
   */
  count: number

  /**
   * The height of the container
   */
  height: number | string

  /**
   * The estimated size of each item in pixels
   */
  estimateSize?: number

  /**
   * The actual size of each item (if all items have the same size)
   */
  size?: number

  /**
   * Render function for each item
   */
  children: (index: number) => ReactNode

  /**
   * Additional class name for the container
   */
  className?: string

  /**
   * Whether to overscan items for smoother scrolling
   */
  overscan?: number

  /**
   * Custom item key function
   */
  getItemKey?: (index: number) => string | number

  /**
   * Called when scrolling
   */
  onScroll?: (scrollOffset: number) => void
}

/**
 * A generic virtualized list component using @tanstack/react-virtual
 * Optimized for rendering large lists (100+ items) with minimal DOM updates
 */
export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  count,
  height,
  estimateSize = 60,
  size,
  children,
  className = '',
  overscan = 5,
  getItemKey = (index) => index,
  onScroll
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(0)

  // Measure the width of the container
  useEffect(() => {
    if (parentRef.current) {
      const updateWidth = () => {
        if (parentRef.current) {
          setWidth(parentRef.current.clientWidth)
        }
      }

      updateWidth()

      // Use ResizeObserver if available
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateWidth)
        resizeObserver.observe(parentRef.current)
        return () => resizeObserver.disconnect()
      } else {
        // Fallback to window resize
        window.addEventListener('resize', updateWidth)
        return () => window.removeEventListener('resize', updateWidth)
      }
    }
  }, [])

  // Create the virtualizer
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    ...(size && { size })
  })

  // Handle scroll events
  const handleScroll = () => {
    if (onScroll && parentRef.current) {
      onScroll(parentRef.current.scrollTop)
    }
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = children(virtualRow.index)
          const key = getItemKey(virtualRow.index)

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              {item}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualizedList
