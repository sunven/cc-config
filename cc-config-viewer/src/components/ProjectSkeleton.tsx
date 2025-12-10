/**
 * Project card skeleton component
 *
 * This component provides skeleton loading states for project cards and lists,
 * showing placeholder content while project data is being loaded.
 */

import React from 'react'
import { cn } from '../lib/utils'
import { ProjectSkeletonProps } from '../lib/loadingTypes'

/**
 * Individual project card skeleton
 */
const ProjectCardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-border bg-card p-6',
      'animate-pulse',
      className
    )}
    {...props}
  >
    {/* Header with icon and name */}
    <div className="flex items-start space-x-4">
      <div className="h-10 w-10 rounded bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    </div>

    {/* Description */}
    <div className="mt-4 space-y-2">
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-5/6 rounded bg-muted" />
    </div>

    {/* Metadata */}
    <div className="mt-4 flex items-center space-x-4">
      <div className="h-4 w-20 rounded bg-muted" />
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
    </div>

    {/* Badges */}
    <div className="mt-4 flex flex-wrap gap-2">
      <div className="h-6 w-16 rounded bg-muted" />
      <div className="h-6 w-20 rounded bg-muted" />
      <div className="h-6 w-14 rounded bg-muted" />
    </div>

    {/* Actions */}
    <div className="mt-4 flex space-x-2">
      <div className="h-9 w-24 rounded bg-muted" />
      <div className="h-9 w-20 rounded bg-muted" />
    </div>
  </div>
))
ProjectCardSkeleton.displayName = 'ProjectCardSkeleton'

/**
 * Project list item skeleton
 */
const ProjectListSkeleton = React.forwardRef<
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
    {/* Icon */}
    <div className="h-12 w-12 rounded bg-muted" />

    {/* Content */}
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-5 w-1/3 rounded bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="flex space-x-2">
        <div className="h-6 w-16 rounded bg-muted" />
        <div className="h-6 w-20 rounded bg-muted" />
      </div>
    </div>

    {/* Action button */}
    <div className="h-9 w-20 rounded bg-muted" />
  </div>
))
ProjectListSkeleton.displayName = 'ProjectListSkeleton'

/**
 * Project skeleton component
 *
 * @param count - Number of skeleton items to show (default: 6)
 * @param layout - Layout mode: 'grid' or 'list' (default: 'grid')
 * @param className - Additional CSS classes
 */
export const ProjectSkeleton = React.forwardRef<HTMLDivElement, ProjectSkeletonProps>(
  ({ count = 6, layout = 'grid', className, ...props }, ref) => {
    const isGrid = layout === 'grid'
    const isList = layout === 'list'

    return (
      <div
        ref={ref}
        className={cn(
          isGrid && 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
          isList && 'space-y-3',
          className
        )}
        {...props}
        role="status"
        aria-label="Loading projects"
      >
        {Array.from({ length: count }).map((_, index) =>
          isGrid ? (
            <ProjectCardSkeleton key={index} />
          ) : (
            <ProjectListSkeleton key={index} />
          )
        )}

        {/* Screen reader only text */}
        <span className="sr-only">Loading projects...</span>
      </div>
    )
  }
)
ProjectSkeleton.displayName = 'ProjectSkeleton'

/**
 * Compact project skeleton for smaller spaces
 */
export const ProjectSkeletonCompact = React.forwardRef<
  HTMLDivElement,
  Omit<ProjectSkeletonProps, 'layout'>
>(({ count = 4, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('grid grid-cols-2 gap-3', className)}
      {...props}
      role="status"
      aria-label="Loading projects"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border border-border p-3',
            'animate-pulse'
          )}
        >
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}

      <span className="sr-only">Loading projects...</span>
    </div>
  )
})
ProjectSkeletonCompact.displayName = 'ProjectSkeletonCompact'

/**
 * Detailed project skeleton with full information
 */
export const ProjectSkeletonDetailed = React.forwardRef<
  HTMLDivElement,
  Omit<ProjectSkeletonProps, 'layout'>
>(({ count = 3, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
      role="status"
      aria-label="Loading project details"
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

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
            <div className="h-6 w-14 rounded bg-muted" />
            <div className="h-6 w-18 rounded bg-muted" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading project details...</span>
    </div>
  )
})
ProjectSkeletonDetailed.displayName = 'ProjectSkeletonDetailed'

/**
 * Project comparison skeleton for side-by-side view
 */
export const ProjectComparisonSkeleton = React.forwardRef<
  HTMLDivElement,
  { showDiff?: boolean } & React.HTMLAttributes<HTMLDivElement>
>(({ showDiff = true, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}
      {...props}
      role="status"
      aria-label="Loading project comparison"
    >
      {/* Project A */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 rounded bg-muted" />
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
        <ProjectCardSkeleton />
      </div>

      {/* Project B */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 rounded bg-muted" />
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
        <ProjectCardSkeleton />
      </div>

      {/* Diff indicator */}
      {showDiff && (
        <div className="md:col-span-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-px w-24 bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-px w-24 bg-muted" />
          </div>
        </div>
      )}

      <span className="sr-only">Loading project comparison...</span>
    </div>
  )
})
ProjectComparisonSkeleton.displayName = 'ProjectComparisonSkeleton'

export default ProjectSkeleton
