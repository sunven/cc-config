/**
 * Configuration list skeleton component
 *
 * This component provides a skeleton loading state for configuration lists,
 * showing placeholder content while data is being loaded.
 */

import React from 'react'
import { cn } from '../lib/utils'
import { ConfigSkeletonProps } from '../lib/loadingTypes'

/**
 * Individual config item skeleton
 */
const ConfigItemSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center space-x-4 rounded-lg border border-border p-4',
      'animate-pulse',
      className
    )}
    {...props}
  >
    {/* Icon placeholder */}
    <div className="h-5 w-5 rounded bg-muted" />

    {/* Config key placeholder */}
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>

    {/* Badge placeholder */}
    <div className="h-6 w-16 rounded bg-muted" />

    {/* Value placeholder */}
    <div className="h-4 w-24 rounded bg-muted" />
  </div>
))
ConfigItemSkeleton.displayName = 'ConfigItemSkeleton'

/**
 * Configuration list skeleton component
 *
 * @param count - Number of skeleton items to show (default: 5)
 * @param showIcons - Whether to show icon placeholders (default: true)
 * @param showBadges - Whether to show badge placeholders (default: true)
 * @param className - Additional CSS classes
 */
export const ConfigSkeleton = React.forwardRef<HTMLDivElement, ConfigSkeletonProps>(
  ({ count = 5, showIcons = true, showBadges = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-3', className)}
        {...props}
        role="status"
        aria-label="Loading configuration"
      >
        {Array.from({ length: count }).map((_, index) => (
          <ConfigItemSkeleton
            key={index}
            // Conditionally hide icon and badges based on props
            style={{
              paddingLeft: showIcons ? undefined : '1rem',
            }}
          />
        ))}

        {/* Screen reader only text */}
        <span className="sr-only">Loading configuration list...</span>
      </div>
    )
  }
)
ConfigSkeleton.displayName = 'ConfigSkeleton'

/**
 * Compact config skeleton for smaller spaces
 */
export const ConfigSkeletonCompact = React.forwardRef<
  HTMLDivElement,
  Omit<ConfigSkeletonProps, 'showIcons' | 'showBadges'>
>(({ count = 3, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-2', className)}
      {...props}
      role="status"
      aria-label="Loading configuration"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center space-x-3 rounded border border-border p-3',
            'animate-pulse'
          )}
        >
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>
      ))}

      <span className="sr-only">Loading configuration list...</span>
    </div>
  )
})
ConfigSkeletonCompact.displayName = 'ConfigSkeletonCompact'

/**
 * Detailed config skeleton with more information
 */
export const ConfigSkeletonDetailed = React.forwardRef<
  HTMLDivElement,
  Omit<ConfigSkeletonProps, 'showIcons' | 'showBadges'>
>(({ count = 3, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
      role="status"
      aria-label="Loading configuration details"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border border-border p-4',
            'animate-pulse'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>

            <div className="flex space-x-2">
              <div className="h-6 w-16 rounded bg-muted" />
              <div className="h-6 w-20 rounded bg-muted" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-4/6 rounded bg-muted" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading configuration details...</span>
    </div>
  )
})
ConfigSkeletonDetailed.displayName = 'ConfigSkeletonDetailed'

/**
 * Config group skeleton for grouped configurations
 */
export const ConfigGroupSkeleton = React.forwardRef<
  HTMLDivElement,
  {
    groupCount?: number
    itemCount?: number
  } & React.HTMLAttributes<HTMLDivElement>
>(({ groupCount = 2, itemCount = 3, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-6', className)}
      {...props}
      role="status"
      aria-label="Loading configuration groups"
    >
      {Array.from({ length: groupCount }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          {/* Group header */}
          <div className="flex items-center space-x-2">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>

          {/* Group items */}
          <div className="ml-4 space-y-2">
            {Array.from({ length: itemCount }).map((_, itemIndex) => (
              <div
                key={itemIndex}
                className={cn(
                  'flex items-center space-x-4 rounded border border-border p-3',
                  'animate-pulse'
                )}
              >
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/4 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <span className="sr-only">Loading configuration groups...</span>
    </div>
  )
})
ConfigGroupSkeleton.displayName = 'ConfigGroupSkeleton'

export default ConfigSkeleton
