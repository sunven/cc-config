/**
 * Unified Error Display Component
 *
 * A comprehensive error display component that shows error messages
 * with localized content, actionable suggestions, and retry capabilities.
 */

import { AlertCircle, AlertTriangle, Info, RefreshCw, X } from 'lucide-react'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useErrorStore, TimestampedError } from '../stores/errorStore'
import { formatErrorForDisplay } from '../lib/errorMessages'
import { cn } from '../lib/utils'

interface ErrorDisplayProps {
  className?: string
  maxErrors?: number
  showDismissAll?: boolean
}

/// Get icon based on severity
function getSeverityIcon(severity: 'low' | 'medium' | 'high') {
  switch (severity) {
    case 'high':
      return <AlertCircle className="h-5 w-5 text-destructive" />
    case 'medium':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    case 'low':
      return <Info className="h-5 w-5 text-blue-500" />
  }
}

/// Get background color based on severity
function getSeverityBgClass(severity: 'low' | 'medium' | 'high') {
  switch (severity) {
    case 'high':
      return 'bg-destructive/10 border-destructive/30'
    case 'medium':
      return 'bg-amber-500/10 border-amber-500/30'
    case 'low':
      return 'bg-blue-500/10 border-blue-500/30'
  }
}

/// Individual error item component
interface ErrorItemProps {
  error: TimestampedError
  onDismiss: () => void
  onRetry?: () => void
}

function ErrorItem({ error, onDismiss, onRetry }: ErrorItemProps) {
  const formatted = formatErrorForDisplay(error)
  const { canRetry, isRetrying } = useErrorHandler()
  const canRetryError = canRetry(error)

  // Format timestamp
  const timeAgo = formatTimeAgo(error.timestamp)

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        getSeverityBgClass(formatted.severity)
      )}
    >
      <div className="flex items-start gap-3">
        {getSeverityIcon(formatted.severity)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-foreground">{formatted.title}</h4>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-background/50 rounded transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mt-1">{formatted.message}</p>

          {formatted.code && (
            <span className="inline-block text-xs text-muted-foreground/70 mt-1">
              Error code: {formatted.code}
            </span>
          )}

          {formatted.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">建议:</p>
              <ul className="text-xs text-muted-foreground/80 space-y-1">
                {formatted.suggestions.slice(0, 3).map((suggestion, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground/60">{timeAgo}</span>

            {canRetryError && onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded',
                  'bg-secondary hover:bg-secondary/80 transition-colors',
                  isRetrying && 'opacity-50 cursor-not-allowed'
                )}
              >
                <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
                {isRetrying ? '重试中...' : '重试'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/// Format timestamp to relative time
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
  return `${Math.floor(seconds / 86400)}天前`
}

/// Main error display component
export function ErrorDisplay({ className, maxErrors = 5, showDismissAll = true }: ErrorDisplayProps) {
  const { errors, clearAllErrors, clearError } = useErrorHandler()
  const { setRetrying } = useErrorStore()

  // Get the most recent errors
  const displayedErrors = errors.slice(0, maxErrors)

  if (displayedErrors.length === 0) {
    return null
  }

  const handleRetry = (error: TimestampedError) => {
    // Trigger retry logic
    if (error.recoverable) {
      setRetrying(true)
      // The actual retry would be handled by the component that initiated the operation
      setTimeout(() => setRetrying(false), 1000)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {showDismissAll && displayedErrors.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={clearAllErrors}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清除全部 ({errors.length})
          </button>
        </div>
      )}

      {displayedErrors.map((error, index) => (
        <ErrorItem
          key={error.id}
          error={error}
          onDismiss={() => clearError(index)}
          onRetry={() => handleRetry(error)}
        />
      ))}

      {errors.length > maxErrors && (
        <p className="text-xs text-center text-muted-foreground">
          还有 {errors.length - maxErrors} 个错误未显示
        </p>
      )}
    </div>
  )
}

/// Toast-style error notification
interface ErrorToastProps {
  error: TimestampedError
  onDismiss: () => void
  autoHideDuration?: number
}

export function ErrorToast({ error, onDismiss, autoHideDuration = 5000 }: ErrorToastProps) {
  const formatted = formatErrorForDisplay(error)

  // Auto-hide for low severity errors
  if (autoHideDuration > 0 && formatted.severity === 'low') {
    setTimeout(onDismiss, autoHideDuration)
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border shadow-lg',
        'animate-in slide-in-from-bottom-5 duration-300',
        getSeverityBgClass(formatted.severity)
      )}
    >
      <div className="flex items-start gap-3">
        {getSeverityIcon(formatted.severity)}

        <div className="flex-1">
          <h4 className="font-medium text-foreground">{formatted.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{formatted.message}</p>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 hover:bg-background/50 rounded transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

/// Error summary badge for compact displays
interface ErrorBadgeProps {
  onClick?: () => void
  className?: string
}

export function ErrorBadge({ onClick, className }: ErrorBadgeProps) {
  const { errors, hasErrors } = useErrorHandler()

  if (!hasErrors) return null

  const criticalCount = errors.filter((e) => !e.recoverable).length
  const totalCount = errors.length

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        criticalCount > 0
          ? 'bg-destructive/10 text-destructive'
          : 'bg-amber-500/10 text-amber-600',
        className
      )}
    >
      <AlertCircle className="h-3 w-3" />
      <span>{totalCount}</span>
    </button>
  )
}
