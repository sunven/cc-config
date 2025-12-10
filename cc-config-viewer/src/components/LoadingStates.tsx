/**
 * Composite loading states component
 *
 * This component provides a unified interface for all loading states throughout
 * the application, including skeletons, spinners, progress bars, and overlays.
 */

import React from 'react'
import { cn } from '../lib/utils'
import { LoadingIndicator, LoadingComponentProps } from '../lib/loadingTypes'
import { ConfigSkeleton } from './ConfigSkeleton'
import { ProjectSkeleton } from './ProjectSkeleton'
import { CapabilitySkeleton } from './CapabilitySkeleton'

/**
 * Spinner component for quick loading states (<1s)
 */
const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'animate-spin rounded-full border-2 border-muted border-t-foreground',
        sizeClasses[size],
        className
      )}
      {...props}
      role="status"
      aria-label="Loading"
    />
  )
})
Spinner.displayName = 'Spinner'

/**
 * Progress bar component for file operations
 */
const ProgressBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    showLabel?: boolean
  }
>(({ className, value = 0, showLabel = true, ...props }, ref) => {
  const percentage = Math.max(0, Math.min(100, value))

  return (
    <div
      ref={ref}
      className={cn('w-full space-y-2', className)}
      {...props}
      role="status"
      aria-label={`Loading progress: ${percentage}%`}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-muted-foreground">{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    </div>
  )
})
ProgressBar.displayName = 'ProgressBar'

/**
 * Loading overlay for blocking operations
 */
const LoadingOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    message?: string | null
    showCancel?: boolean
    onCancel?: () => void
  }
>(({ className, message, showCancel, onCancel, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      {...props}
    >
      {/* Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
          <Spinner size="lg" />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="mt-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
})
LoadingOverlay.displayName = 'LoadingOverlay'

/**
 * Main loading states component
 *
 * This component automatically selects the appropriate loading indicator
 * based on the loading state and optional configuration.
 */
export const LoadingStates = React.forwardRef<HTMLDivElement, LoadingComponentProps>(
  (
    {
      isLoading,
      message,
      indicator = 'spinner',
      showCancel,
      onCancel,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Don't render anything if not loading and no children
    if (!isLoading && !children) {
      return null
    }

    // If loading and no children, show appropriate indicator
    if (isLoading && !children) {
      const LoadingIndicatorComponent = () => {
        switch (indicator) {
          case 'skeleton':
            return <ConfigSkeleton />

          case 'progress-bar':
            return (
              <div className="space-y-4">
                <ProgressBar value={message?.includes('%') ? parseInt(message.match(/\d+/)?.[0] || '0') : 0} />
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
              </div>
            )

          case 'overlay':
            return (
              <LoadingOverlay message={message} showCancel={showCancel} onCancel={onCancel}>
                <div className="invisible" />
              </LoadingOverlay>
            )

          case 'spinner':
          default:
            return (
              <div className="flex flex-col items-center justify-center space-y-3">
                <Spinner />
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
              </div>
            )
        }
      }

      return (
        <div
          ref={ref}
          className={cn('flex items-center justify-center', className)}
          {...props}
        >
          <LoadingIndicatorComponent />
        </div>
      )
    }

    // If loading with children, show overlay
    if (isLoading && children) {
      return (
        <LoadingOverlay
          ref={ref}
          message={message}
          showCancel={showCancel}
          onCancel={onCancel}
          className={className}
          {...props}
        >
          {children}
        </LoadingOverlay>
      )
    }

    // Not loading, just render children
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  }
)
LoadingStates.displayName = 'LoadingStates'

/**
 * Wrapper component that shows skeleton when loading and content when not
 */
export const LoadingWrapper = React.forwardRef<
  HTMLDivElement,
  {
    isLoading: boolean
    skeleton?: 'config' | 'project' | 'capability'
    skeletonProps?: any
    children: React.ReactNode
  } & React.HTMLAttributes<HTMLDivElement>
>(({ isLoading, skeleton = 'config', skeletonProps, children, className, ...props }, ref) => {
  const SkeletonComponent = () => {
    switch (skeleton) {
      case 'project':
        return <ProjectSkeleton {...skeletonProps} />
      case 'capability':
        return <CapabilitySkeleton {...skeletonProps} />
      case 'config':
      default:
        return <ConfigSkeleton {...skeletonProps} />
    }
  }

  return (
    <div ref={ref} className={className} {...props}>
      {isLoading ? <SkeletonComponent /> : children}
    </div>
  )
})
LoadingWrapper.displayName = 'LoadingWrapper'

/**
 * Component that automatically selects loading type based on message content
 */
export const SmartLoadingStates = React.forwardRef<HTMLDivElement, LoadingComponentProps>(
  ({ isLoading, message, className, ...props }, ref) => {
    // Auto-detect loading type based on message or defaults
    const getIndicator = (msg: string | null): LoadingIndicator => {
      if (!msg) return 'spinner'

      const lowerMsg = msg.toLowerCase()

      // Check for file operations
      if (lowerMsg.includes('scan') || lowerMsg.includes('read') || lowerMsg.includes('write')) {
        return 'progress-bar'
      }

      // Check for content loading
      if (lowerMsg.includes('loading') && (lowerMsg.includes('config') || lowerMsg.includes('project') || lowerMsg.includes('data'))) {
        return 'skeleton'
      }

      // Default to spinner
      return 'spinner'
    }

    const indicator = getIndicator(message)

    return (
      <LoadingStates
        ref={ref}
        isLoading={isLoading}
        message={message}
        indicator={indicator}
        className={className}
        {...props}
      />
    )
  }
)
SmartLoadingStates.displayName = 'SmartLoadingStates'

/**
 * Inline loading indicator for buttons and small components
 */
export const InlineLoading = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    message?: string
    size?: 'sm' | 'md'
  }
>(({ className, message, size = 'sm', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn('inline-flex items-center space-x-2', className)}
      {...props}
    >
      <Spinner size={size} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </span>
  )
})
InlineLoading.displayName = 'InlineLoading'

export default LoadingStates
