/**
 * Capability display skeleton component
 *
 * This component provides skeleton loading states for MCP servers and sub-agents,
 * showing placeholder content while capability data is being loaded.
 */

import React from 'react'
import { cn } from '../lib/utils'
import { CapabilitySkeletonProps } from '../lib/loadingTypes'

/**
 * Individual capability card skeleton
 */
const CapabilityCardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { showDescription?: boolean }
>(({ showDescription = true, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-border bg-card p-5',
      'animate-pulse',
      className
    )}
    {...props}
  >
    {/* Header with icon and name */}
    <div className="flex items-start space-x-3">
      <div className="h-10 w-10 rounded bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
      </div>
    </div>

    {/* Description */}
    {showDescription && (
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
        <div className="h-4 w-3/5 rounded bg-muted" />
      </div>
    )}

    {/* Metadata */}
    <div className="mt-4 flex items-center space-x-4">
      <div className="h-4 w-20 rounded bg-muted" />
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
    </div>

    {/* Tags/Badges */}
    <div className="mt-3 flex flex-wrap gap-2">
      <div className="h-6 w-14 rounded bg-muted" />
      <div className="h-6 w-16 rounded bg-muted" />
      <div className="h-6 w-12 rounded bg-muted" />
    </div>

    {/* Actions */}
    <div className="mt-4 flex space-x-2">
      <div className="h-8 w-20 rounded bg-muted" />
      <div className="h-8 w-16 rounded bg-muted" />
    </div>
  </div>
))
CapabilityCardSkeleton.displayName = 'CapabilityCardSkeleton'

/**
 * Capability list item skeleton
 */
const CapabilityListItemSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { showDescription?: boolean }
>(({ showDescription = true, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-start space-x-4 rounded-lg border border-border p-4',
      'animate-pulse',
      className
    )}
    {...props}
  >
    {/* Icon */}
    <div className="h-10 w-10 rounded bg-muted" />

    {/* Content */}
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-5 w-1/3 rounded bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
      </div>

      {showDescription && (
        <div className="space-y-1">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      )}

      <div className="flex space-x-2">
        <div className="h-6 w-14 rounded bg-muted" />
        <div className="h-6 w-16 rounded bg-muted" />
      </div>
    </div>

    {/* Action button */}
    <div className="h-8 w-16 rounded bg-muted" />
  </div>
))
CapabilityListItemSkeleton.displayName = 'CapabilityListItemSkeleton'

/**
 * Capability skeleton component
 *
 * @param count - Number of skeleton items to show (default: 6)
 * @param showDescription - Whether to show description placeholders (default: true)
 * @param className - Additional CSS classes
 */
export const CapabilitySkeleton = React.forwardRef<HTMLDivElement, CapabilitySkeletonProps>(
  ({ count = 6, showDescription = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
          className
        )}
        {...props}
        role="status"
        aria-label="Loading capabilities"
      >
        {Array.from({ length: count }).map((_, index) => (
          <CapabilityCardSkeleton key={index} showDescription={showDescription} />
        ))}

        {/* Screen reader only text */}
        <span className="sr-only">Loading capabilities...</span>
      </div>
    )
  }
)
CapabilitySkeleton.displayName = 'CapabilitySkeleton'

/**
 * Capability list skeleton (for list view)
 */
export const CapabilityListSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<CapabilitySkeletonProps, 'showDescription'>
>(({ count = 5, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      {...props}
      role="status"
      aria-label="Loading capabilities list"
    >
      {Array.from({ length: count }).map((_, index) => (
        <CapabilityListItemSkeleton key={index} showDescription={true} />
      ))}

      <span className="sr-only">Loading capabilities list...</span>
    </div>
  )
})
CapabilityListSkeleton.displayName = 'CapabilityListSkeleton'

/**
 * Compact capability skeleton for smaller spaces
 */
export const CapabilitySkeletonCompact = React.forwardRef<
  HTMLDivElement,
  Omit<CapabilitySkeletonProps, 'showDescription'>
>(({ count = 8, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4', className)}
      {...props}
      role="status"
      aria-label="Loading capabilities"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'flex flex-col items-center rounded-lg border border-border p-3',
            'animate-pulse'
          )}
        >
          <div className="h-8 w-8 rounded bg-muted" />
          <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-1 h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}

      <span className="sr-only">Loading capabilities...</span>
    </div>
  )
})
CapabilitySkeletonCompact.displayName = 'CapabilitySkeletonCompact'

/**
 * Detailed capability skeleton with full information
 */
export const CapabilitySkeletonDetailed = React.forwardRef<
  HTMLDivElement,
  Omit<CapabilitySkeletonProps, 'showDescription'>
>(({ count = 3, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
      role="status"
      aria-label="Loading capability details"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border border-border bg-card p-6',
            'animate-pulse'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="h-12 w-12 rounded bg-muted" />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="h-6 w-1/2 rounded bg-muted" />
                  <div className="mt-1 h-4 w-1/3 rounded bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <div className="h-9 w-24 rounded bg-muted" />
              <div className="h-9 w-20 rounded bg-muted" />
              <div className="h-9 w-9 rounded bg-muted" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-6 w-14 rounded bg-muted" />
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-12 rounded bg-muted" />
            <div className="h-6 w-18 rounded bg-muted" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading capability details...</span>
    </div>
  )
})
CapabilitySkeletonDetailed.displayName = 'CapabilitySkeletonDetailed'

/**
 * MCP server specific skeleton
 */
export const MCPServerSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<CapabilitySkeletonProps, 'showDescription'>
>(({ count = 4, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
      role="status"
      aria-label="Loading MCP servers"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border border-border bg-card p-5',
            'animate-pulse'
          )}
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/2 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded bg-muted" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-6 w-20 rounded bg-muted" />
            <div className="h-6 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading MCP servers...</span>
    </div>
  )
})
MCPServerSkeleton.displayName = 'MCPServerSkeleton'

/**
 * Sub-agent specific skeleton
 */
export const SubAgentSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<CapabilitySkeletonProps, 'showDescription'>
>(({ count = 4, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
      role="status"
      aria-label="Loading sub-agents"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border border-border bg-card p-5',
            'animate-pulse'
          )}
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/2 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
            <div className="h-6 w-14 rounded bg-muted" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-18 rounded bg-muted" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading sub-agents...</span>
    </div>
  )
})
SubAgentSkeleton.displayName = 'SubAgentSkeleton'

export default CapabilitySkeleton
